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

  it("passes lp slug and CTA origin for hero, FAQ, and sticky WhatsApp clicks", () => {
    renderAt("/urgencia?utm_content=ad-criativo-01");

    fireEvent.click(screen.getByTestId("ad-lp-cta-hero"));
    fireEvent.click(screen.getByTestId("ad-lp-cta-faq"));
    fireEvent.click(screen.getByTestId("ad-lp-cta-sticky"));

    expect(openWhatsAppModal).toHaveBeenCalledTimes(3);
    expect(openWhatsAppModal).toHaveBeenNthCalledWith(
      1,
      "https://wa.me/5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "hero",
        cta_label: "hero_whatsapp",
      }),
    );
    expect(openWhatsAppModal).toHaveBeenNthCalledWith(
      2,
      "https://wa.me/5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "faq",
        cta_label: "faq_whatsapp",
      }),
    );
    expect(openWhatsAppModal).toHaveBeenNthCalledWith(
      3,
      "https://wa.me/5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "sticky",
        cta_label: "sticky_whatsapp",
      }),
    );
  });

  it("links vitrine product cards to the storefront and tracks the click", () => {
    renderAt("/urgencia?utm_content=ad-criativo-01");

    const card = screen.getByTestId("product-card-buque-6-rosas") as HTMLAnchorElement;
    expect(card).toHaveAttribute(
      "href",
      "https://www.planteumaflor.com/produtos/buque-classico-rosas?utm_content=ad-criativo-01",
    );
    expect(card).toHaveTextContent("Buquê Clássico de Rosas Vermelhas");
    expect(card).toHaveTextContent("R$ 249,90");

    fireEvent.click(card);

    expect(openWhatsAppModal).not.toHaveBeenCalled();
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "ad_lp_product_click",
        lp_slug: "urgencia",
        cta_location: "vitrine",
        cta_label: "produto_site",
        product_id: "buque-6-rosas",
        product_name: "Buquê Clássico de Rosas Vermelhas",
        product_price: "R$ 249,90",
        destination_url:
          "https://www.planteumaflor.com/produtos/buque-classico-rosas?utm_content=ad-criativo-01",
      }),
    );
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
