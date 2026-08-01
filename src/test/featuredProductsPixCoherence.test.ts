// @vitest-environment node

import { describe, expect, it } from "vitest";
import homeProducts from "@/data/featured-products.snapshot.json";
import mothersDayProducts from "@/features/mothers-day/data/featured-products.snapshot.json";
import namoradosProducts from "@/features/namorados/data/featured-products.snapshot.json";
import {
  dropIncoherentPixPrice,
  hasCoherentPixPrice,
} from "../../scripts/mothers-day-products/product-parser.mjs";

/**
 * O preço à vista e o preço no Pix são um par. O sync antigo fazia merge campo
 * a campo com o snapshot, então quando o parser não achava o Pix da página o
 * produto saía com preço novo e Pix velho — e a home chegou a anunciar em
 * produção "R$ 144,90, Pix R$ 275,41" (Pix quase o dobro do preço cheio) e
 * "R$ 680,00, Pix R$ 189,91".
 */
const SNAPSHOTS = {
  home: homeProducts,
  "dia-das-maes": mothersDayProducts,
  "dia-dos-namorados": namoradosProducts,
} as const;

describe("coerência entre preço e Pix", () => {
  it("rejeita um Pix maior que o preço cheio", () => {
    expect(
      hasCoherentPixPrice({ priceLabel: "R$ 144,90", pixPriceLabel: "R$ 275,41" }),
    ).toBe(false);
  });

  it("rejeita um desconto grande demais para ser Pix", () => {
    expect(
      hasCoherentPixPrice({ priceLabel: "R$ 680,00", pixPriceLabel: "R$ 189,91" }),
    ).toBe(false);
  });

  it("aceita o desconto real da loja e a ausência de Pix", () => {
    expect(
      hasCoherentPixPrice({ priceLabel: "R$ 99,90", pixPriceLabel: "R$ 94,91" }),
    ).toBe(true);
    expect(hasCoherentPixPrice({ priceLabel: "R$ 99,90" })).toBe(true);
  });

  it("descarta só o Pix, preservando o resto do produto", () => {
    const repaired = dropIncoherentPixPrice({
      slug: "buque-girassois",
      title: "Buquê de Girassóis",
      priceLabel: "R$ 144,90",
      pixPriceLabel: "R$ 275,41",
    });

    expect(repaired).not.toHaveProperty("pixPriceLabel");
    expect(repaired.priceLabel).toBe("R$ 144,90");
    expect(repaired.title).toBe("Buquê de Girassóis");
  });

  it("mantém os snapshots publicados livres de Pix incoerente", () => {
    for (const [page, products] of Object.entries(SNAPSHOTS)) {
      const broken = (products as { slug: string; priceLabel: string; pixPriceLabel?: string }[])
        .filter((product) => !hasCoherentPixPrice(product))
        .map((product) => `${page}/${product.slug}: ${product.priceLabel} → ${product.pixPriceLabel}`);

      expect(broken).toEqual([]);
    }
  });
});
