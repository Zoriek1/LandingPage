import { describe, expect, it } from "vitest";
import { AD_LP_SLUGS } from "@/routes/routeManifest";
import { LP_CONFIGS } from "@/features/ad-lps/data/configs";
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
    expect(LP_CONFIGS.reconciliacao.headline).toMatch(/erro/i);
    expect(PRICE_RANGE_CONFIGS["/girassol"].lowFloorBrl).toBe("R$ 65,00");
    expect(PRICE_RANGE_CONFIGS["/catalogo-precos"].lowFloorBrl).toBe("R$ 99,90");
  });
});
