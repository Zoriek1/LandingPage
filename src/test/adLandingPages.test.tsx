import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { LP_CONFIGS } from "@/features/ad-lps/data/configs";

const { openWhatsAppModal } = vi.hoisted(() => ({
  openWhatsAppModal: vi.fn(),
}));

vi.mock("@/lib/whatsappModal", () => ({
  openWhatsAppModal,
}));

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("ad landing pages", () => {
  beforeEach(() => {
    openWhatsAppModal.mockClear();
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders every approved slug with its configured headline", () => {
    Object.values(LP_CONFIGS).forEach((config) => {
      const { unmount } = renderAt(`/${config.slug}`);
      expect(screen.getByRole("heading", { level: 1, name: config.headline })).toBeInTheDocument();
      unmount();
    });
  });

  it("falls through to NotFound for unknown slugs", () => {
    renderAt("/slug-inexistente");
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
  });

  it("passes lp slug and CTA origin using the default price-band WhatsApp checklist", () => {
    renderAt("/urgencia?utm_content=ad-criativo-01");

    fireEvent.click(screen.getByTestId("ad-lp-cta-hero"));
    fireEvent.click(screen.getByTestId("ad-lp-cta-faq"));
    fireEvent.click(screen.getByTestId("ad-lp-cta-sticky"));

    expect(openWhatsAppModal).toHaveBeenCalledTimes(3);
    expect(openWhatsAppModal).toHaveBeenNthCalledWith(
      1,
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "hero",
        cta_label: "hero_whatsapp",
      }),
      undefined,
      "pagina=urgencia",
    );
    expect(openWhatsAppModal).toHaveBeenNthCalledWith(
      2,
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "faq",
        cta_label: "faq_whatsapp",
      }),
      undefined,
      "pagina=urgencia",
    );
    expect(openWhatsAppModal).toHaveBeenNthCalledWith(
      3,
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "sticky",
        cta_label: "sticky_whatsapp",
      }),
      undefined,
      "pagina=urgencia",
    );
  });

  it("scrolls from the hero shortcut to the products without opening WhatsApp", () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      renderAt("/urgencia");

      fireEvent.click(screen.getByTestId("ad-lp-see-products"));

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
      expect(openWhatsAppModal).not.toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("opens WhatsApp from vitrine product cards with product context", () => {
    renderAt("/urgencia?utm_content=ad-criativo-01");

    const card = screen.getByTestId("product-card-buque-6-rosas") as HTMLAnchorElement;
    expect(card).toHaveAttribute("href", "https://wa.me/5562996503403");
    expect(card).toHaveTextContent("Buquê Clássico de Rosas Vermelhas");
    expect(card).toHaveTextContent("R$ 249,90");

    fireEvent.click(card);

    expect(openWhatsAppModal).toHaveBeenCalledWith(
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "vitrine",
        cta_label: "produto_whatsapp",
        product_id: "buque-6-rosas",
        product_name: "Buquê Clássico de Rosas Vermelhas",
        product_price: "R$ 249,90",
        delivery_intent: "entrega hoje em Goiania",
      }),
      expect.stringContaining("Buquê Clássico de Rosas Vermelhas - R$ 249,90"),
      "pagina=urgencia",
    );
    expect(openWhatsAppModal.mock.calls[0]?.[2]).not.toContain("Até R$ 149,90");
  });

  it("updates document title and canonical for the active LP", () => {
    renderAt("/qual-b");

    expect(document.title).toBe(LP_CONFIGS["qual-b"].pageTitle);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://lpb.planteumaflor.com/qual-b",
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
      "https://lpb.planteumaflor.com/qual-b",
    );
  });
});
