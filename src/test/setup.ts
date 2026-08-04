import "@testing-library/jest-dom";
import { configure } from "@testing-library/dom";

configure({ asyncUtilTimeout: 5000 });

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
    disconnect = () => {};
    observe = () => {};
    takeRecords = () => [];
    unobserve = () => {};
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });

  // jsdom não implementa scrollTo/scrollBy em elementos — o carrossel da LP
  // usa setInterval com scrollTo, e sem esse mock o intervalo quebra após
  // o teardown do teste com "el.scrollTo is not a function".
  if (!Element.prototype.scrollTo) {
    Object.defineProperty(Element.prototype, "scrollTo", {
      writable: true,
      value: () => {},
    });
  }
  if (!Element.prototype.scrollBy) {
    Object.defineProperty(Element.prototype, "scrollBy", {
      writable: true,
      value: () => {},
    });
  }
}
