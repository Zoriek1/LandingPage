import { JSDOM, VirtualConsole } from "jsdom";

const PRICE_PATTERN = /R\$\s*([\d.]+,\d{2})/g;
const PIX_SECTION_PATTERN =
  /Pix([\s\S]{0,500}?)(?:Carteira virtual|Cart[õo]es de cr[eé]dito|Boleto|Voltar ao produto|Descri[cç][aã]o|$)/i;

const normalizeWhitespace = (value = "") => value.replace(/\s+/g, " ").trim();

const toPriceLabel = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    })
      .format(value)
      .replace(/\u00A0/g, " ");
  }

  if (typeof value !== "string") {
    return "";
  }

  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? toPriceLabel(parsed) : "";
};

const priceLabelToNumber = (value = "") => {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const getCurrencyMatches = (value = "") => {
  const matches = [];

  for (const match of value.matchAll(PRICE_PATTERN)) {
    const label = toPriceLabel(match[1]);
    if (label && !matches.includes(label)) {
      matches.push(label);
    }
  }

  return matches;
};

const slugFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean).at(-1) ?? "";
  } catch {
    return "";
  }
};

const readStructuredProduct = (document) => {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  const queue = [];

  for (const script of scripts) {
    const raw = normalizeWhitespace(script.textContent ?? "");
    if (!raw) {
      continue;
    }

    try {
      queue.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }

  while (queue.length > 0) {
    const current = queue.shift();

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (!current || typeof current !== "object") {
      continue;
    }

    if (Array.isArray(current["@graph"])) {
      queue.push(...current["@graph"]);
    }

    const currentType = current["@type"];
    const typeList = Array.isArray(currentType) ? currentType : [currentType];

    if (typeList.some((type) => String(type).toLowerCase() === "product")) {
      return current;
    }
  }

  return null;
};

const resolveAbsoluteUrl = (value, baseUrl) => {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return String(value).trim();
  }
};

const pickCanonicalUrl = (document, baseUrl) => {
  const canonicalCandidate =
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
    document.querySelector('meta[property="og:url"]')?.getAttribute("content");

  return resolveAbsoluteUrl(canonicalCandidate?.trim() ?? "", baseUrl);
};

const pickImageUrl = (document, structuredProduct, baseUrl) => {
  const structuredImage = structuredProduct?.image;

  if (typeof structuredImage === "string" && structuredImage.trim()) {
    return resolveAbsoluteUrl(structuredImage.trim(), baseUrl);
  }

  if (Array.isArray(structuredImage)) {
    const firstImage = structuredImage.find((value) => typeof value === "string" && value.trim());
    if (firstImage) {
      return resolveAbsoluteUrl(firstImage.trim(), baseUrl);
    }
  }

  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
  if (ogImage?.trim()) {
    return resolveAbsoluteUrl(ogImage.trim(), baseUrl);
  }

  const firstImage = document.querySelector('img[src^="http"]')?.getAttribute("src");
  return resolveAbsoluteUrl(firstImage?.trim() ?? "", baseUrl);
};

const normalizeTitleForCompare = (value = "") =>
  normalizeWhitespace(value)
    .replace(/\s+\|\s+.*$/, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * O JSON-LD da loja nem sempre descreve o produto da própria página: em
 * /produtos/buque-classico-rosas/ o h1 e o og:title dizem "Buquê Clássico de
 * Rosas Vermelhas" (R$ 199,90), mas o dado estruturado diz "Buquê Especial 30
 * Rosas Vermelhas" (R$ 680,00). Como o parser preferia o estruturado, a home
 * anunciava o título e o preço do produto errado.
 *
 * Quando o estruturado contradiz o que a página mostra, ele é descartado por
 * inteiro e a leitura cai no DOM — que é justamente o que o cliente vê.
 */
const describesSamePageProduct = (document, structuredProduct) => {
  const structuredName = normalizeTitleForCompare(structuredProduct?.name ?? "");
  if (!structuredName) return true;

  const pageTitle = normalizeTitleForCompare(
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      document.querySelector("h1")?.textContent ||
      "",
  );
  if (!pageTitle) return true;

  return structuredName === pageTitle;
};

const pickTitle = (document, structuredProduct) => {
  const titleCandidates = [
    structuredProduct?.name,
    document.querySelector("h1")?.textContent,
    document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
    document.title,
  ];

  for (const candidate of titleCandidates) {
    const title = normalizeWhitespace(candidate ?? "");
    if (title) {
      return title.replace(/\s+\|\s+.*$/, "");
    }
  }

  return "";
};

/**
 * document.body.textContent inclui o conteúdo dos <script>, e o JSON-LD da loja
 * repete o título do produto. Sem remover os scripts, procurar o título no
 * corpo caía dentro do JSON em vez do cabeçalho visível.
 */
const getVisibleBodyText = (document) => {
  const body = document.body?.cloneNode(true);
  if (!body) return "";

  for (const node of body.querySelectorAll("script, style, noscript, template")) {
    node.remove();
  }

  return normalizeWhitespace(body.textContent ?? "");
};

/**
 * Uma página de produto também lista relacionados e variações, cada um com o
 * seu preço. O bloco que descreve ESTE produto é o que vem logo depois do
 * título — restringir a leitura a essa janela é o que impede pegar o valor do
 * vizinho.
 */
const HEADER_SLICE_LENGTH = 600;

const getHeaderSlice = (bodyText, title) => {
  if (!title) return bodyText.slice(0, HEADER_SLICE_LENGTH);

  // O título aparece em menus e breadcrumbs antes do bloco de compra, então a
  // primeira ocorrência nem sempre é a certa. Vale a primeira que traz um preço
  // junto — essa é a do produto.
  for (let index = bodyText.indexOf(title); index >= 0; index = bodyText.indexOf(title, index + 1)) {
    const slice = bodyText.slice(index, index + HEADER_SLICE_LENGTH);
    if (getCurrencyMatches(slice).some((label) => priceLabelToNumber(label) > 0)) {
      return slice;
    }
  }

  return bodyText.slice(0, HEADER_SLICE_LENGTH);
};

const pickPriceLabel = (document, structuredProduct, title) => {
  const structuredOffers = structuredProduct?.offers;
  const offerCandidates = Array.isArray(structuredOffers) ? structuredOffers : [structuredOffers];

  for (const offer of offerCandidates) {
    const label = toPriceLabel(offer?.price);
    if (label) {
      return label;
    }
  }

  const bodyText = getVisibleBodyText(document);
  // "Frete R$ 0,00" e afins aparecem no cabeçalho; preço de produto é positivo.
  const isPositive = (label) => priceLabelToNumber(label) > 0;

  return (
    getCurrencyMatches(getHeaderSlice(bodyText, title)).find(isPositive) ??
    getCurrencyMatches(bodyText).find(isPositive) ??
    ""
  );
};

/** A loja escreve "R$ 189,91 com Pix" — o valor vem antes da palavra. */
const PIX_VALUE_BEFORE_PATTERN =
  /(R\$\s?[\d.]*\d,\d{2})\s*(?:[àa]\s*vista\s*)?(?:com|no|via)\s+pix/gi;

const pickPixPriceLabel = (document, priceLabel, title) => {
  const currentPrice = priceLabelToNumber(priceLabel);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return undefined;
  }

  const bodyText = getVisibleBodyText(document);
  const headerSlice = getHeaderSlice(bodyText, title);

  // Só o cabeçalho: uma página de lírios chega a ter seis "com Pix", e os
  // outros cinco são de produtos relacionados.
  const candidates = [
    // toPriceLabel para o Pix sair no mesmo formato do preço cheio.
    ...[...headerSlice.matchAll(PIX_VALUE_BEFORE_PATTERN)].map((match) => toPriceLabel(match[1])),
    ...getCurrencyMatches(headerSlice.match(PIX_SECTION_PATTERN)?.[1] ?? ""),
  ];

  const coherent = candidates.filter((candidate) => {
    const value = priceLabelToNumber(candidate);
    return Number.isFinite(value) && value < currentPrice && value / currentPrice >= MIN_PIX_RATIO;
  });

  // O primeiro em ordem de leitura é o que fica colado no preço do produto.
  return coherent[0];
};

export const parseFeaturedProductPage = ({ html, url }) => {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(html, {
    url,
    virtualConsole,
  });
  const document = dom.window.document;
  const rawStructuredProduct = readStructuredProduct(document);
  const structuredProduct = describesSamePageProduct(document, rawStructuredProduct)
    ? rawStructuredProduct
    : undefined;
  const title = pickTitle(document, structuredProduct);
  const priceLabel = pickPriceLabel(document, structuredProduct, title);

  return {
    slug: slugFromUrl(url),
    title,
    url,
    canonicalUrl: pickCanonicalUrl(document, url),
    imageUrl: pickImageUrl(document, structuredProduct, url),
    priceLabel,
    pixPriceLabel: pickPixPriceLabel(document, priceLabel, title),
  };
};

export const isValidFeaturedProduct = (product) =>
  Boolean(
    product &&
      product.slug &&
      product.title &&
      product.url &&
      typeof product.imageUrl === "string" &&
      // "R$ 0,00" é string não-vazia e passava como preço válido.
      priceLabelToNumber(product.priceLabel ?? "") > 0,
  );

/**
 * O preço à vista e o preço no Pix são um par: só fazem sentido juntos.
 * Um Pix maior que o preço cheio, ou um desconto absurdo, quer dizer que os
 * dois vieram de fontes diferentes — foi assim que a home passou a anunciar
 * "R$ 144,90, Pix R$ 275,41" e "R$ 680,00, Pix R$ 189,91" em produção.
 */
const MIN_PIX_RATIO = 0.8;

export const hasCoherentPixPrice = (product) => {
  if (!product?.pixPriceLabel) return true;

  const price = priceLabelToNumber(product.priceLabel ?? "");
  const pix = priceLabelToNumber(product.pixPriceLabel);
  if (!Number.isFinite(price) || !Number.isFinite(pix) || price <= 0) return false;

  const ratio = pix / price;
  return ratio >= MIN_PIX_RATIO && ratio < 1;
};

/** Melhor um card sem preço no Pix do que com um preço que não é praticado. */
export const dropIncoherentPixPrice = (product) => {
  if (hasCoherentPixPrice(product)) return product;
  const { pixPriceLabel, ...rest } = product;
  return rest;
};

export { priceLabelToNumber, slugFromUrl, toPriceLabel };
