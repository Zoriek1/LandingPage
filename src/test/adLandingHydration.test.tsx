import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdLandingPage from "@/features/ad-lps/AdLandingPage";

/**
 * Verifica o par SSR (entry-server.tsx) + hidratação (entry-client.tsx) sem
 * passar pelos entries de build: renderiza a mesma árvore duas vezes (uma pra
 * string, uma pra hidratar em cima), exatamente como acontece em produção
 * quando o navegador já tem o HTML pré-renderizado e o JS chega depois.
 */

const containers: HTMLElement[] = [];

function hydrateSlug(slug: string) {
  const html = renderToString(<AdLandingPage slug={slug} />);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  containers.push(container);

  hydrateRoot(container, <AdLandingPage slug={slug} />);
  return container;
}

afterEach(() => {
  while (containers.length) {
    containers.pop()?.remove();
  }
  vi.restoreAllMocks();
});

// Duas mensagens conhecidas e inofensivas do console NÃO contam como mismatch
// de hidratação, e ficam de fora de propósito:
// - "React does not recognize the `fetchPriority` prop": aviso pré-existente,
//   dispara em qualquer render (CSR ou SSR), sem relação com este trabalho.
// - "useLayoutEffect does nothing on the server" (Radix Dialog/Presence): aviso
//   de uso de SSR do Radix, dispara sempre que o Dialog existe na árvore
//   independente de estar aberto — não indica que o conteúdo divergiu entre
//   servidor e cliente (o Dialog fechado não renderiza nada nos dois lados).
// O padrão abaixo casa só a frase que o React usa para um mismatch de verdade.
const HYDRATION_MISMATCH_PATTERN =
  /Hydration failed|did not match|Text content does not match|Expected server HTML|error occurred during hydration|error while hydrating/i;

describe("AdLandingPage: SSR markup hydrates cleanly", () => {
  it("hydrates without hydration-mismatch warnings for lirios-apt", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const container = hydrateSlug("lirios-apt");

    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="ad-lp-hero-image"]')).toHaveLength(1);
    });

    const mismatchWarnings = consoleErrorSpy.mock.calls
      .map((args) => args.map(String).join(" "))
      .filter((msg) => HYDRATION_MISMATCH_PATTERN.test(msg));

    expect(mismatchWarnings).toEqual([]);
  });

  it("does not duplicate the DOM after hydrating", async () => {
    const container = hydrateSlug("lirios-apt");

    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="ad-lp-hero-image"]')).toHaveLength(1);
    });

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="ad-lp-cta-hero"]')).toHaveLength(1);
    expect(container.querySelectorAll('[id="root"], .ad-lp-theme')).toHaveLength(1);
  });

  it("keeps the hero CTA functional the instant hydration completes", async () => {
    const container = hydrateSlug("lirios-apt");

    const cta = await waitFor(() => {
      const el = container.querySelector<HTMLButtonElement>('[data-testid="ad-lp-cta-hero"]');
      if (!el) throw new Error("CTA not hydrated yet");
      return el;
    });

    cta.click();

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    });
  });

  it("hydrates every prerendered slug without throwing", async () => {
    const slugs = ["urgencia", "presente-hoje", "rosas-apt", "aniversario"];
    for (const slug of slugs) {
      const container = hydrateSlug(slug);
      await waitFor(() => {
        expect(container.querySelectorAll("h1")).toHaveLength(1);
      });
    }
  });
});
