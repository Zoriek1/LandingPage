import { describe, expect, it } from "vitest";
import { formatBrl, formatInstallments, minPriceLabel, parsePriceBrl } from "@/features/ad-lps/lib/pricing";
import { PRODUCTS } from "@/features/ad-lps/data/configs";

describe("pricing", () => {
  it("parses BRL price strings into numbers", () => {
    expect(parsePriceBrl("R$ 199,90")).toBeCloseTo(199.9);
    expect(parsePriceBrl("R$ 1.234,50")).toBeCloseTo(1234.5);
    expect(parsePriceBrl("R$ 65,00")).toBeCloseTo(65);
  });

  it("formats numbers back into the same BRL convention", () => {
    expect(formatBrl(199.9)).toBe("R$ 199,90");
    expect(formatBrl(66.63)).toBe("R$ 66,63");
    expect(formatBrl(1234.5)).toBe("R$ 1.234,50");
  });

  it("fixes the two installment values that were wrong in the hardcoded strings", () => {
    // R$ 199,90 / 3 = 66,63 — a string antiga dizia R$ 86,63.
    expect(formatInstallments("R$ 199,90")).toBe("3x s/ juros de R$ 66,63");
    // R$ 299,90 / 3 = 99,97 — a string antiga dizia R$ 96,97.
    expect(formatInstallments("R$ 299,90")).toBe("3x s/ juros de R$ 99,97");
  });

  it("computes installments consistently for every product in the catalog", () => {
    for (const product of Object.values(PRODUCTS)) {
      const total = parsePriceBrl(product.priceBrl);
      const installments = formatInstallments(product.priceBrl);
      expect(installments).toMatch(/^3x s\/ juros de R\$ [\d.,]+$/);

      const perInstallment = parsePriceBrl(installments.replace(/^3x s\/ juros de /, ""));
      // Divisão simples: o total de 3 parcelas pode divergir do preço em até
      // poucos centavos por arredondamento — não é bug, é a convenção.
      expect(Math.abs(total - perInstallment * 3)).toBeLessThan(0.03);
    }
  });

  it("derives the lowest real price from a product id list", () => {
    expect(minPriceLabel(["R$ 199,90", "R$ 99,90", "R$ 249,90"])).toBe("R$ 99,90");
  });
});
