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
        delivery_intent: "entrega hoje em Goiânia",
      }),
      expect.stringContaining("Buquê Clássico de Rosas Vermelhas - R$ 249,90"),
      "pagina=urgencia",
    );
    expect(openWhatsAppModal.mock.calls[0]?.[2]).not.toContain("Até R$ 149,90");
  });

  const CONVERSION_SLUGS = ["presente-hoje", "urgencia", "lirios-apt"] as const;

  it.each(CONVERSION_SLUGS)(
    "%s uses the unified purchase CTA on every conversion origin",
    async (slug) => {
      renderAt(`/${slug}`);

      for (const origin of ["hero", "sticky", "como_funciona"]) {
        expect(await screen.findByTestId(`ad-lp-cta-${origin}`)).toHaveTextContent(
          "Comprar no WhatsApp",
        );
      }
      // O header minimal fica só com logo + nota do Google.
      expect(screen.queryByTestId("ad-lp-cta-navbar")).toBeNull();
    },
  );

  it.each(CONVERSION_SLUGS)("%s ships a minimal nav with no section anchors", async (slug) => {
    const { container } = renderAt(`/${slug}`);

    await screen.findByTestId("ad-lp-cta-hero");
    expect(container.querySelector(".ad-lp-nav")).toBeNull();
    expect(container.querySelector('a[href="#como-funciona"]')).toBeNull();
    expect(container.querySelector('a[href="#vitrine"]')).toBeNull();
  });

  it.each(CONVERSION_SLUGS)("%s drops testimonial avatars but keeps the seal", async (slug) => {
    const { container } = renderAt(`/${slug}`);

    await screen.findByTestId("ad-lp-cta-hero");
    expect(container.querySelectorAll(".ad-lp-proof__avatar")).toHaveLength(0);
    expect(container.querySelectorAll(".ad-lp-proof__date").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Avaliação pública no Google/).length).toBeGreaterThan(0);
  });

  it.each(CONVERSION_SLUGS)(
    "%s puts the guarantee right after the hero and before the vitrine",
    async (slug) => {
      const { container } = renderAt(`/${slug}`);

      await screen.findByTestId("ad-lp-cta-hero");
      const sections = Array.from(container.querySelectorAll("#ad-lp-main > section"));
      const classOf = (index: number) => sections[index]?.className ?? "";

      expect(classOf(0)).toContain("ad-lp-hero");
      expect(classOf(1)).toContain("ad-lp-guarantee");
      expect(classOf(2)).toContain("ad-lp-vitrine");
      // A seção "Por que nos escolher?" foi fundida nos diferenciais.
      expect(container.querySelector("#bonus")).toBeNull();
      expect(container.querySelector("#diferenciais")).toBeInTheDocument();
      expect(container.querySelector("#como-funciona")).toBeInTheDocument();
    },
  );

  it("orders reviews per LP and keeps the untouched LPs unchanged", async () => {
    const { container, unmount } = renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");
    // sffart-gamer é a única avaliação que fala de perfume, não de rosas.
    expect(container.querySelector(".ad-lp-proof__hero")).toHaveTextContent(
      "Flores lindas e cheirosas",
    );
    unmount();

    const rosas = renderAt("/rosas-apt");
    await screen.findByTestId("ad-lp-cta-hero");
    expect(rosas.container.querySelectorAll(".ad-lp-proof__avatar").length).toBeGreaterThan(0);
    expect(rosas.container.querySelector(".ad-lp-nav")).toBeInTheDocument();
    expect(rosas.container.querySelector("#bonus")).toBeInTheDocument();
  });

  it("moves the lily FAQs next to the vitrine and the off-theme products to the end", async () => {
    const { container } = renderAt("/lirios-apt");

    const vitrineFaq = await screen.findByTestId("ad-lp-vitrine-faq");
    expect(vitrineFaq).toHaveTextContent("Dúvidas sobre lírios");
    expect(vitrineFaq).toHaveTextContent("O perfume é forte mesmo?");
    // A pergunta não pode aparecer duas vezes: ela saiu do FAQ do rodapé.
    expect(screen.getAllByText("O perfume é forte mesmo?")).toHaveLength(1);

    // Os dois fora de tema ficam depois do corte de 6 cards: só aparecem no fim,
    // atrás do expansor, e rotulados.
    fireEvent.click(screen.getByText(/Quero ver mais opções/));
    const ids = Array.from(container.querySelectorAll("[data-testid^='product-card-']")).map(
      (card) => card.getAttribute("data-testid"),
    );
    expect(ids.slice(-2)).toEqual([
      "product-card-buque-12-rosas-vermelhas",
      "product-card-buque-flor-campo-m",
    ]);
    expect(screen.getAllByText("Se quiser variar")).toHaveLength(2);
  });

  it("shows the sai-hoje badge on every urgencia product", async () => {
    const { container } = renderAt("/urgencia");

    await screen.findByTestId("ad-lp-cta-hero");
    const cards = container.querySelectorAll(".ad-lp-card");
    const scarcity = container.querySelectorAll(".ad-lp-card__scarcity");
    expect(cards.length).toBe(6);
    expect(scarcity.length).toBe(6);
    expect(scarcity[0]).toHaveTextContent("Pedido até 18h sai hoje");
    // Fora da foto: o selo mora no corpo do card, não sobre a imagem.
    expect(scarcity[0].closest(".ad-lp-card__body")).not.toBeNull();
  });

  it("ends the urgencia FAQ with the disqualifying question", async () => {
    renderAt("/urgencia");

    await screen.findByTestId("ad-lp-cta-hero");
    const questions = Array.from(document.querySelectorAll(".ad-lp-faq__item summary")).map(
      (summary) => summary.textContent,
    );
    expect(questions.indexOf("E se eu não estiver em Goiânia?")).toBe(
      LP_CONFIGS.urgencia.faq.length - 1,
    );
  });

  it("never promises a 16h cutoff on the conversion LPs", () => {
    for (const slug of CONVERSION_SLUGS) {
      expect(JSON.stringify(LP_CONFIGS[slug])).not.toContain("16h");
    }
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
