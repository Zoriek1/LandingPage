import { act, createEvent, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  destroyCategoryCarousels,
  initCategoryCarousels,
  readCarouselSlides,
} from "@/loja-fisica/carousels";
import { CAROUSEL_AUTOPLAY_MS } from "@/loja-fisica/category-carousel";

const LABEL = "Vasos de alto padrão";
const CAPTIONS = ["Cerâmica", "Barro", "Cachepô", "Polietileno", "Vaso grande"];

function slideHtml(index: number, withCaption = true) {
  const n = index + 1;
  const caption = withCaption ? ` data-caption="${CAPTIONS[index]}"` : "";
  return `<li class="category-carousel-slide"${caption}><picture>
    <source type="image/avif" srcset="/img/vasos-${n}-480.avif 480w, /img/vasos-${n}-960.avif 960w" sizes="(min-width: 1024px) 22vw, 80vw"/>
    <source type="image/webp" srcset="/img/vasos-${n}-480.webp 480w, /img/vasos-${n}-960.webp 960w" sizes="(min-width: 1024px) 22vw, 80vw"/>
    <img src="/img/vasos-${n}-960.webp" alt="Vaso ${n} da loja" width="960" height="1200" loading="lazy" decoding="async"/>
  </picture></li>`;
}

function carouselHtml(count = 5, withCaption = true) {
  const items = Array.from({ length: count }, (_unused, index) => slideHtml(index, withCaption)).join("");
  return `<div class="category-carousel" data-carousel data-carousel-label="${LABEL}"><ul class="category-carousel-list" role="list">${items}</ul></div>`;
}

function mount(html = carouselHtml()) {
  document.body.innerHTML = html;
  act(() => initCategoryCarousels());
  return document.querySelector<HTMLElement>("[data-carousel]")!;
}

const caption = () => document.querySelector(".category-carousel-caption")!;
const nextButton = () => document.querySelector<HTMLButtonElement>(".category-carousel-next")!;
const prevButton = () => document.querySelector<HTMLButtonElement>(".category-carousel-prev")!;
const pauseButton = () => document.querySelector<HTMLButtonElement>(".category-carousel-pause");
const dots = () => Array.from(document.querySelectorAll<HTMLButtonElement>(".category-carousel-dot"));
const activeCard = () => document.querySelector(".category-carousel-card[data-status='active']")!;

/** Cada troca re-arma o timeout no efeito, então o avanço precisa de um act por foto. */
const tick = (ms = CAROUSEL_AUTOPLAY_MS) => act(() => void vi.advanceTimersByTime(ms));

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void;
let observers: Array<{ callback: IntersectionCallback }> = [];

class FakeIntersectionObserver {
  readonly callback: IntersectionCallback;
  constructor(callback: IntersectionCallback) {
    this.callback = callback;
    observers.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function setReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;
const originalObserver = window.IntersectionObserver;

beforeEach(() => {
  observers = [];
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  act(() => destroyCategoryCarousels());
  document.body.innerHTML = "";
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
  window.IntersectionObserver = originalObserver;
  globalThis.IntersectionObserver = originalObserver;
});

describe("readCarouselSlides", () => {
  it("lê foto, fontes, dimensões e legenda do DOM", () => {
    document.body.innerHTML = carouselHtml(3);
    const slides = readCarouselSlides(document.querySelector("[data-carousel]")!);

    expect(slides).toHaveLength(3);
    expect(slides[1]).toMatchObject({
      src: "/img/vasos-2-960.webp",
      alt: "Vaso 2 da loja",
      caption: "Barro",
      width: 960,
      height: 1200,
    });
    expect(slides[1].sources.map((source) => source.type)).toEqual(["image/avif", "image/webp"]);
    expect(slides[1].sources[0].srcSet).toBe("/img/vasos-2-480.avif 480w, /img/vasos-2-960.avif 960w");
    expect(slides[1].sources[0].sizes).toBe("(min-width: 1024px) 22vw, 80vw");
  });

  it("usa o alt como legenda quando falta data-caption e ignora <li> sem imagem", () => {
    document.body.innerHTML = carouselHtml(2, false).replace("</ul>", "<li>sem foto</li></ul>");
    const slides = readCarouselSlides(document.querySelector("[data-carousel]")!);

    expect(slides).toHaveLength(2);
    expect(slides.map((slide) => slide.caption)).toEqual(["Vaso 1 da loja", "Vaso 2 da loja"]);
  });
});

describe("initCategoryCarousels: montagem", () => {
  it("troca o HTML estático por um grupo acessível com o nome da categoria", () => {
    const container = mount();

    expect(container).toHaveAttribute("data-carousel-ready", "true");
    expect(container.querySelector(".category-carousel-list")).toBeNull();

    const group = container.querySelector<HTMLElement>(".category-carousel-root")!;
    expect(group).toHaveAttribute("role", "group");
    expect(group).toHaveAttribute("aria-roledescription", "carrossel");
    expect(group).toHaveAttribute("aria-label", LABEL);
  });

  it("monta só a foto central e as vizinhas, mantendo alt, fontes e a 1ª imagem sem lazy", () => {
    mount();

    const pictures = document.querySelectorAll("picture");
    expect(document.querySelectorAll(".category-carousel-card")).toHaveLength(5);
    expect(pictures).toHaveLength(3);

    const first = activeCard().querySelector("img")!;
    expect(first).toHaveAttribute("alt", "Vaso 1 da loja");
    expect(first).toHaveAttribute("loading", "eager");
    expect(first).toHaveAttribute("width", "960");
    expect(first).toHaveAttribute("height", "1200");
    expect(activeCard().querySelectorAll("source")).toHaveLength(2);
    expect(activeCard().querySelector("source")).toHaveAttribute("srcset", expect.stringContaining("480w"));

    const others = Array.from(document.querySelectorAll("img")).filter((img) => img !== first);
    expect(others.every((img) => img.getAttribute("loading") === "lazy")).toBe(true);
  });

  it("marca o cartão ativo e esconde os demais dos leitores de tela", () => {
    mount();

    const statuses = Array.from(document.querySelectorAll(".category-carousel-card")).map((card) =>
      card.getAttribute("data-status"),
    );
    expect(statuses).toEqual(["active", "next", "hidden", "hidden", "prev"]);
    expect(activeCard()).not.toHaveAttribute("aria-hidden");
    expect(activeCard()).toHaveAttribute("aria-roledescription", "slide");
    expect(activeCard()).toHaveAttribute("aria-label", "1 de 5");
    expect(document.querySelectorAll(".category-carousel-card[aria-hidden='true']")).toHaveLength(4);
  });

  it("não monta nada quando há uma foto só", () => {
    const html = carouselHtml(1);
    document.body.innerHTML = html;
    const before = document.body.innerHTML;

    act(() => initCategoryCarousels());

    const container = document.querySelector("[data-carousel]")!;
    expect(container).not.toHaveAttribute("data-carousel-ready");
    expect(container.querySelector(".category-carousel-list")).not.toBeNull();
    expect(document.querySelector(".category-carousel-root")).toBeNull();
    expect(document.body.innerHTML).toBe(before);
  });

  it("é idempotente: chamar de novo não remonta nem duplica", () => {
    mount();
    const group = document.querySelector(".category-carousel-root");

    act(() => initCategoryCarousels());
    act(() => initCategoryCarousels(document.body));

    expect(document.querySelectorAll(".category-carousel-root")).toHaveLength(1);
    expect(document.querySelector(".category-carousel-root")).toBe(group);
    expect(document.querySelectorAll("[data-carousel-ready]")).toHaveLength(1);
  });

  it("monta cada categoria separadamente e respeita o escopo recebido", () => {
    document.body.innerHTML = `<section id="a">${carouselHtml(3)}</section><section id="b">${carouselHtml(4)}</section>`;

    act(() => initCategoryCarousels(document.getElementById("a")!));
    expect(document.querySelectorAll(".category-carousel-root")).toHaveLength(1);
    expect(document.querySelector("#b .category-carousel-list")).not.toBeNull();

    act(() => initCategoryCarousels());
    expect(document.querySelectorAll(".category-carousel-root")).toHaveLength(2);
  });

  it("nunca lança, mesmo com marcação quebrada ou sem carrosséis", () => {
    document.body.innerHTML = `<div data-carousel><ul><li></li><li></li></ul></div><div data-carousel></div>`;
    // Foto sem src: montada pelo DOM porque é exatamente a marcação inválida que o teste quer cobrir.
    document.querySelectorAll("li")[1].appendChild(document.createElement("img"));

    expect(() => initCategoryCarousels()).not.toThrow();
    expect(() => initCategoryCarousels(document.createElement("div"))).not.toThrow();
    expect(() => initCategoryCarousels(null as unknown as ParentNode)).not.toThrow();
    expect(document.querySelector("[data-carousel-ready]")).toBeNull();
  });

  it("destroyCategoryCarousels devolve o HTML estático e permite montar de novo", () => {
    document.body.innerHTML = carouselHtml();
    const original = document.body.innerHTML;
    act(() => initCategoryCarousels());
    expect(document.body.innerHTML).not.toBe(original);

    act(() => destroyCategoryCarousels());
    expect(document.body.innerHTML).toBe(original);
    expect(document.querySelector("[data-carousel-ready]")).toBeNull();

    act(() => initCategoryCarousels());
    expect(document.querySelectorAll(".category-carousel-root")).toHaveLength(1);
  });

  it("nenhum controle é um destino de conversão (sem data-whatsapp nem data-store-action)", () => {
    const container = mount();

    expect(container.querySelectorAll("[data-whatsapp], [data-store-action], a[href]")).toHaveLength(0);
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(8);
    buttons.forEach((button) => expect(button).toHaveAttribute("type", "button"));
  });
});

describe("navegação", () => {
  it("avança e volta pelas setas, atualizando a legenda, o ativo e o indicador", () => {
    mount();
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");
    expect(dots()[0]).toHaveAttribute("aria-current", "true");

    fireEvent.click(nextButton());
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
    expect(activeCard().querySelector("img")).toHaveAttribute("alt", "Vaso 2 da loja");
    expect(dots()[1]).toHaveAttribute("aria-current", "true");
    expect(dots()[0]).not.toHaveAttribute("aria-current");

    fireEvent.click(prevButton());
    fireEvent.click(prevButton());
    expect(caption()).toHaveTextContent("Vaso grande, 5 de 5");
    expect(dots()[4]).toHaveAttribute("aria-current", "true");
  });

  it("volta ao início depois da última foto", () => {
    mount();
    for (let i = 0; i < 5; i += 1) fireEvent.click(nextButton());
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");
  });

  it("vai direto para a foto do indicador clicado, inclusive pelo caminho mais curto", () => {
    mount();

    fireEvent.click(dots()[2]);
    expect(caption()).toHaveTextContent("Cachepô, 3 de 5");
    expect(activeCard()).toHaveAttribute("aria-label", "3 de 5");

    fireEvent.click(dots()[4]);
    expect(caption()).toHaveTextContent("Vaso grande, 5 de 5");

    fireEvent.click(dots()[0]);
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");
  });

  it("monta a foto de destino quando o indicador pula para longe", () => {
    mount();
    expect(document.querySelectorAll("picture")).toHaveLength(3);

    fireEvent.click(dots()[2]);

    expect(activeCard().querySelector("img")).toHaveAttribute("alt", "Vaso 3 da loja");
    expect(document.querySelectorAll("picture").length).toBeGreaterThanOrEqual(4);
  });

  it("responde às setas do teclado de dentro do carrossel", () => {
    mount();

    fireEvent.keyDown(nextButton(), { key: "ArrowRight" });
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
    fireEvent.keyDown(nextButton(), { key: "ArrowRight" });
    expect(caption()).toHaveTextContent("Cachepô, 3 de 5");
    fireEvent.keyDown(prevButton(), { key: "ArrowLeft" });
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
  });

  it("ignora outras teclas e combinações com modificador", () => {
    mount();

    fireEvent.keyDown(nextButton(), { key: "Enter" });
    fireEvent.keyDown(nextButton(), { key: "ArrowRight", altKey: true });
    fireEvent.keyDown(nextButton(), { key: "ArrowRight", ctrlKey: true });
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");
  });

  it("deixa só o indicador ativo no Tab e leva o foco junto quando a seta troca a foto", () => {
    mount();
    expect(dots().map((dot) => dot.tabIndex)).toEqual([0, -1, -1, -1, -1]);

    act(() => dots()[0].focus());
    fireEvent.keyDown(dots()[0], { key: "ArrowRight" });

    expect(dots().map((dot) => dot.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
    expect(document.activeElement).toBe(dots()[1]);
  });

  it("dá nome distinto a cada controle e usa a classe de alvo grande (48 px no CSS)", () => {
    mount();

    expect(prevButton()).toHaveAccessibleName(`Foto anterior: ${LABEL}`);
    expect(nextButton()).toHaveAccessibleName(`Próxima foto: ${LABEL}`);
    expect(pauseButton()).toHaveAccessibleName(`Pausar a rotação automática: ${LABEL}`);
    expect(dots()[2]).toHaveAccessibleName("Ir para a foto 3 de 5");
    [prevButton(), nextButton(), pauseButton()!].forEach((button) =>
      expect(button).toHaveClass("category-carousel-btn"),
    );
  });

  it("funciona com duas fotos", () => {
    mount(carouselHtml(2));

    expect(document.querySelectorAll(".category-carousel-card[data-status='active']")).toHaveLength(1);
    fireEvent.click(nextButton());
    expect(caption()).toHaveTextContent("Barro, 2 de 2");
    fireEvent.click(nextButton());
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 2");
  });
});

describe("autoplay", () => {
  it("avança sozinho a cada 4,5 s", () => {
    mount();
    expect(CAROUSEL_AUTOPLAY_MS).toBe(4500);

    tick(4400);
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");
    tick(100);
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
    tick();
    expect(caption()).toHaveTextContent("Cachepô, 3 de 5");
  });

  it("reinicia a contagem quando a pessoa troca de foto", () => {
    mount();

    tick(4000);
    fireEvent.click(nextButton());
    expect(caption()).toHaveTextContent("Barro, 2 de 5");

    tick(4000);
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
    tick(500);
    expect(caption()).toHaveTextContent("Cachepô, 3 de 5");
  });

  it("para e retoma pelo botão de pausa, que troca de nome", () => {
    mount();

    fireEvent.click(pauseButton()!);
    expect(pauseButton()).toHaveAccessibleName(`Retomar a rotação automática: ${LABEL}`);
    tick(20000);
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");

    fireEvent.click(pauseButton()!);
    expect(pauseButton()).toHaveAccessibleName(`Pausar a rotação automática: ${LABEL}`);
    tick();
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
  });

  it("pausa com o mouse em cima e retoma ao sair, mas ignora o toque", () => {
    mount();
    const group = document.querySelector(".category-carousel-root")!;

    fireEvent.pointerEnter(group);
    tick(20000);
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");

    fireEvent.pointerLeave(group);
    tick();
    expect(caption()).toHaveTextContent("Barro, 2 de 5");

    // O jsdom não tem PointerEvent: o tipo do ponteiro entra à mão no evento.
    const touchEnter = createEvent.pointerOver(group);
    Object.defineProperty(touchEnter, "pointerType", { value: "touch" });
    fireEvent(group, touchEnter);
    tick();
    expect(caption()).toHaveTextContent("Cachepô, 3 de 5");
  });

  it("pausa enquanto o foco de teclado está dentro e retoma ao sair", () => {
    mount();

    act(() => nextButton().focus());
    tick(20000);
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");

    act(() => nextButton().blur());
    tick();
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
  });

  it("mantém a pausa quando o foco só passa de um controle para outro do carrossel", () => {
    mount();

    act(() => nextButton().focus());
    act(() => prevButton().focus());
    tick(10000);
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");
  });

  it("pausa fora da tela e volta quando o carrossel reaparece", () => {
    window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    mount();
    expect(observers).toHaveLength(1);

    act(() => observers[0].callback([{ isIntersecting: false } as IntersectionObserverEntry]));
    tick(20000);
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");

    act(() => observers[0].callback([{ isIntersecting: true } as IntersectionObserverEntry]));
    tick();
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
  });

  it("anuncia a legenda só quando a pessoa está no controle (aria-live off enquanto gira)", () => {
    mount();
    expect(caption()).toHaveAttribute("aria-live", "off");

    fireEvent.click(pauseButton()!);
    expect(caption()).toHaveAttribute("aria-live", "polite");
    expect(caption()).toHaveAttribute("aria-atomic", "true");

    fireEvent.click(pauseButton()!);
    expect(caption()).toHaveAttribute("aria-live", "off");
  });

  it("para de girar e limpa o timer quando o carrossel é desmontado", () => {
    mount();
    act(() => destroyCategoryCarousels());

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("prefers-reduced-motion", () => {
  beforeEach(() => setReducedMotion(true));

  it("não tem autoplay, não mostra o botão de pausa e a legenda já é anunciada", () => {
    mount();

    tick(60000);
    expect(caption()).toHaveTextContent("Cerâmica, 1 de 5");
    expect(vi.getTimerCount()).toBe(0);
    expect(pauseButton()).toBeNull();
    expect(caption()).toHaveAttribute("aria-live", "polite");
  });

  it("segue navegável por setas, indicadores e teclado", () => {
    mount();

    fireEvent.click(nextButton());
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
    fireEvent.click(dots()[3]);
    expect(caption()).toHaveTextContent("Polietileno, 4 de 5");
    fireEvent.keyDown(nextButton(), { key: "ArrowLeft" });
    expect(caption()).toHaveTextContent("Cachepô, 3 de 5");
  });

  it("com movimento normal o autoplay existe (controle do teste anterior)", () => {
    setReducedMotion(false);
    mount();

    tick();
    expect(caption()).toHaveTextContent("Barro, 2 de 5");
    expect(pauseButton()).not.toBeNull();
  });
});
