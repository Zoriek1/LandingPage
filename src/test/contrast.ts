/** Utilitários WCAG para validar combinações de cores do tema Tailwind. */
export const ON_COLOR_LIGHT = "#f3f5f3";
export const ON_COLOR_DARK = "#141616";
export const WCAG_AA_NORMAL = 4.5;

const HEX_RE = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** `#FFF` / `fff` / `#FfFfFf` -> `#ffffff`. Retorna `null` se inválido. */
export function normalizeHexColor(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!HEX_RE.test(raw)) return null;

  let digits = raw.replace("#", "").toLowerCase();
  if (digits.length === 3) {
    digits = digits
      .split("")
      .map((character) => character + character)
      .join("");
  }

  return `#${digits}`;
}

function toRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex) ?? ON_COLOR_DARK;
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

function channelLuminance(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

/** Luminância relativa WCAG (0 = preto, 1 = branco). */
export function relativeLuminance(hex: string): number {
  const [red, green, blue] = toRgb(hex);
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  );
}

/** Razão de contraste WCAG entre duas cores (1 a 21). */
export function contrastRatio(colorA: string, colorB: string): number {
  const luminanceA = relativeLuminance(colorA);
  const luminanceB = relativeLuminance(colorB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Melhor cor semântica de texto sobre `background`. */
export function onColorFor(background: string): string {
  return contrastRatio(background, ON_COLOR_LIGHT) >=
    contrastRatio(background, ON_COLOR_DARK)
    ? ON_COLOR_LIGHT
    : ON_COLOR_DARK;
}

export function bestContrastRatio(background: string): number {
  return contrastRatio(background, onColorFor(background));
}

/** Indica que nem a melhor cor de texto do tema atinge WCAG AA normal. */
export function hasLowContrast(background: string): boolean {
  return bestContrastRatio(background) < WCAG_AA_NORMAL;
}

/** Mistura duas cores; `weight` é o peso de `from` entre 0 e 1. */
export function mix(from: string, to: string, weight: number): string {
  const [redA, greenA, blueA] = toRgb(from);
  const [redB, greenB, blueB] = toRgb(to);
  const clampedWeight = Math.min(1, Math.max(0, weight));
  const channel = (a: number, b: number) =>
    Math.round(a * clampedWeight + b * (1 - clampedWeight));
  const hex = (value: number) => value.toString(16).padStart(2, "0");

  return `#${hex(channel(redA, redB))}${hex(channel(greenA, greenB))}${hex(
    channel(blueA, blueB),
  )}`;
}

/** Clareia (`amount > 0`) ou escurece (`amount < 0`) uma cor. */
export function shade(hex: string, amount: number): string {
  const target = amount >= 0 ? "#ffffff" : "#000000";
  return mix(target, hex, Math.abs(amount));
}
