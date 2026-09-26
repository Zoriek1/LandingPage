// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("tracking.ts under SSR (no window)", () => {
  it("imports without throwing when window is undefined", async () => {
    expect(typeof window).toBe("undefined");
    await expect(import("@/lib/tracking")).resolves.toBeDefined();
  });

  it("getGaIds devolve objeto vazio sem document", async () => {
    const { getGaIds } = await import("@/lib/attribution");
    expect(getGaIds()).toEqual({});
  });
});
