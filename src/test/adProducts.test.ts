import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/features/ad-lps/data/configs";

describe("ad LP product data", () => {
  it("keeps priceBrl aligned with waText", () => {
    for (const product of Object.values(PRODUCTS)) {
      const waPrice = product.waText.match(/R\$\s?[0-9.]+,[0-9]{2}/)?.[0]?.replace(/R\$\s?/, "R$ ");
      expect(waPrice, product.id).toBe(product.priceBrl);
    }
  });
});
