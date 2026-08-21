import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { PRODUCTS } from "@/features/ad-lps/data/configs";

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

describe("ad LP CRO — hero badges (P1.1)", () => {
  beforeEach(() => {
    openWhatsAppModal.mockClear();
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the three rewritten lírios benefits on /lirios-apt", async () => {
    renderAt("/lirios-apt");

    const badges = await screen.findByLabelText("Diferenciais");
    expect(badges).toHaveTextContent("Entrega hoje ou agendada em Goiânia");
    expect(badges).toHaveTextContent("Você aprova a foto real antes da entrega");
    expect(badges).toHaveTextContent("Embalagem caprichada e cartão escrito à mão grátis");
  });

  it("keeps the current benefits on pages without custom badges", async () => {
    const { unmount } = renderAt("/presente-hoje");
    const badges = await screen.findByLabelText("Diferenciais");
    expect(badges).toHaveTextContent("Entrega ou agendamento em Goiânia");
    expect(badges).toHaveTextContent("Encomenda com data combinada");
    expect(badges).toHaveTextContent("Embalagem caprichada e cartão grátis");
    unmount();
  });

  it("keeps the urgencia special-case benefit untouched", async () => {
    renderAt("/urgencia");

    const badges = await screen.findByLabelText("Diferenciais");
    expect(badges).toHaveTextContent("Entrega hoje em Goiânia");
    expect(badges).not.toHaveTextContent("Entrega ou agendamento em Goiânia");
  });
});

describe("ad LP CRO — comparison strip (P1.2)", () => {
  it("shows the Arranjo × Buquê strip inside the vitrine on /lirios-apt", async () => {
    renderAt("/lirios-apt");

    const strip = await screen.findByTestId("ad-lp-comparison-strip");
    expect(strip).toHaveTextContent("Arranjo de Mão");
    expect(strip).toHaveTextContent("R$ 159,90–289,90");
    expect(strip).toHaveTextContent("Melhor custo-benefício e presente delicado");
    expect(strip).toHaveTextContent("Buquê de Lírios");
    expect(strip).toHaveTextContent("R$ 299,90–459,90");
    expect(strip).toHaveTextContent("Mais volume, acabamento premium e maior impacto");

    const vitrine = document.getElementById("vitrine");
    expect(vitrine).not.toBeNull();
    expect(vitrine?.contains(strip)).toBe(true);
  });

  it("does not render the strip on pages without the config", async () => {
    renderAt("/presente-hoje");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByTestId("ad-lp-comparison-strip")).not.toBeInTheDocument();
  });
});

describe("ad LP CRO — size impact labels (P1.3)", () => {
  it("shows P/M/G impact labels on /lirios-apt cards", async () => {
    renderAt("/lirios-apt");

    const p = await screen.findByTestId("product-card-arranjo-mao-lirios-p");
    expect(p).toHaveTextContent("P · ~35cm");
    expect(p).toHaveTextContent("Delicado");

    const m = screen.getByTestId("product-card-arranjo-mao-lirios-m");
    expect(m).toHaveTextContent("M · ~42cm");
    expect(m).toHaveTextContent("Marcante");

    const g = screen.getByTestId("product-card-arranjo-mao-lirios-g");
    expect(g).toHaveTextContent("G · ~50cm");
    expect(g).toHaveTextContent("Grande impacto");
  });

  it("keeps cards clean on pages without vitrineShowSize", async () => {
    renderAt("/presente-hoje");

    const card = await screen.findByTestId("product-card-buque-classico-rosas");
    expect(card).not.toHaveTextContent("Delicado");
    expect(card).not.toHaveTextContent("Marcante");
    expect(card).not.toHaveTextContent("Grande impacto");
  });
});

describe("ad LP CRO — distinct product images (P1.4)", () => {
  it("never reuses the same photo between buque-lirios M and G", () => {
    const m = PRODUCTS["buque-lirios-m"];
    const g = PRODUCTS["buque-lirios-g"];
    expect(m.image).toBeTruthy();
    expect(g.image).toBeTruthy();
    expect(g.image).not.toBe(m.image);
  });
});

describe("ad LP CRO — reconciliacao hero copy (P2.2)", () => {
  beforeEach(() => {
    openWhatsAppModal.mockClear();
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the new hero copy on /reconciliacao", async () => {
    renderAt("/reconciliacao");

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Um gesto para reabrir a conversa — entregue hoje em Goiânia.",
    );
    expect(screen.getByText("UM GESTO PARA HOJE")).toBeInTheDocument();
    expect(
      screen.getByText(/Flores para pedir desculpas a partir de R\$ 99,90, com cartão escrito à mão/),
    ).toBeInTheDocument();
  });
});

describe("ad LP CRO — reconciliacao hero CTAs (P2.2)", () => {
  beforeEach(() => {
    openWhatsAppModal.mockClear();
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("primary hero CTA scrolls to the vitrine instead of opening WhatsApp", async () => {
    renderAt("/reconciliacao");

    const cta = await screen.findByTestId("ad-lp-cta-hero");
    expect(cta).toHaveTextContent("Ver opções a partir de R$ 99,90");
    expect(cta.tagName).toBe("A");
    expect(cta).toHaveAttribute("href", "#vitrine");

    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    fireEvent.click(cta);

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth", block: "start" }),
    );
    expect(openWhatsAppModal).not.toHaveBeenCalled();
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  it("secondary hero CTA opens the guided WhatsApp with the right context", async () => {
    renderAt("/reconciliacao");

    const secondary = await screen.findByTestId("ad-lp-secondary-cta");
    expect(secondary).toHaveTextContent("Pedir ajuda no WhatsApp");

    fireEvent.click(secondary);

    expect(openWhatsAppModal).toHaveBeenCalledTimes(1);
    const [url, payload, message, suffix] = openWhatsAppModal.mock.calls[0];
    expect(url).toContain("wa.me");
    expect(payload).toMatchObject({
      lp_slug: "reconciliacao",
      cta_location: "hero",
      cta_label: "hero_guided_whatsapp",
      delivery_intent: "entrega hoje em Goiânia",
    });
    expect(message).toContain("Ola! Vi a pagina de flores para reconciliacao");
    expect(message).toContain(
      "Quero ajuda para escolher flores para pedir desculpas e reabrir a conversa.",
    );
    expect(suffix).toBe("pagina=reconciliacao");
  });

  it("keeps the default primary and secondary CTAs on other pages", async () => {
    renderAt("/lirios-apt");

    const cta = await screen.findByTestId("ad-lp-cta-hero");
    expect(cta).toHaveTextContent("Comprar no WhatsApp");

    const secondary = screen.getByTestId("ad-lp-see-products");
    expect(secondary).toHaveTextContent("Ver produtos");
    expect(screen.queryByTestId("ad-lp-secondary-cta")).not.toBeInTheDocument();
  });
});

describe("ad LP CRO — dynamic urgency line (P2.3)", () => {
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("shows the same-day promise before the 18h cutoff on weekdays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T20:00:00Z")); // qui 17:00 em SP

    renderAt("/reconciliacao");

    expect(screen.getByTestId("ad-lp-urgency-line")).toHaveTextContent(
      "Peça até as 18h e receba hoje.",
    );
  });

  it("switches to the tomorrow promise after 18h on weekdays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T22:00:00Z")); // qui 19:00 em SP

    renderAt("/reconciliacao");

    expect(screen.getByTestId("ad-lp-urgency-line")).toHaveTextContent(
      "Agende agora para amanhã ou escolha outra data.",
    );
  });

  it("cuts same-day delivery at 13h on Saturdays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-22T16:00:00Z")); // sáb 13:00 em SP

    renderAt("/reconciliacao");

    expect(screen.getByTestId("ad-lp-urgency-line")).toHaveTextContent(
      "Agende agora para amanhã ou escolha outra data.",
    );
  });

  it("offers same-day delivery on Saturday mornings", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-22T13:00:00Z")); // sáb 10:00 em SP

    renderAt("/reconciliacao");

    expect(screen.getByTestId("ad-lp-urgency-line")).toHaveTextContent(
      "Peça até as 18h e receba hoje.",
    );
  });

  it("never promises same-day delivery on Sundays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T15:00:00Z")); // dom 12:00 em SP

    renderAt("/reconciliacao");

    expect(screen.getByTestId("ad-lp-urgency-line")).toHaveTextContent(
      "Agende agora para amanhã ou escolha outra data.",
    );
  });

  it("does not render the line on pages without urgencyWindow", async () => {
    // /lirios-apt saiu daqui no P3.1 — /presente-hoje é a LP sem urgencyWindow.
    renderAt("/presente-hoje");
    await screen.findByRole("heading", { level: 1 });

    expect(screen.queryByTestId("ad-lp-urgency-line")).not.toBeInTheDocument();
  });
});

describe("ad LP CRO — objeções pré-clique na /lirios-apt (P3)", () => {
  beforeEach(() => {
    openWhatsAppModal.mockClear();
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("answers the four cold-visitor objections without any click", async () => {
    renderAt("/lirios-apt");

    const strip = await screen.findByTestId("ad-lp-reassurance-strip");
    expect(strip).toHaveTextContent("Frete sem surpresa");
    expect(strip).toHaveTextContent("Calculado pelo seu CEP e informado antes de você fechar.");
    expect(strip).toHaveTextContent("Foto antes de sair");
    expect(strip).toHaveTextContent("Cor do dia");
    expect(strip).toHaveTextContent("Pague como preferir");
    expect(strip).toHaveTextContent("Pix, débito, dinheiro na entrega ou 3× sem juros.");

    // Sempre visível: nada de <details>, senão a objeção continua escondida.
    expect(strip.querySelector("details")).toBeNull();
  });

  it("puts the strip inside the vitrine, above the comparison strip", async () => {
    renderAt("/lirios-apt");

    const strip = await screen.findByTestId("ad-lp-reassurance-strip");
    const comparison = screen.getByTestId("ad-lp-comparison-strip");
    const vitrine = document.getElementById("vitrine");

    expect(vitrine?.contains(strip)).toBe(true);
    expect(strip.compareDocumentPosition(comparison)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("keeps the vitrine heading outline in order (h2 before its h3s)", async () => {
    renderAt("/lirios-apt");

    await screen.findByTestId("ad-lp-reassurance-strip");
    const vitrine = document.getElementById("vitrine")!;
    const levels = Array.from(vitrine.querySelectorAll("h2, h3")).map((h) => h.tagName);

    // O <h2> da seção tem de vir primeiro: com as faixas na frente, os <h3>
    // delas ficavam pendurados no <h2> da garantia no índice de cabeçalhos.
    expect(levels[0]).toBe("H2");
    expect(levels.slice(1).every((tag) => tag === "H3")).toBe(true);
  });

  it("does not render the strip on pages without reassurances", async () => {
    renderAt("/presente-hoje");
    await screen.findByRole("heading", { level: 1 });

    expect(screen.queryByTestId("ad-lp-reassurance-strip")).not.toBeInTheDocument();
  });

  it("keeps the hero free of a delivery banner competing with the WhatsApp CTA", async () => {
    renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    // A faixa de prazo saiu do hero: ficava entre os CTAs e os selos, roubando
    // atenção do botão do WhatsApp. O prazo segue no selo e no FAQ.
    expect(screen.queryByTestId("ad-lp-urgency-line")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Diferenciais")).toHaveTextContent(
      "Entrega hoje ou agendada em Goiânia",
    );
    // A promessa fixa também não voltou para o subheadline.
    expect(screen.queryByText(/a gente entrega hoje — ou agenda a data/)).toBeNull();
  });

  it("demotes the scroll-to-vitrine CTA so it does not look like a second button", async () => {
    renderAt("/lirios-apt");

    const secondary = await screen.findByTestId("ad-lp-see-products");
    expect(secondary).toHaveTextContent("Ver produtos");
    expect(secondary.className).toContain("ad-lp-secondary-cta--quiet");

    // O CTA de conversão da /reconciliacao é o secundário e não pode ser
    // rebaixado junto.
    cleanup();
    renderAt("/reconciliacao");
    const guided = await screen.findByTestId("ad-lp-secondary-cta");
    expect(guided.className).not.toContain("ad-lp-secondary-cta--quiet");
  });

  it("answers freight and payment in the footer FAQ, before the generic ones", async () => {
    renderAt("/lirios-apt");

    await screen.findByRole("heading", { level: 1 });
    const faq = document.getElementById("faq");
    expect(faq).not.toBeNull();

    const questions = Array.from(faq!.querySelectorAll("summary")).map(
      (item) => item.textContent,
    );
    expect(questions.slice(0, 3)).toEqual([
      "Quanto vou pagar de frete?",
      "Ainda dá tempo de receber hoje?",
      "Preciso pagar antes da entrega?",
    ]);
  });

  it("links out to the public Google reviews", async () => {
    renderAt("/lirios-apt");

    const link = await screen.findByRole("link", { name: /avaliações no Google/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("share.google"));
  });
});
