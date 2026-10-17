import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Melhorias progressivas do main.ts que o physicalStorePage.test.ts não alcança: navegador sem
// IntersectionObserver e chunk dos carrosséis que não chega. Cada teste importa o main do zero.
const html = readFileSync(path.join(process.cwd(), "loja-fisica/index.html"), "utf8");
const body = new DOMParser().parseFromString(html, "text/html").body.innerHTML;

const initCategoryCarousels = vi.hoisted(() => vi.fn());
vi.mock("@/lib/tracking", () => ({ trackStoreAction: vi.fn(), trackWhatsAppClick: vi.fn().mockResolvedValue(undefined) }));

/**
 * O setup do projeto define IntersectionObserver sem permitir apagá-lo, e o jsdom não tem requestIdleCallback.
 * O main.ts pergunta `"IntersectionObserver" in window`, então o teste troca `window` por um proxy sobre um objeto
 * vazio (sem as travas de propriedade não configurável) que responde "não" a essa pergunta, oferece o
 * requestIdleCallback pedido e repassa o resto para a janela de verdade, com as funções amarradas a ela.
 */
function stubWindow(idle?: unknown) {
  const real = window;
  const stub = new Proxy({} as Window, {
    has: (_target, key) => key !== "IntersectionObserver" && (key === "requestIdleCallback" ? idle !== undefined : Reflect.has(real, key)),
    get: (_target, key) => {
      if (key === "requestIdleCallback") return idle;
      const value = Reflect.get(real, key);
      return typeof value === "function" ? value.bind(real) : value;
    },
    set: (_target, key, value) => Reflect.set(real, key, value),
  });
  vi.stubGlobal("window", stub);
}

beforeEach(() => {
  vi.resetModules();
  initCategoryCarousels.mockClear();
  document.body.innerHTML = body;
});

afterEach(() => {
  vi.useRealTimers();
  vi.doUnmock("../loja-fisica/carousels");
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("main.ts da loja física sem IntersectionObserver", () => {
  it("carrega os carrosséis quando o navegador está ocioso", async () => {
    vi.doMock("../loja-fisica/carousels", () => ({ initCategoryCarousels }));
    const idle = vi.fn();
    stubWindow(idle);

    await import("../loja-fisica/main");

    expect(idle).toHaveBeenCalledTimes(1);
    expect(idle.mock.calls[0][1]).toEqual({ timeout: 4000 });
    expect(initCategoryCarousels).not.toHaveBeenCalled();

    idle.mock.calls[0][0]();
    await vi.waitFor(() => expect(initCategoryCarousels).toHaveBeenCalledTimes(1));
  });

  it("sem requestIdleCallback, carrega depois de 2 s", async () => {
    vi.doMock("../loja-fisica/carousels", () => ({ initCategoryCarousels }));
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    stubWindow();

    await import("../loja-fisica/main");

    vi.advanceTimersByTime(1999);
    await vi.dynamicImportSettled();
    expect(initCategoryCarousels).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await vi.dynamicImportSettled();
    await vi.waitFor(() => expect(initCategoryCarousels).toHaveBeenCalledTimes(1));
  });
});

describe("main.ts da loja física quando o chunk dos carrosséis não chega", () => {
  it("marca como falhos só os carrosséis que não montaram, para o CSS soltar o espaço dos controles", async () => {
    vi.doMock("../loja-fisica/carousels", () => {
      throw new Error("chunk bloqueado");
    });
    const carousels = [...document.querySelectorAll("[data-carousel]")];
    expect(carousels.length).toBeGreaterThan(1);
    carousels[1].setAttribute("data-carousel-ready", "true");
    stubWindow((callback: () => void) => callback());

    await import("../loja-fisica/main");

    await vi.waitFor(() => expect(carousels[0]).toHaveAttribute("data-carousel-failed"));
    expect(carousels[1]).not.toHaveAttribute("data-carousel-failed");
    for (const carousel of carousels.slice(2)) expect(carousel).toHaveAttribute("data-carousel-failed");
    // O HTML estático continua inteiro: só ganhou a marca.
    for (const carousel of carousels) expect(carousel.querySelectorAll("picture").length).toBeGreaterThanOrEqual(3);
  });
});
