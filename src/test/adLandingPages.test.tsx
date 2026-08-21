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
  }, 15000);

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

    const card = await screen.findByTestId("product-card-buque-classico-rosas") as HTMLAnchorElement;
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
        product_id: "buque-classico-rosas",
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
      "product-card-buque-rosas-astromelias",
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

  it("fixed the final CTA grammar typo everywhere", async () => {
    renderAt("/girassol");
    await screen.findByTestId("ad-lp-cta-hero");
    expect(document.body.textContent).not.toContain("fala com a gente");
    expect(document.body.textContent).toContain("fale com a gente");
  });

  it.each(["girassol", "catalogo-precos"] as const)(
    "%s puts the vitrine immediately after the hero",
    async (slug) => {
      const { container } = renderAt(`/${slug}`);
      await screen.findByTestId("ad-lp-cta-hero");
      const sections = Array.from(container.querySelectorAll("#ad-lp-main > section"));
      expect(sections[0]?.className).toContain("ad-lp-hero");
      expect(sections[1]?.id).toBe("vitrine");
      // "Por que somos diferentes" e "Por que nos escolher?" foram fundidas.
      expect(container.querySelector("#bonus")).toBeNull();
    },
  );

  it("girassol shows exactly six products with one featured card, none orphaned", async () => {
    const { container } = renderAt("/girassol");
    await screen.findByTestId("ad-lp-cta-hero");
    const cards = container.querySelectorAll(".ad-lp-card");
    const featured = container.querySelectorAll(".ad-lp-card--featured");
    expect(cards).toHaveLength(6);
    expect(featured).toHaveLength(1);
  });

  it("girassol features the on-time-delivery review instead of the rosas one", async () => {
    const { container } = renderAt("/girassol");
    await screen.findByTestId("ad-lp-cta-hero");
    expect(container.querySelector(".ad-lp-proof__hero")).toHaveTextContent(
      "Produto chegou no dia e na hora combinado",
    );
  });

  it("falls back to the default state for an unknown ?oferta= value without crashing", async () => {
    renderAt("/girassol?oferta=nao-existe");
    expect(
      await screen.findByRole("heading", { level: 1, name: LP_CONFIGS.girassol.headline }),
    ).toBeInTheDocument();
  });

  it("?oferta=199 on girassol swaps the hero copy and sends the hero CTA straight to that product", async () => {
    renderAt("/girassol?oferta=199");

    await screen.findByRole("heading", { level: 1, name: "Buquê de girassóis por R$ 199,90" });

    fireEvent.click(await screen.findByTestId("ad-lp-cta-hero"));

    expect(openWhatsAppModal).toHaveBeenCalledWith(
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        product_id: "buque-girassois-p",
        product_price: "R$ 199,90",
      }),
      expect.stringContaining("Buquê de Girassóis P - R$ 199,90"),
      "pagina=girassol",
    );
    // Nenhum seletor genérico deveria abrir quando a variante já resolveu o produto.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("?oferta=199 on girassol reorders the vitrine and marks the ad-matched product", async () => {
    const { container } = renderAt("/girassol?oferta=199");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Buquê de girassóis por R$ 199,90",
      ),
    );

    const firstCard = container.querySelector(".ad-lp-vitrine__grid .ad-lp-card");
    expect(firstCard).toHaveTextContent("Buquê de Girassóis P");
    expect(firstCard).toHaveTextContent("Visto no anúncio");
  });

  it("?oferta=159 on girassol swaps the hero copy and sends the hero CTA straight to the real product", async () => {
    renderAt("/girassol?oferta=159");

    await screen.findByRole("heading", {
      level: 1,
      name: "Buquê Flores do Campo com Girassol por R$ 159,90",
    });

    fireEvent.click(await screen.findByTestId("ad-lp-cta-hero"));

    expect(openWhatsAppModal).toHaveBeenCalledWith(
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        product_id: "buque-flor-campo-girassol",
        product_price: "R$ 159,90",
      }),
      expect.stringContaining("Buquê Flores do Campo com Girassol - R$ 159,90"),
      "pagina=girassol",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the Google reviews link on girassol but not on an unrelated LP", async () => {
    const { unmount } = renderAt("/girassol");
    await screen.findByTestId("ad-lp-cta-hero");
    const link = await screen.findByRole("link", { name: /Ver as 184 avaliações no Google/ });
    expect(link).toHaveAttribute("href", "https://share.google/QZylItqH7aT9MFXYA");
    expect(link).toHaveAttribute("target", "_blank");
    unmount();

    renderAt("/urgencia");
    await screen.findByTestId("ad-lp-cta-hero");
    expect(screen.queryByRole("link", { name: /Ver as 184 avaliações no Google/ })).toBeNull();
  });

  it("reconciliacao's default state has no product-specific CTA (still opens the intent picker)", async () => {
    renderAt("/reconciliacao");
    // O CTA do hero virou `scroll-vitrine` no P2.2 e não abre mais o seletor
    // (ver adLpCro.test.tsx); quem o abre agora são os CTAs genéricos. Este
    // teste continuava clicando no hero e só não acusava porque estourava antes
    // no scrollIntoView que o jsdom não implementa.
    fireEvent.click(await screen.findByTestId("ad-lp-cta-final"));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Quero lírios")).toBeInTheDocument();
    expect(screen.getByText("Quero rosas")).toBeInTheDocument();
    expect(openWhatsAppModal).not.toHaveBeenCalled();
  });

  it("?criativo=lirio on reconciliacao sends the hero CTA straight to the lírios product", async () => {
    renderAt("/reconciliacao?criativo=lirio");

    await screen.findByRole("heading", {
      level: 1,
      name: "Lírios para mostrar que você foi além da mensagem.",
    });

    fireEvent.click(await screen.findByTestId("ad-lp-cta-hero"));

    expect(openWhatsAppModal).toHaveBeenCalledWith(
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        product_id: "arranjo-mao-lirios-p",
        product_price: "R$ 159,90",
      }),
      expect.stringContaining("Arranjo de Mão Lírios P - R$ 159,90"),
      "pagina=reconciliacao",
    );
  });

  it("reconciliacao compacts the guarantee strip that sits right after the hero", async () => {
    const { container } = renderAt("/reconciliacao");
    await screen.findByTestId("ad-lp-cta-hero");
    expect(container.querySelector(".ad-lp-guarantee--compact")).toBeInTheDocument();
  });

  it.each([
    ["rosas-199", "buque-rosas-astromelias", "Buquê de Rosas com Astromélias"],
    ["orquidea-135", "orquidea-mini-phaleanopsis", "Orquídea Mini Phalaenopsis"],
    ["rosa-65", "rosa-astromelia-unitaria", "Rosa Unitária com Astromélia"],
    ["astromelia-124", "cone-astromelia", "Cone de Astromélia"],
  ])(
    "?oferta=%s on catalogo-precos reorders the vitrine to the advertised product",
    async (offer, productId, productName) => {
      const { container } = renderAt(`/catalogo-precos?oferta=${offer}`);
      await waitFor(() => {
        const firstCard = container.querySelector(".ad-lp-vitrine__grid .ad-lp-card");
        expect(firstCard).toHaveTextContent(productName);
      });
      const firstCard = container.querySelector(".ad-lp-vitrine__grid .ad-lp-card");
      expect(firstCard).toHaveTextContent("Visto no anúncio");
      expect(firstCard?.querySelector(`[data-testid="product-card-${productId}"]`)).not.toBeNull();
    },
  );

  it("catalogo-precos derives its headline from the real minimum vitrine price", async () => {
    renderAt("/catalogo-precos");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Flores a partir de R$ 65,00." }),
    ).toBeInTheDocument();
  });

  it("catalogo-precos shows category/price filters that hide zero-result options", async () => {
    renderAt("/catalogo-precos");
    await screen.findByTestId("ad-lp-cta-hero");

    expect(screen.getByRole("button", { name: /^Rosas/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Lírios/ })).toBeInTheDocument();
    // Orquídea e astromélia agora têm produto real na vitrine.
    expect(screen.getByRole("button", { name: /^Orquídeas/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Astromélias/ })).toBeInTheDocument();
    // Flor do campo continua sem produto nessa vitrine — filtro some.
    expect(screen.queryByRole("button", { name: /^Flores do campo/ })).toBeNull();
  });

  it("catalogo-precos filters the vitrine when a category is selected", async () => {
    renderAt("/catalogo-precos");
    await screen.findByTestId("ad-lp-cta-hero");

    fireEvent.click(screen.getByRole("button", { name: /^Lírios/ }));

    const cards = screen.getAllByTestId(/^product-card-/);
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.getAttribute("data-testid")).toMatch(/lirios/);
    }
  });

  it("does not use whatsapp:// anywhere in the ad-lp implementation", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(
      join(process.cwd(), "src/features/ad-lps/AdLandingPage.tsx"),
      "utf8",
    );
    expect(source).not.toContain("whatsapp://");
  });
});
