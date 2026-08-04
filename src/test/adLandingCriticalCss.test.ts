// @vitest-environment node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Verifica que o HTML estático gerado pelo prerender-ad-lps.mjs contém:
 * 1. <style> inline com @font-face e .ad-lp-hero (CSS crítico da primeira dobra)
 * 2. A folha completa da LP carregada de forma não-bloqueante
 *    (media="print" onload="this.media='all'")
 * 3. NENHUM <link rel="preload" as="font"> (removido em T6 — competia com
 *    a imagem LCP no throttling)
 */

const DIST_DIR = join(process.cwd(), "dist");

function readDistHtml(slug: string): string {
  return readFileSync(join(DIST_DIR, `${slug}.html`), "utf8");
}

describe("critical CSS inline in dist HTML", () => {
  it("contains inline <style> with @font-face and .ad-lp-hero rules", () => {
    const html = readDistHtml("lirios-apt");

    // Deve existir pelo menos um <style> inline (não <link rel="stylesheet">).
    expect(html).toMatch(/<style[^>]*>/);

    // O CSS crítico inline contém @font-face (Montserrat/Playfair).
    expect(html).toMatch(/@font-face/);

    // O CSS crítico inline contém regras da primeira dobra (.ad-lp-hero).
    expect(html).toMatch(/\.ad-lp-hero/);
  });

  it("loads the full LP stylesheet non-blocking via media=print onload", () => {
    const html = readDistHtml("lirios-apt");

    // A folha completa da LP deve usar o padrão não-bloqueante:
    // <link rel="stylesheet" href="..." media="print" onload="this.media='all'">
    expect(html).toMatch(/media="print"/);
    expect(html).toMatch(/onload="this\.media='all'"/);

    // Deve existir um <noscript> fallback para navegadores sem JS.
    expect(html).toMatch(/<noscript>/);
  });

  it("has NO font preload link competing with the LCP image", () => {
    const html = readDistHtml("lirios-apt");

    // T6 removeu o <link rel="preload" as="font"> do <head> porque ele
    // competia com a imagem LCP no throttling de rede mobile.
    expect(html).not.toMatch(/<link[^>]*preload[^>]*font/i);
  });

  it("has the hero CTA as an <a> tag in the static HTML", () => {
    const html = readDistHtml("lirios-apt");

    // D1: o CTA principal é um <a href="https://wa.me/..."> funcional sem JS.
    expect(html).toMatch(/data-testid="ad-lp-cta-hero"/);
    expect(html).toMatch(/href="https:\/\/wa\.me\/5562996503403"/);
  });
});