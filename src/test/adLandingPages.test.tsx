import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("renders every approved slug with its configured headline", async () => {
    for (const config of Object.values(LP_CONFIGS)) {
      const { unmount } = renderAt(`/${config.slug}`);
      expect(await screen.findByRole("heading", { level: 1, name: config.headline })).toBeInTheDocument();
      unmount();
    }
  });

  it("never points og:image at a file that was not generated", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { resolveOgImagePath } = await import("@/features/ad-lps/lib/hero-images");

    for (const config of Object.values(LP_CONFIGS)) {
      const ogPath = resolveOgImagePath(config);
      // Toda LP apontava para /lpb/heros/<slug>.jpg, mas a pasta não existia:
      // o preview de qualquer link compartilhado saía sem imagem.
      const exists = existsSync(join(process.cwd(), "public", ogPath));
      expect({ slug: config.slug, exists }).toEqual({ slug: config.slug, exists: true });
    }
  });

  it("falls through to NotFound for unknown slugs", async () => {
    renderAt("/slug-inexistente");
    expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
  });

  it("opens the price selector from each generic ad CTA without direct conversion", async () => {
    renderAt("/urgencia?utm_content=ad-criativo-01");

    fireEvent.click(await screen.findByTestId("ad-lp-cta-hero"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(openWhatsAppModal).not.toHaveBeenCalled();
  });

  it("scrolls from the hero shortcut to the products without opening WhatsApp", async () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      renderAt("/urgencia");

      fireEvent.click(await screen.findByTestId("ad-lp-see-products"));

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
      expect(openWhatsAppModal).not.toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("opens WhatsApp from vitrine product cards with product context", async () => {
    renderAt("/urgencia?utm_content=ad-criativo-01");

    const card = await screen.findByTestId("product-card-buque-6-rosas") as HTMLAnchorElement;
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

  it("updates document title and canonical for the active LP", async () => {
    renderAt("/qual-b");

    await waitFor(() => expect(document.title).toBe(LP_CONFIGS["qual-b"].pageTitle));
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://lpb.planteumaflor.com/qual-b",
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
      "https://lpb.planteumaflor.com/qual-b",
    );
  });
});
