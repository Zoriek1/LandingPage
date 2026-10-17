import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { destroyCategoryCarousels, initCategoryCarousels } from "@/loja-fisica/carousels";

/**
 * Melhoria progressiva: se o componente quebrar ao renderizar, a foto estática
 * do HTML volta no lugar e a página segue inteira, sem erro para o visitante.
 */

const render = vi.hoisted(() => ({ calls: 0 }));

vi.mock("@/loja-fisica/category-carousel", () => ({
  CategoryCarousel: () => {
    render.calls += 1;
    throw new Error("falha simulada do carrossel");
  },
}));

const STATIC_HTML = `<div class="category-carousel" data-carousel data-carousel-label="Terras"><ul class="category-carousel-list"><li data-caption="A"><picture><img src="/a.webp" alt="Terra A" width="480" height="600"/></picture></li><li data-caption="B"><picture><img src="/b.webp" alt="Terra B" width="480" height="600"/></picture></li></ul></div>`;

// innerHTML normaliza a serialização (data-carousel="", <img> sem barra): é a referência do "antes".
let staticHtml = "";

beforeEach(() => {
  render.calls = 0;
  document.body.innerHTML = STATIC_HTML;
  staticHtml = document.body.innerHTML;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  destroyCategoryCarousels();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("falha do carrossel", () => {
  it("devolve o HTML estático, não lança e não marca o carrossel como pronto", async () => {
    await act(async () => {
      expect(() => initCategoryCarousels()).not.toThrow();
    });

    const container = document.querySelector("[data-carousel]")!;
    expect(container).not.toHaveAttribute("data-carousel-ready");
    // A marca de falha libera o espaço que o CSS reservava para os controles; o resto do HTML é o estático.
    expect(container).toHaveAttribute("data-carousel-failed");
    container.removeAttribute("data-carousel-failed");
    expect(document.body.innerHTML).toBe(staticHtml);
    expect(document.querySelectorAll("img")).toHaveLength(2);
  });

  it("não tenta remontar um carrossel que já falhou", async () => {
    await act(async () => initCategoryCarousels());
    const attempts = render.calls;
    expect(attempts).toBeGreaterThan(0);

    await act(async () => initCategoryCarousels());

    expect(render.calls).toBe(attempts);
    document.querySelector("[data-carousel]")!.removeAttribute("data-carousel-failed");
    expect(document.body.innerHTML).toBe(staticHtml);
  });
});
