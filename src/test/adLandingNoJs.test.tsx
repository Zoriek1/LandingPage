import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdLandingPage from "@/features/ad-lps/AdLandingPage";

/**
 * Contrato no-JS: com JavaScript desligado (ou antes da hidratação), todo
 * CTA da landing page de anúncio DEVE ser um <a href="https://wa.me/...">
 * funcional. Isso garante que o lead consegue abrir o WhatsApp mesmo sem
 * JS — o onClick que enriquece a experiência (PriceRangeSelector, tracking)
 * só é anexado após a hidratação.
 *
 * O teste usa renderToString (SSR) porque em jsdom o window existe e o
 * useEffect de useHydrated() transforma o <a> em <button> imediatamente.
 * O HTML do servidor é o estado real "sem JS".
 */

const { openWhatsAppModal } = vi.hoisted(() => ({
  openWhatsAppModal: vi.fn(),
}));

vi.mock("@/lib/whatsappModal", () => ({
  openWhatsAppModal,
}));

const { openPriceRangeSelector } = vi.hoisted(() => ({
  openPriceRangeSelector: vi.fn(),
}));

vi.mock("@/lib/price-ranges", () => ({
  ...vi.importActual("@/lib/price-ranges"),
  openPriceRangeSelector,
}));

const WHATSAPP_URL = "https://wa.me/5562996503403";

const CTA_TEST_IDS = [
  "ad-lp-cta-hero",
  "ad-lp-cta-final",
  "ad-lp-cta-faq",
  "ad-lp-cta-sticky",
  "ad-lp-cta-como_funciona",
  "ad-lp-cta-guarantee",
] as const;

describe("AdLandingPage: no-JS CTA contract", () => {
  it("renders every conversion CTA as an <a> tag pointing at wa.me in SSR output", () => {
    const html = renderToString(<AdLandingPage slug="lirios-apt" />);
    const container = document.createElement("div");
    container.innerHTML = html;

    for (const testId of CTA_TEST_IDS) {
      const el = container.querySelector(`[data-testid="${testId}"]`);
      expect(el, `missing data-testid="${testId}"`).not.toBeNull();
      expect(el!.tagName, `${testId} should be <a>`).toBe("A");
      expect(el!.getAttribute("href"), `${testId} href mismatch`).toBe(WHATSAPP_URL);
      expect(el!.getAttribute("target"), `${testId} target mismatch`).toBe("_blank");
      expect(el!.getAttribute("rel"), `${testId} rel mismatch`).toBe("noopener noreferrer");
    }
  });

  it("has exactly 6 conversion CTAs in the SSR output", () => {
    const html = renderToString(<AdLandingPage slug="lirios-apt" />);
    const container = document.createElement("div");
    container.innerHTML = html;

    const ctaLinks = container.querySelectorAll<HTMLAnchorElement>(
      '[data-testid^="ad-lp-cta-"]',
    );

    const waLinks = Array.from(ctaLinks).filter(
      (el) => el.tagName === "A" && el.getAttribute("href") === WHATSAPP_URL,
    );

    expect(waLinks).toHaveLength(CTA_TEST_IDS.length);
  });

  it("does not render any <button> with a CTA testid in SSR output", () => {
    const html = renderToString(<AdLandingPage slug="lirios-apt" />);
    const container = document.createElement("div");
    container.innerHTML = html;

    const ctaButtons = container.querySelectorAll<HTMLButtonElement>(
      'button[data-testid^="ad-lp-cta-"]',
    );

    expect(ctaButtons).toHaveLength(0);
  });

  it("renders all six product CTAs as WhatsApp links before hydration", () => {
    const html = renderToString(<AdLandingPage slug="lirios-apt" />);
    const container = document.createElement("div");
    container.innerHTML = html;

    const productLinks = container.querySelectorAll<HTMLAnchorElement>(
      'a[data-testid^="product-cta-"]',
    );
    expect(productLinks).toHaveLength(6);
    for (const link of productLinks) {
      expect(link).toHaveAttribute("href", WHATSAPP_URL);
      expect(link).toHaveTextContent("Comprar este no WhatsApp");
    }
  });
});
