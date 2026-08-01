import { describe, expect, it } from "vitest";

/**
 * A escala de opacidade do Tailwind 3.4 vai de 5 em 5 (0, 5, 10, … 95, 100).
 * Um modificador fora dela — `from-primary/92` — **não gera CSS nenhum**.
 *
 * Isso é um modo de falha mudo: sem erro de build, sem aviso de lint, sem erro
 * de runtime. Quando cai num stop de degradê é pior ainda, porque
 * `--tw-gradient-from` fica indefinido, invalida o `--tw-gradient-stops` e o
 * `background-image` inteiro computa como "none" — o overlay some, e a classe
 * continua lá no DOM enganando quem inspeciona.
 *
 * Já aconteceu duas vezes no hero da home, deixando o texto branco sobre a foto
 * crua. Daí esta trava.
 */
const OPACITY_STEP = 5;

const SOURCES = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

/**
 * Só modificadores numéricos. Valores arbitrários (`from-primary/[0.92]`) são
 * sempre gerados pelo Tailwind e por isso não entram na regra.
 */
const OPACITY_MODIFIER =
  /\b(?:from|via|to|bg|text|border|ring|divide|outline|shadow|fill|stroke|accent|caret|decoration|placeholder)-[a-z][a-z-]*\/(\d+)\b/g;

describe("modificadores de opacidade do Tailwind", () => {
  it("usa apenas valores que existem na escala, para que a classe realmente gere CSS", () => {
    const offScale: string[] = [];

    for (const [path, source] of Object.entries(SOURCES)) {
      if (path.includes("/test/")) continue;

      for (const [className, value] of source.matchAll(OPACITY_MODIFIER)) {
        if (Number(value) % OPACITY_STEP === 0) continue;
        offScale.push(`${path.replace(/^\//, "")} → ${className}`);
      }
    }

    expect([...new Set(offScale)].sort()).toEqual([]);
  });
});
