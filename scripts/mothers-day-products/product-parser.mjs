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

const pickPriceLabel = (document, structuredProduct, title) => {
  const structuredOffers = structuredProduct?.offers;
  const offerCandidates = Array.isArray(structuredOffers) ? structuredOffers : [structuredOffers];

  for (const offer of offerCandidates) {
    const label = toPriceLabel(offer?.price);
    if (label) {
      return label;
    }
  }

  const bodyText = normalizeWhitespace(document.body?.textContent ?? "");
  const titleIndex = title ? bodyText.indexOf(title) : -1;
  const headerSlice = titleIndex >= 0 ? bodyText.slice(titleIndex, titleIndex + 600) : bodyText.slice(0, 600);
  return getCurrencyMatches(headerSlice)[0] ?? getCurrencyMatches(bodyText)[0] ?? "";
};

const pickPixPriceLabel = (document, priceLabel) => {
  const bodyText = normalizeWhitespace(document.body?.textContent ?? "");
  const pixSection = bodyText.match(PIX_SECTION_PATTERN)?.[1] ?? "";
  const pixCandidates = getCurrencyMatches(pixSection);

  if (pixCandidates.length === 0) {
    return undefined;
  }

  const currentPrice = priceLabelToNumber(priceLabel);
  const validCandidates = pixCandidates.filter((candidate) => {
    const candidatePrice = priceLabelToNumber(candidate);
    return Number.isFinite(candidatePrice) && (!Number.isFinite(currentPrice) || candidatePrice <= currentPrice);
  });

  if (validCandidates.length === 0) {
    return undefined;
  }

  const sorted = validCandidates.sort((left, right) => priceLabelToNumber(left) - priceLabelToNumber(right));
  const pixPrice = sorted[0];
  return pixPrice !== priceLabel ? pixPrice : undefined;
};

export const parseFeaturedProductPage = ({ html, url }) => {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(html, {
    url,
    virtualConsole,
  });
  const document = dom.window.document;
  const structuredProduct = readStructuredProduct(document);
  const title = pickTitle(document, structuredProduct);
  const priceLabel = pickPriceLabel(document, structuredProduct, title);

  return {
    slug: slugFromUrl(url),
    title,
    url,
    canonicalUrl: pickCanonicalUrl(document, url),
    imageUrl: pickImageUrl(document, structuredProduct, url),
    priceLabel,
    pixPriceLabel: pickPixPriceLabel(document, priceLabel),
  };
};

export const isValidFeaturedProduct = (product) =>
  Boolean(
    product &&
      product.slug &&
      product.title &&
      product.url &&
      typeof product.imageUrl === "string" &&
      product.priceLabel,
  );

export { slugFromUrl, toPriceLabel };
