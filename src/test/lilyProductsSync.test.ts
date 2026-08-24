import snapshot from "@/data/lily-products.snapshot.json";
import { describe, expect, it, vi } from "vitest";
import {
  isCompleteLilyFamily,
  parseLilyFamilyPage,
} from "../../scripts/lily-products/product-parser.mjs";
import { buildLilyCatalogSnapshot } from "../../scripts/lily-products/sync.mjs";

const htmlWithVariants = (variants: unknown[]) =>
  `<html><script>window.LS = window.LS || {}; LS.variants = ${JSON.stringify(variants)};</script></html>`;

const arranjoVariants = [
  { option0: "Rosa", option1: "M (2 Galhos)", price_short: "R$229,90", available: true, image_url: "//cdn.test/arr-m.webp" },
  { option0: "Rosa", option1: "P (1 Galho)", price_short: "R$159,90", available: true, image_url: "//cdn.test/arr-p.webp" },
  { option0: "Rosa", option1: "G (3 Galhos)", price_short: "R$289,90", available: true, image_url: "//cdn.test/arr-g.webp" },
  { option0: "Branca", option1: "P (1 Galho)", price_short: "R$149,90", available: true, image_url: "//cdn.test/white.webp" },
];

const buqueVariants = [
  { option0: "P (3 hastes)", option1: "Rosa", price_short: "R$299,90", available: true, image_url: "//cdn.test/buq-p.webp" },
  { option0: "M (4 hastes)", option1: "Rosa", price_short: "R$389,90", available: true, image_url: "//cdn.test/buq-m.webp" },
  { option0: "G (5 hastes)", option1: "Rosa", price_short: "R$424,90", available: true, image_url: "//cdn.test/buq-g.webp" },
  { option0: "P (3 hastes)", option1: "Branca", price_short: "R$299,90", available: true, image_url: "//cdn.test/white.webp" },
];

describe("sync do catálogo de lírios", () => {
  it("detecta tamanho e cor mesmo quando option0 e option1 trocam de ordem", () => {
    const arranjo = parseLilyFamilyPage({
      html: htmlWithVariants(arranjoVariants),
      family: "arranjo",
      sourceUrl: "https://example.test/arranjo",
    });
    const buque = parseLilyFamilyPage({
      html: htmlWithVariants(buqueVariants),
      family: "buque",
      sourceUrl: "https://example.test/buque",
    });

    expect(arranjo.products.map((product) => product.size)).toEqual(["P", "M", "G"]);
    expect(arranjo.products.map((product) => product.priceBrl)).toEqual([
      "R$ 159,90",
      "R$ 229,90",
      "R$ 289,90",
    ]);
    expect(buque.products.map((product) => product.priceBrl)).toEqual([
      "R$ 299,90",
      "R$ 389,90",
      "R$ 424,90",
    ]);
    expect(
      [...arranjo.products, ...buque.products].every(
        (product) =>
          product.image.startsWith("https://") && product.waText.includes(product.priceBrl),
      ),
    ).toBe(true);
    expect(isCompleteLilyFamily(arranjo)).toBe(true);
    expect(isCompleteLilyFamily(buque)).toBe(true);
  });

  it("preserva atomicamente a família antiga quando uma das três variantes falha", async () => {
    const logger = { warn: vi.fn(), info: vi.fn() };
    const next = await buildLilyCatalogSnapshot({
      snapshot,
      logger,
      fetchHtml: async (url: string) =>
        url.includes("arranjo")
          ? htmlWithVariants(
              arranjoVariants.map((variant) => ({
                ...variant,
                price_short:
                  variant.option1.startsWith("P")
                    ? "R$169,90"
                    : variant.price_short,
              })),
            )
          : htmlWithVariants(buqueVariants.slice(0, 2)),
    });

    expect(next.families.arranjo.products[0].priceBrl).toBe("R$ 169,90");
    expect(next.families.buque).toEqual(snapshot.families.buque);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("snapshot preservado"));
  });

  it("recusa uma família que não tenha exatamente P, M e G rosa válidos", () => {
    expect(() =>
      parseLilyFamilyPage({
        html: htmlWithVariants(buqueVariants.slice(0, 2)),
        family: "buque",
        sourceUrl: "https://example.test/buque",
      }),
    ).toThrow(/P, M e G/);
  });
});
