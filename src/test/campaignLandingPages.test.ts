import { describe, expect, it } from "vitest";
import { AD_LP_SLUGS } from "@/routes/routeManifest";
import { LP_CONFIGS, PRODUCTS } from "@/features/ad-lps/data/configs";
import { PRICE_RANGE_CONFIGS } from "@/lib/price-ranges";

describe("new campaign landing pages", () => {
  it("registers every planned campaign route", () => {
    expect(AD_LP_SLUGS).toEqual(expect.arrayContaining([
      "so-porque-sim", "buque-real", "reconciliacao", "girassol", "catalogo-precos",
    ]));
  });

  it("matches the planned promises and price floors", () => {
    expect(LP_CONFIGS["so-porque-sim"].headline).toMatch(/não precisa de data/i);
    expect(LP_CONFIGS["buque-real"].headline).toMatch(/foto real/i);
    expect(LP_CONFIGS.reconciliacao.headline).toMatch(/reabrir a conversa/i);
    expect(LP_CONFIGS.reconciliacao.subheadline).toMatch(/R\$ 99,90/i);
    expect(PRICE_RANGE_CONFIGS["/girassol"].lowFloorBrl).toBe("R$ 65,00");
    expect(PRICE_RANGE_CONFIGS["/catalogo-precos"].lowFloorBrl).toBe("R$ 99,90");
  });

  it("keeps product IDs aligned with the product being sold", () => {
    const legacyIds = [
      "arranjo-3-rosas",
      "buque-6-rosas",
      "buque-12-rosas-vermelhas",
      "buque-24-rosas",
      "arranjo-lirios-p",
      "arranjo-mao-lirios",
      "arranjo-lirios-m",
      "buque-lirios",
      "girassol-cone",
      "girassol-unitario",
      "buque-girassois",
      "buque-6-girassois",
    ];

    expect(Object.keys(PRODUCTS)).toEqual(expect.arrayContaining([
      "arranjo-mao-rosas",
      "buque-classico-rosas",
      "buque-rosas-astromelias",
      "buque-30-rosas",
      "arranjo-mao-lirios-p",
      "arranjo-mao-lirios-m",
      "arranjo-mao-lirios-g",
      "buque-lirios-p",
      "girassol-avulso",
      "arranjo-2-girassois-balao",
      "buque-girassois-p",
      "buque-girassois-m",
      "buque-girassois-g",
    ]));
    legacyIds.forEach((id) => expect(PRODUCTS[id]).toBeUndefined());

    expect(PRODUCTS["buque-girassois-p"]).toMatchObject({
      id: "buque-girassois-p",
      name: "Buquê de Girassóis P",
      priceBrl: "R$ 199,90",
      details: { size: "P" },
    });
    expect(PRODUCTS["buque-girassois-m"]).toMatchObject({
      id: "buque-girassois-m",
      name: "Buquê de Girassóis M",
      priceBrl: "R$ 289,90",
      details: { size: "M" },
    });
    expect(PRODUCTS["buque-girassois-g"]).toMatchObject({
      id: "buque-girassois-g",
      name: "Buquê de Girassóis G",
      priceBrl: "R$ 349,90",
      details: { size: "G" },
    });

    Object.entries(PRODUCTS).forEach(([id, product]) => {
      expect(product.id).toBe(id);
    });
  });
});
