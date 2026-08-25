import { describe, expect, it } from "vitest";
import {
  ON_COLOR_DARK,
  ON_COLOR_LIGHT,
  bestContrastRatio,
  contrastRatio,
  hasLowContrast,
  mix,
  normalizeHexColor,
  onColorFor,
  shade,
} from "./contrast";

describe("normalizeHexColor", () => {
  it.each([
    ["#FFF", "#ffffff"],
    ["fff", "#ffffff"],
    ["#102018", "#102018"],
    ["  #102018  ", "#102018"],
  ])("normaliza %s -> %s", (input, expected) => {
    expect(normalizeHexColor(input)).toBe(expected);
  });

  it.each(["", "nope", "#12345", "#gggggg"])("rejeita %s", (input) => {
    expect(normalizeHexColor(input)).toBeNull();
  });

  it("rejeita null e undefined", () => {
    expect(normalizeHexColor(null)).toBeNull();
    expect(normalizeHexColor(undefined)).toBeNull();
  });
});

describe("contraste WCAG", () => {
  it("vai de 1 (cores iguais) a 21 (preto e branco)", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 3);
  });

  it("usa texto claro sobre o primary escuro da marca", () => {
    expect(onColorFor("#102018")).toBe(ON_COLOR_LIGHT);
  });

  it("usa texto escuro sobre branco", () => {
    expect(onColorFor("#ffffff")).toBe(ON_COLOR_DARK);
  });

  it("avisa quando a melhor opção não atinge AA para texto normal", () => {
    expect(hasLowContrast("#777777")).toBe(true);
    expect(hasLowContrast("#102018")).toBe(false);
    expect(bestContrastRatio("#1b84c6")).toBeGreaterThan(3.5);
  });
});

describe("mix e shade", () => {
  it("respeita os extremos do peso", () => {
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#ff0000");
    expect(mix("#ff0000", "#0000ff", 0)).toBe("#0000ff");
  });

  it("clareia e escurece", () => {
    const base = "#102018";
    expect(bestContrastRatio(shade(base, 0.5))).not.toBe(bestContrastRatio(base));
    expect(shade("#000000", 1)).toBe("#ffffff");
    expect(shade("#ffffff", -1)).toBe("#000000");
  });
});
