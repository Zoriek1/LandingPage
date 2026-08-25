import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import tailwindConfig from "../../tailwind.config";

const generatedTokens = readFileSync(
  path.join(process.cwd(), "src/styles/tokens.generated.css"),
  "utf8",
);

const SOURCES = import.meta.glob<string>(["/src/**/*.tsx", "/src/**/*.css"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const COLOR_LITERAL =
  /#(?:[\da-fA-F]{8}|[\da-fA-F]{6}|[\da-fA-F]{4}|[\da-fA-F]{3})(?![\da-fA-F])|(?:hsl|rgb)a?\s*\(\s*[-+]?(?:\d|\.\d)[^)]*\)/g;

type Violation = {
  path: string;
  line: number;
  column: number;
  literal: string;
};

function locate(source: string, offset: number) {
  const before = source.slice(0, offset);
  const lines = before.split("\n");
  return { line: lines.length, column: lines.at(-1)!.length + 1 };
}

/**
 * Exclusões permitidas:
 * - components/ui/: biblioteca shadcn/ui
 * - tokens.generated.css: arquivo gerado pelo build do design system
 * - features/ad-lps/: sistema legado de landing pages de anúncio com namespace próprio --ad-*
 * - test/: arquivos de teste que contêm fixtures de contraste/cores
 */
function isExcluded(path: string): boolean {
  if (path.includes("/components/ui/")) return true;
  if (path.includes("tokens.generated.css")) return true;
  if (path.includes("/features/ad-lps/")) return true;
  if (path.includes("/test/")) return true;
  return false;
}

function literalColorViolations(): Violation[] {
  const violations: Violation[] = [];

  for (const [absolutePath, source] of Object.entries(SOURCES)) {
    const path = absolutePath.replace(/^\//, "");
    if (isExcluded(path)) continue;

    for (const match of source.matchAll(COLOR_LITERAL)) {
      const { line, column } = locate(source, match.index);
      violations.push({ path, line, column, literal: match[0] });
    }
  }

  return violations.sort(
    (a, b) =>
      a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column,
  );
}

describe("theme.tokens — Tailwind", () => {
  it("mantém tipografia e cores semânticas ligadas aos CSS custom properties", () => {
    const extend = tailwindConfig.theme?.extend;
    const colors = extend?.colors as Record<string, string | { DEFAULT?: string }>;

    expect(extend?.fontFamily?.display).toEqual(["var(--font-display)"]);
    expect(extend?.fontFamily?.body).toEqual(["var(--font-body)"]);
    expect(generatedTokens).toContain("--font-display: 'Fraunces'");
    expect(generatedTokens).toContain("--font-body: 'Jost'");
    expect(colors.primary).toMatchObject({ DEFAULT: "hsl(var(--primary))" });
    expect(colors.accent).toMatchObject({ DEFAULT: "hsl(var(--accent))" });
    expect(colors.background).toBe("hsl(var(--background))");
    expect(colors.foreground).toBe("hsl(var(--foreground))");
  });

  it("não permite hex, hsl() ou rgb() literal em .tsx ou .css fora de exclusões documentadas", () => {
    const violations = literalColorViolations().map(
      ({ path, line, column, literal }) => `${path}:${line}:${column} -> ${literal}`,
    );

    expect(violations).toEqual([]);
  });
});
