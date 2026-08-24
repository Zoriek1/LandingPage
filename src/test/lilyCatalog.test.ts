import { describe, expect, it } from "vitest";
import { LILY_PRODUCTS, LILY_PRODUCTS_BY_ID } from "@/data/lily-products";
import { LP_CONFIGS, PRODUCTS } from "@/features/ad-lps/data/configs";
import { formatInstallments } from "@/features/ad-lps/lib/pricing";
import { PRICE_RANGE_CONFIGS } from "@/lib/price-ranges";

const EXPECTED_PRICES = {
  "arranjo-mao-lirios-p": "R$ 159,90",
  "arranjo-mao-lirios-m": "R$ 229,90",
  "arranjo-mao-lirios-g": "R$ 289,90",
  "buque-lirios-p": "R$ 299,90",
  "buque-lirios-m": "R$ 389,90",
  "buque-lirios-g": "R$ 424,90",
} as const;

describe("catálogo sistêmico de lírios", () => {
  it("propaga os seis preços, imagens e mensagens do snapshot para PRODUCTS", () => {
    expect(LILY_PRODUCTS).toHaveLength(6);
    for (const [id, price] of Object.entries(EXPECTED_PRICES)) {
      expect(PRODUCTS[id].priceBrl).toBe(price);
      expect(PRODUCTS[id].image).toBe(LILY_PRODUCTS_BY_ID[id].image);
      expect(PRODUCTS[id].waText).toContain(price);
      expect(formatInstallments(PRODUCTS[id].priceBrl)).toMatch(/^3x s\/ juros de R\$/);
    }
  });

  it("mantém a mesma fonte em todas as LPs que reutilizam um dos seis IDs", () => {
    for (const config of Object.values(LP_CONFIGS)) {
      for (const id of config.vitrineProductIds) {
        if (!(id in EXPECTED_PRICES)) continue;
        expect(PRODUCTS[id].priceBrl, `${config.slug}:${id}`).toBe(
          EXPECTED_PRICES[id as keyof typeof EXPECTED_PRICES],
        );
      }
    }
  });

  it("deriva headline, SEO, faixas e piso do seletor do menor preço atual", () => {
    const config = LP_CONFIGS["lirios-apt"];
    expect(config.headline).toContain(EXPECTED_PRICES["arranjo-mao-lirios-p"]);
    expect(config.pageTitle).toContain(EXPECTED_PRICES["arranjo-mao-lirios-p"]);
    expect(config.pageDescription).toContain(EXPECTED_PRICES["arranjo-mao-lirios-p"]);
    expect(config.vitrineIntroLines?.[0].productIds).toEqual([
      "arranjo-mao-lirios-p",
      "arranjo-mao-lirios-m",
      "arranjo-mao-lirios-g",
    ]);
    expect(PRICE_RANGE_CONFIGS["/lirios-apt"].lowFloorBrl).toBe(
      EXPECTED_PRICES["arranjo-mao-lirios-p"],
    );
    expect(PRICE_RANGE_CONFIGS["/lirios-apt"].ranges[1].label).toContain(
      EXPECTED_PRICES["buque-lirios-m"],
    );
  });

  it("deixa o override exclusivo da rota vazio sem afetar preço", () => {
    const config = LP_CONFIGS["lirios-apt"];
    expect(config.productImageOverrides).toEqual({});
    expect(PRODUCTS["buque-lirios-g"].priceBrl).toBe("R$ 424,90");
  });
});
