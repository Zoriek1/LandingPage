const SIZE_ORDER = ["P", "M", "G"];

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizePrice = (value = "") => {
  const match = String(value).match(/R\$\s*([\d.]+,\d{2})/i);
  return match ? `R$ ${match[1]}` : "";
};

const normalizeImage = (value = "") => {
  const image = String(value).trim();
  if (image.startsWith("//")) return `https:${image}`;
  if (image.startsWith("http://")) return image.replace(/^http:/, "https:");
  return image;
};

const findSize = (variant) => {
  for (const option of [variant.option0, variant.option1, variant.option2]) {
    const match = normalize(option).toUpperCase().match(/(?:^|\s)([PMG])(?:\s|$)/);
    if (match) return match[1];
  }
  return "";
};

const isPink = (variant) =>
  [variant.option0, variant.option1, variant.option2].some((option) =>
    /(?:^|\s)rosa(?:\s|$)/i.test(normalize(option)),
  );

export function extractStoreVariants(html) {
  const match = String(html).match(/LS\.variants\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("Bloco LS.variants não encontrado");

  const variants = JSON.parse(match[1]);
  if (!Array.isArray(variants)) throw new Error("LS.variants não é uma lista");
  return variants;
}

export function parseLilyFamilyPage({ html, family, sourceUrl }) {
  const familyMeta =
    family === "arranjo"
      ? { idPrefix: "arranjo-mao-lirios", storeSlug: "arranjo-mao-lirios", name: "Arranjo de Mão Lírios" }
      : { idPrefix: "buque-lirios", storeSlug: "buque-lirios", name: "Buquê de Lírios" };

  const bySize = new Map();
  for (const variant of extractStoreVariants(html)) {
    if (!variant?.available || !isPink(variant)) continue;
    const size = findSize(variant);
    const priceBrl = normalizePrice(variant.price_short ?? variant.price);
    const image = normalizeImage(variant.image_url ?? variant.featured_image?.src);
    if (!SIZE_ORDER.includes(size) || !priceBrl || !/^https:\/\//.test(image)) continue;
    if (!bySize.has(size)) bySize.set(size, { size, priceBrl, image });
  }

  if (!SIZE_ORDER.every((size) => bySize.has(size))) {
    throw new Error(`Família ${family} não contém as variantes rosa P, M e G válidas`);
  }

  return {
    sourceUrl,
    products: SIZE_ORDER.map((size) => {
      const variant = bySize.get(size);
      const name = `${familyMeta.name} ${size}`;
      return {
        id: `${familyMeta.idPrefix}-${size.toLowerCase()}`,
        family,
        size,
        storeSlug: familyMeta.storeSlug,
        name,
        priceBrl: variant.priceBrl,
        image: variant.image,
        waText: `Oi! Quero o ${name} (${variant.priceBrl}).`,
      };
    }),
  };
}

export function isCompleteLilyFamily(family) {
  return Boolean(
    family?.sourceUrl &&
      Array.isArray(family.products) &&
      family.products.length === 3 &&
      SIZE_ORDER.every((size) =>
        family.products.some(
          (product) =>
            product.size === size &&
            /^R\$ \d{1,3}(?:\.\d{3})*,\d{2}$/.test(product.priceBrl) &&
            /^https:\/\//.test(product.image) &&
            product.waText.includes(product.priceBrl),
        ),
      ),
  );
}
