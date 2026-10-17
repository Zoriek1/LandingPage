import { Component } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { CategoryCarousel } from "./category-carousel";
import type { CarouselSlide, CarouselSource } from "./category-carousel";

/**
 * Ilha React dos carrosséis de categoria. O HTML estático é a fonte de verdade
 * (é o que o Google e quem está sem JS enxergam): cada `[data-carousel]` traz um
 * <li> por foto, e aqui as fotos são lidas do próprio DOM e remontadas como
 * carrossel. main.ts carrega este módulo perto da seção e chama
 * `initCategoryCarousels()`.
 */

const CAROUSEL_SELECTOR = "[data-carousel]";
const READY_ATTRIBUTE = "data-carousel-ready";
/** Marca o carrossel que não montou: o CSS deixa de reservar o espaço dos controles. */
const FAILED_ATTRIBUTE = "data-carousel-failed";
const DEFAULT_LABEL = "Fotos da categoria";

interface Mounted {
  root: Root;
  /** Nós do HTML estático, guardados para restaurar se algo falhar. */
  staticNodes: Node[];
}

const mounted = new WeakMap<Element, Mounted>();
const failed = new WeakSet<Element>();

const attr = (element: Element, name: string): string | undefined => {
  const value = element.getAttribute(name)?.trim();
  return value ? value : undefined;
};

const dimension = (element: Element, name: string): number | undefined => {
  const value = Number.parseInt(element.getAttribute(name) ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

/** Lê as fotos de um `[data-carousel]` conforme o contrato de marcação. */
export function readCarouselSlides(container: Element): CarouselSlide[] {
  const slides: CarouselSlide[] = [];
  container.querySelectorAll("li").forEach((item) => {
    const img = item.querySelector("img");
    const src = img ? attr(img, "src") : undefined;
    if (!img || !src) return;

    const sources: CarouselSource[] = [];
    item.querySelectorAll("source").forEach((source) => {
      const srcSet = attr(source, "srcset");
      if (!srcSet) return;
      sources.push({ type: attr(source, "type"), srcSet, sizes: attr(source, "sizes"), media: attr(source, "media") });
    });

    const alt = img.getAttribute("alt")?.trim() ?? "";
    slides.push({
      src,
      srcSet: attr(img, "srcset"),
      sizes: attr(img, "sizes"),
      alt,
      caption: attr(item, "data-caption") ?? alt,
      width: dimension(img, "width"),
      height: dimension(img, "height"),
      sources,
      // Só a foto que já baixou vira "eager" na ilha; a que ainda espera o lazy continua esperando.
      loaded: img.complete && img.naturalWidth > 0,
    });
  });
  return slides;
}

function teardown(element: Element, restoreStaticNodes: boolean): void {
  const entry = mounted.get(element);
  if (!entry) return;
  mounted.delete(element);
  try {
    entry.root.unmount();
  } catch {
    // já desmontado
  }
  element.removeAttribute(READY_ATTRIBUTE);
  if (restoreStaticNodes) element.replaceChildren(...entry.staticNodes);
}

/** Se o carrossel quebrar depois de montado, a foto estática volta no lugar. */
class CarouselBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function mountCarousel(element: HTMLElement): void {
  if (element.hasAttribute(READY_ATTRIBUTE) || mounted.has(element) || failed.has(element)) return;

  const slides = readCarouselSlides(element);
  // Uma foto só não gira: o DOM estático fica como está.
  if (slides.length < 2) return;

  const label = attr(element, "data-carousel-label") ?? DEFAULT_LABEL;
  const entry: Mounted = { root: createRoot(element), staticNodes: Array.from(element.childNodes) };
  mounted.set(element, entry);

  const fallback = () => {
    failed.add(element);
    teardown(element, true);
    element.setAttribute(FAILED_ATTRIBUTE, "");
  };

  try {
    // flushSync: a troca do HTML estático pelo carrossel acontece na mesma tarefa
    // e o atributo `ready` entra junto, então o navegador não pinta o intervalo.
    flushSync(() => {
      entry.root.render(
        <CarouselBoundary onFail={() => queueMicrotask(fallback)}>
          <CategoryCarousel label={label} slides={slides} />
        </CarouselBoundary>,
      );
    });
    element.setAttribute(READY_ATTRIBUTE, "true");
  } catch {
    fallback();
  }
}

/**
 * Monta um carrossel em cada `[data-carousel]` dentro de `root` (padrão: o
 * documento). Idempotente (marca `data-carousel-ready`) e nunca lança: no pior
 * caso o HTML estático continua valendo.
 */
export function initCategoryCarousels(root?: ParentNode): void {
  try {
    const scope: ParentNode = root ?? document;
    const targets: HTMLElement[] = [];
    if (scope instanceof HTMLElement && scope.matches(CAROUSEL_SELECTOR)) targets.push(scope);
    scope.querySelectorAll<HTMLElement>(CAROUSEL_SELECTOR).forEach((element) => targets.push(element));
    for (const element of targets) {
      try {
        mountCarousel(element);
      } catch {
        // um carrossel com problema não derruba os outros
      }
    }
  } catch {
    // melhoria progressiva: sem a ilha, a página continua inteira
  }
}

/** Desmonta os carrosséis de `root` e devolve o HTML estático (testes e hot reload). */
export function destroyCategoryCarousels(root?: ParentNode): void {
  try {
    const scope: ParentNode = root ?? document;
    const targets: Element[] = [];
    if (scope instanceof Element && scope.hasAttribute(READY_ATTRIBUTE)) targets.push(scope);
    scope.querySelectorAll(`${CAROUSEL_SELECTOR}[${READY_ATTRIBUTE}]`).forEach((element) => targets.push(element));
    for (const element of targets) teardown(element, true);
  } catch {
    // nada a desfazer
  }
}
