import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { PRODUCTS } from "@/features/ad-lps/data/configs";
import { DELIVERY_FEE_GUIDANCE, DELIVERY_FEES } from "@/lib/business-info";

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

  it("shows the three proof lines on /lirios-apt", async () => {
    renderAt("/lirios-apt");

    const badges = await screen.findByLabelText("Diferenciais");
    expect(badges).toHaveTextContent("Entrega hoje em Goiânia, Aparecida e Senador Canedo");
    expect(badges).toHaveTextContent("Cartão escrito à mão incluído");
    // A promessa da foto vive aqui e na subheadline — não no h1, que devolve o
    // preço do anúncio.
    expect(badges).toHaveTextContent("Você aprova a foto real antes da entrega");
    // Valor de frete vive num lugar só, o FAQ (DELIVERY_FEES). Copiá-lo para o
    // hero cria a divergência na primeira mudança de preço.
    expect(badges).not.toHaveTextContent("R$");
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
  it("no longer renders the strip on /lirios-apt", async () => {
    renderAt("/lirios-apt");
    await screen.findByRole("heading", { level: 1 });

    // Os dois cards viraram texto acima da grade: card dentro de card empurrava
    // a vitrine para baixo sem responder nada que o próprio preço não diga.
    expect(screen.queryByTestId("ad-lp-comparison-strip")).not.toBeInTheDocument();
  });

  it("does not render the strip on pages without the config", async () => {
    renderAt("/presente-hoje");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByTestId("ad-lp-comparison-strip")).not.toBeInTheDocument();
  });
});

describe("ad LP CRO — size impact labels (P1.3)", () => {
  // A /lirios-apt era a única LP com `vitrineShowSize`. O redesign rebaixou a
  // ficha técnica no card (§5 da spec), então nenhuma liga a flag hoje — o que
  // este teste guarda é o default: sem a flag, o card não ganha rótulo.
  it.each([
    ["/presente-hoje", "product-card-buque-classico-rosas"],
    ["/lirios-apt", "product-card-arranjo-mao-lirios-p"],
  ])("keeps %s cards clean without vitrineShowSize", async (path, testId) => {
    renderAt(path);

    const card = await screen.findByTestId(testId);
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
    // Controle: uma LP que o redesign da /lirios-apt não tocou. Se o rótulo
    // padrão do botão secundário vazar para cá, o escopo vazou junto.
    renderAt("/rosas-apt");

    const cta = await screen.findByTestId("ad-lp-cta-hero");
    expect(cta).toHaveTextContent("Quero presentear hoje");

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

describe("ad LP CRO — redesign da /lirios-apt", () => {
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

  it("drops the four reassurance boxes from the top of the vitrine", async () => {
    renderAt("/lirios-apt");
    await screen.findByRole("heading", { level: 1 });

    // As caixas competiam com os produtos na dobra que mais converte. O
    // conteúdo se redistribuiu: frete e foto viraram prova no hero, cor do dia
    // vira a faixa do dia e pagamento é pergunta do FAQ.
    expect(screen.queryByTestId("ad-lp-reassurance-strip")).not.toBeInTheDocument();
  });

  it("keeps the vitrine heading outline in order (h2 before its h3s)", async () => {
    renderAt("/lirios-apt");

    await screen.findByTestId("product-card-arranjo-mao-lirios-m");
    const vitrine = document.getElementById("vitrine")!;
    const levels = Array.from(vitrine.querySelectorAll("h2, h3")).map((h) => h.tagName);

    expect(levels[0]).toBe("H2");
    expect(levels.slice(1).every((tag) => tag === "H3")).toBe(true);
  });

  it("does not render the reassurance strip on pages without reassurances", async () => {
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
      "Entrega hoje em Goiânia, Aparecida e Senador Canedo",
    );
  });

  it("demotes the scroll-to-vitrine CTA so it does not look like a second button", async () => {
    renderAt("/lirios-apt");

    const secondary = await screen.findByTestId("ad-lp-see-products");
    expect(secondary).toHaveTextContent("Ver os 6 arranjos");
    expect(secondary.className).toContain("ad-lp-secondary-cta--quiet");

    // O CTA de conversão da /reconciliacao é o secundário e não pode ser
    // rebaixado junto.
    cleanup();
    renderAt("/reconciliacao");
    const guided = await screen.findByTestId("ad-lp-secondary-cta");
    expect(guided.className).not.toContain("ad-lp-secondary-cta--quiet");
  });

  it("shows one FAQ of eight questions, in the order they block the purchase", async () => {
    renderAt("/lirios-apt");
    await screen.findByRole("heading", { level: 1 });

    const faq = document.getElementById("faq")!;
    const questions = Array.from(faq.querySelectorAll("summary")).map(
      (item) => item.textContent,
    );
    expect(questions).toEqual([
      "Quanto vou pagar de frete?",
      "Ainda dá tempo de receber hoje?",
      "O buquê vai igual à foto do site?",
      "Como posso pagar?",
      "Lírios duram menos que rosas?",
      "Tem outras cores além de rosa?",
      "O perfume é forte mesmo?",
      "Posso agendar para outro dia?",
    ]);

    // Os dois blocos viraram um: o FAQ curto da vitrine sumiu e o COMMON_FAQ
    // não é mais concatenado, senão "O buquê vai igual à foto?" apareceria duas
    // vezes na mesma página.
    expect(screen.queryByTestId("ad-lp-vitrine-faq")).not.toBeInTheDocument();
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("opens the freight question by default, with the real fee table", async () => {
    renderAt("/lirios-apt");
    await screen.findByRole("heading", { level: 1 });

    const faq = document.getElementById("faq")!;
    const items = Array.from(faq.querySelectorAll("details"));
    const freight = items[0]!;

    expect(freight.querySelector("summary")).toHaveTextContent("Quanto vou pagar de frete?");
    expect(freight.hasAttribute("open")).toBe(true);
    // A única aberta: com todas abertas o FAQ vira parede de texto.
    expect(items.filter((item) => item.hasAttribute("open"))).toHaveLength(1);

    for (const fee of DELIVERY_FEES) {
      expect(freight).toHaveTextContent(fee.label);
      expect(freight).toHaveTextContent(fee.value);
    }
    expect(freight).toHaveTextContent("Na maioria dos bairros, o frete custa R$ 15,00");
    expect(freight).toHaveTextContent("R$ 25,00 é o teto, não o valor padrão");
    expect(freight).toHaveTextContent(/CEP no WhatsApp/);
  });

  it("emits the FAQPage JSON-LD with the same questions the page shows", async () => {
    renderAt("/lirios-apt");
    await screen.findByRole("heading", { level: 1 });

    const script = document
      .getElementById("faq")!
      .querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();

    const data = JSON.parse(script!.textContent!);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(8);
    expect(data.mainEntity[0].name).toBe("Quanto vou pagar de frete?");
    // Os valores da tabela entram na resposta: o rich result não renderiza <ul>.
    expect(data.mainEntity[0].acceptedAnswer.text).toContain("R$ 10,00");
  });

  it("does not emit FAQ JSON-LD on pages without the flag", async () => {
    renderAt("/presente-hoje");
    await screen.findByRole("heading", { level: 1 });

    expect(
      document.getElementById("faq")!.querySelector('script[type="application/ld+json"]'),
    ).toBeNull();
  });

  it("links out to the public Google reviews", async () => {
    renderAt("/lirios-apt");

    const link = await screen.findByRole("link", { name: /avaliações no Google/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("share.google"));
  });
});

describe("ad LP CRO — vitrine da /lirios-apt", () => {
  beforeEach(() => {
    openWhatsAppModal.mockClear();
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("puts the intent line right after the product name, with the spec tech line demoted", async () => {
    renderAt("/lirios-apt");

    const card = await screen.findByTestId("product-card-arranjo-mao-lirios-m");
    const pitch = card.querySelector(".ad-lp-card__pitch")!;
    expect(pitch).toHaveTextContent(
      "O mais vendido, com volume para marcar a foto e a lembrança de quem recebe.",
    );
    // A linha vem logo depois do nome; a ficha técnica continua no card, só que
    // depois do preço (a ordem visual é feita por `order` no CSS do slug).
    expect(card.querySelector(".ad-lp-card__name")!.nextElementSibling).toBe(pitch);
    expect(card.querySelector(".ad-lp-card__details")).not.toBeNull();

    // Os seis têm linha de intenção: um card sem ela ficaria visivelmente curto.
    for (const el of document.querySelectorAll("[data-testid^='product-card-']")) {
      expect(el.querySelector(".ad-lp-card__pitch")?.textContent ?? "").not.toBe("");
    }
  });

  it("renames the price badges to describe the product, not the store", async () => {
    renderAt("/lirios-apt");

    expect(await screen.findByTestId("product-card-arranjo-mao-lirios-p")).toBeTruthy();
    const badgeOf = (id: string) =>
      document
        .querySelector(`[data-testid="product-card-${id}"]`)!
        .closest(".ad-lp-card")!
        .querySelector(".ad-lp-card__badge")?.textContent;

    expect(badgeOf("arranjo-mao-lirios-m")).toBe("Mais vendido");
    expect(badgeOf("arranjo-mao-lirios-p")).toBe("Menor preço");
    expect(badgeOf("buque-lirios-g")).toBe("O maior");
  });

  it("keeps the default badge labels on LPs without the override", async () => {
    renderAt("/rosas-apt");

    await screen.findByTestId("ad-lp-cta-hero");
    const labels = Array.from(document.querySelectorAll(".ad-lp-card__badge")).map(
      (el) => el.textContent,
    );
    expect(labels).toContain("Custo-benefício");
    expect(labels).not.toContain("Menor preço");
  });

  it("replaces the Arranjo × Buquê cards with two lines above the grid", async () => {
    renderAt("/lirios-apt");

    const intro = await screen.findByTestId("ad-lp-vitrine-intro");
    const lines = intro.querySelectorAll("p");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveTextContent("Arranjo de mão");
    expect(lines[0]).toHaveTextContent("R$ 159,90 a R$ 289,90.");
    expect(lines[1]).toHaveTextContent("Buquê");
    expect(lines[1]).toHaveTextContent("R$ 299,90 a R$ 424,90.");

    // Acima da grade, dentro da vitrine.
    const grid = document.querySelector(".ad-lp-vitrine__grid")!;
    expect(intro.compareDocumentPosition(grid)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("hydrates each product CTA into a button and preserves the conversion payload", async () => {
    renderAt("/lirios-apt?utm_source=meta&utm_campaign=lirios");

    const cta = await screen.findByTestId("product-cta-buque-lirios-m");
    expect(cta.tagName).toBe("BUTTON");
    expect(cta).toHaveTextContent("Comprar este no WhatsApp");
    fireEvent.click(cta);

    expect(openWhatsAppModal).toHaveBeenCalledTimes(1);
    const [, payload, message] = openWhatsAppModal.mock.calls[0];
    expect(payload).toMatchObject({
      lp_slug: "lirios-apt",
      cta_location: "vitrine",
      cta_label: "produto_whatsapp",
      product_id: "buque-lirios-m",
      product_name: "Buquê de Lírios M",
      product_price: "R$ 389,90",
    });
    expect(message).toContain("Buquê de Lírios M - R$ 389,90");
  });

  it("leaves the other LPs without intent lines, pledge or intro", async () => {
    renderAt("/rosas-apt");

    await screen.findByTestId("ad-lp-cta-hero");
    expect(screen.queryByTestId("ad-lp-vitrine-intro")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ad-lp-pledge")).not.toBeInTheDocument();
    expect(document.querySelector(".ad-lp-card__pitch")).toBeNull();
    // E a garantia da /rosas-apt continua sendo seção própria.
    expect(document.querySelector(".ad-lp-guarantee")).not.toBeNull();
  });
});

describe("ad LP CRO — hero e faixa do dia da /lirios-apt", () => {
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

  it("restores the editorial price chip and keeps the promised price in the headline", async () => {
    const { container } = renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    const title = await screen.findByRole("heading", { level: 1 });
    expect(title.textContent).toBe("Lírios a partir de R$ 159,90.");

    expect(container.querySelector(".ad-lp-hero__anchor")).toHaveTextContent(
      "A partir de R$ 159,90",
    );
    expect(container.querySelectorAll(".ad-lp-hero__content *:not(script)")).not.toHaveLength(0);
    const heroText = container.querySelector(".ad-lp-hero__content")!.textContent ?? "";
    expect(heroText.match(/R\$ 159,90/g)).toHaveLength(2);

    // E a foto volta a ser fundo: nada de coluna, nada de card sobreposto.
    const hero = container.querySelector(".ad-lp-hero")!;
    expect(hero.className).not.toContain("ad-lp-hero--split");
    expect(hero.querySelector(".ad-lp-hero__grid")).toBeNull();
    expect(hero.querySelector(".ad-lp-chat")).toBeNull();
  });

  it("keeps the photo promise in the subheadline, not in the headline", async () => {
    const { container } = renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    // O anúncio promete preço; a promessa da foto entra depois, sem disputar o
    // h1 com o message match.
    expect(container.querySelector(".ad-lp-hero__sub")).toHaveTextContent(
      "Você aprova a foto antes da entrega",
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).not.toContain("foto");
  });

  it("keeps the CTA in the steps column and the WhatsApp example in its own column", async () => {
    renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    const chat = screen.getByTestId("ad-lp-chat-example");

    const layout = chat.closest(".ad-lp-beats__layout")!;
    const main = layout.querySelector(".ad-lp-beats__main")!;
    const cta = screen.getByTestId("ad-lp-cta-como_funciona");
    expect(main).toContainElement(cta);
    expect(chat.closest(".ad-lp-beats__conversation")).not.toBeNull();
    expect(chat.closest(".ad-lp-beats__item")).toBeNull();
    expect(main).toHaveTextContent("Você aprova a foto");
    expect(chat.closest("#hero")).toBeNull();

    // O rótulo é o que separa isto de um print real de conversa. Precisa estar
    // no DOM, visível, e não escondido de leitor de tela.
    const label = chat.querySelector(".ad-lp-chat__label")!;
    expect(label).toHaveTextContent("Exemplo");
    expect(label.getAttribute("aria-hidden")).toBeNull();

    const bubbles = chat.querySelectorAll(".ad-lp-chat__bubble");
    expect(bubbles).toHaveLength(3);
    expect(bubbles[0]).toHaveTextContent("Ficou assim. Podemos sair para a entrega?");
    expect(bubbles[1].className).toContain("ad-lp-chat__bubble--mine");
    expect(bubbles[1]).toHaveTextContent("Pode! Ficou lindo");
    expect(bubbles[2]).toHaveTextContent("Escrevemos o cartão à mão");

    // A foto do card é a do Arranjo de Mão G, diferente da do card em destaque
    // da vitrine: repetir a mesma imagem desperdiçaria as duas.
    const photo = bubbles[0].querySelector("img")!;
    expect(photo.getAttribute("src")).toBe(PRODUCTS["arranjo-mao-lirios-g"].image);
    expect(photo.getAttribute("src")).not.toBe(PRODUCTS["arranjo-mao-lirios-m"].image);
  });

  it("keeps the other LPs without the example card", async () => {
    renderAt("/rosas-apt");

    await screen.findByTestId("ad-lp-cta-hero");
    expect(screen.queryByTestId("ad-lp-chat-example")).not.toBeInTheDocument();
    expect(document.querySelector(".ad-lp-hero--split")).toBeNull();
  });

  it("shows a calm closed-store message on Sunday", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T15:00:00Z")); // dom 12:00 em SP

    renderAt("/lirios-apt");

    const delivery = screen.getByTestId("ad-lp-delivery-info");
    expect(delivery.tagName).toBe("DIV");
    expect(delivery).toHaveTextContent("Informações de entrega");
    expect(delivery).toHaveTextContent(DELIVERY_FEE_GUIDANCE);
    expect(screen.getByTestId("ad-lp-delivery-timing")).toHaveTextContent(
      "A loja está fechada aos domingos",
    );
  });

  it("counts the real time left to the cutoff inside the window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T18:20:00Z")); // seg 15:20 em SP

    renderAt("/lirios-apt");

    expect(screen.getByTestId("ad-lp-delivery-timing")).toHaveTextContent(
      "Faltam 2h 40min para fechar as entregas de hoje.",
    );
  });

  it("does not count down before the store opens", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T09:00:00Z")); // seg 06:00 em SP

    renderAt("/lirios-apt");

    expect(screen.getByTestId("ad-lp-delivery-timing")).toHaveTextContent(
      "A loja abre às 8h. Envie seu pedido agora para combinar a entrega.",
    );
  });

  it("leaves delivery details out of the other LPs", async () => {
    renderAt("/presente-hoje");

    await screen.findByTestId("ad-lp-cta-hero");
    expect(screen.queryByTestId("ad-lp-delivery-info")).not.toBeInTheDocument();
  });
});

describe("ad LP CRO — prova, loja e fecho da /lirios-apt", () => {
  beforeEach(() => {
    openWhatsAppModal.mockClear();
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("replaces the review carousel with one shout and four voices", async () => {
    const { container } = renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    const proof = screen.getByTestId("ad-lp-proof-quotes");

    // Numa LP fria o medo é a entrega, não a simpatia do atendimento.
    expect(proof.querySelector(".ad-lp-proof__shout blockquote")).toHaveTextContent(
      "Produto chegou no dia e na hora combinado",
    );
    expect(proof.querySelector(".ad-lp-proof__shout figcaption")).toHaveTextContent(
      "Marcos Vinícius · avaliação pública no Google",
    );

    const voices = proof.querySelectorAll(".ad-lp-voice");
    expect(voices).toHaveLength(4);
    expect([...voices].map((voice) => voice.querySelector("figcaption")?.textContent)).toEqual([
      "Melissa Pimentel",
      "Hellen Araújo",
      "Tainá Santos",
      "Fabiana Moraes",
    ]);

    // Sem carrossel: nada de autoplay nem de botões de navegação nesta LP.
    expect(container.querySelector(".ad-lp-proof__carousel")).toBeNull();
    expect(screen.queryByLabelText("Próxima avaliação")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Avaliação anterior")).not.toBeInTheDocument();

    // O agregado é conferível: número e link para o Google.
    expect(proof).toHaveTextContent("4.9 · 203 avaliações públicas no Google");
    expect(proof.querySelector('a[href*="google"]')).not.toBeNull();
  });

  it("keeps the carousel on the LPs the redesign did not touch", async () => {
    const { container } = renderAt("/rosas-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    expect(screen.queryByTestId("ad-lp-proof-quotes")).not.toBeInTheDocument();
    expect(container.querySelector(".ad-lp-proof__carousel")).not.toBeNull();
    expect(screen.getByLabelText("Próxima avaliação")).toBeInTheDocument();
  });

  it("merges the two how-it-works sections into four beats, keeping the CTA", async () => {
    const { container } = renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    const beats = screen.getByTestId("ad-lp-beats");
    const items = beats.querySelectorAll(".ad-lp-beats__item");
    expect(items).toHaveLength(4);
    expect([...items].map((item) => item.querySelector("h3")?.textContent)).toEqual([
      "Você escolhe",
      "Montamos seu pedido",
      "Você aprova a foto",
      "Chega hoje",
    ]);

    // Um só destaque: a promessa que a concorrência não faz.
    const keyed = beats.querySelectorAll(".ad-lp-beats__item--key");
    expect(keyed).toHaveLength(1);
    expect(keyed[0]).toHaveTextContent("Você aprova a foto");

    // A numeração é do CSS (counter), não texto duplicado no DOM.
    expect(beats.textContent).not.toContain("01");

    // O ponto de conversão que vivia no "como funciona" continua aqui, com a
    // mesma origem — o cta_location do evento não muda.
    expect(beats.parentElement?.querySelector('[data-testid="ad-lp-cta-como_funciona"]')).not.toBeNull();

    // E as duas seções que os tempos substituem sumiram.
    expect(container.querySelector(".ad-lp-process")).toBeNull();
    expect(container.querySelector(".ad-lp-steps")).toBeNull();
  });

  it("leaves the other LPs with their own how-it-works sections", async () => {
    renderAt("/presente-hoje");
    await screen.findByTestId("ad-lp-cta-hero");

    expect(screen.queryByTestId("ad-lp-beats")).not.toBeInTheDocument();
    expect(screen.getByTestId("ad-lp-cta-como_funciona")).toBeInTheDocument();
    expect(document.querySelector(".ad-lp-steps")).not.toBeNull();
  });

  it("gives the storefront photo a caption that says what it shows", async () => {
    const { container } = renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    expect(container.querySelector(".ad-lp-historia__caption")).toHaveTextContent(
      "Rua 132, Setor Sul. A entrega sai desta porta, no nosso carro.",
    );
  });

  it("keeps the default storefront caption everywhere else", async () => {
    const { container } = renderAt("/rosas-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    expect(container.querySelector(".ad-lp-historia__caption")).toHaveTextContent(
      "Loja física em Goiânia · 40 anos de tradição · entrega própria",
    );
  });

  it("renders the final numbers as text, so counting is an add-on and not the source", async () => {
    const { container } = renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    const values = [...container.querySelectorAll(".ad-lp-historia__stat-value")].map(
      (node) => node.textContent,
    );
    expect(values).toEqual(["+3.000", "40 anos", "4,9 ★"]);
  });

  it("closes with the copy of the redesign and leaves the other LPs alone", async () => {
    renderAt("/lirios-apt");
    await screen.findByTestId("ad-lp-cta-hero");

    expect(
      screen.getByRole("heading", { name: "Envie o endereço e a data. Cuidamos do restante." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Leva menos de um minuto")).toBeInTheDocument();
    cleanup();

    renderAt("/rosas-apt");
    await screen.findByTestId("ad-lp-cta-hero");
    expect(
      screen.getByRole("heading", { name: "Escolha agora seu buquê e fale com a gente." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Leva menos de um minuto")).not.toBeInTheDocument();
  });
});
