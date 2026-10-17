import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import {
  PRICE_RANGE_CONFIGS,
  LILY_BENEFITS,
  buildPriceRangeWhatsAppMessage,
  getLilyPriceRangeVariant,
  openPriceRangeSelector,
} from "@/lib/price-ranges";
import { PriceRangeSelector } from "@/components/conversion/PriceRangeSelector";
import { appendTrackingBlock, openPriceRangeWhatsApp } from "@/lib/whatsappModal";
import { LP_CONFIGS, PRODUCTS } from "@/features/ad-lps/data/configs";
import HOME_PRODUCTS from "@/data/featured-products.snapshot.json";

const { openWhatsAppModal, openWhatsAppDestination, trackWhatsAppClick } = vi.hoisted(() => ({
  openWhatsAppModal: vi.fn(),
  openWhatsAppDestination: vi.fn(),
  trackWhatsAppClick: vi.fn(),
}));

// Só as aberturas de WhatsApp são espionadas; a montagem da mensagem é o que
// este arquivo valida, então appendTrackingBlock precisa ser o real.
vi.mock("@/lib/tracking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tracking")>()),
  trackWhatsAppClick,
}));

vi.mock("@/lib/whatsappModal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/whatsappModal")>()),
  openWhatsAppModal,
  openWhatsAppDestination,
  openPriceRangeWhatsApp: vi.fn(),
}));

const EXPECTED_RANGES = {
  "/": ["R$ 99,90 a R$ 200", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/dia-das-maes": ["R$ 99,90 a R$ 230", "R$ 230 a R$ 300", "Acima de R$ 300"],
  "/dia-dos-namorados": ["R$ 99,90 a R$ 200", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/urgencia": ["R$ 99,90 a R$ 230", "R$ 230 a R$ 300", "Acima de R$ 300"],
  "/aniversario": ["R$ 199,90 a R$ 300", "R$ 300 a R$ 450", "Acima de R$ 450"],
  "/rosas-apt": ["R$ 99,90 a R$ 200", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/lirios-apt": [
    "R$ 159,90 a R$ 229,90",
    "R$ 289,90 a R$ 389,90",
    "R$ 424,90 · Buquê G",
  ],
  "/carro-low": ["R$ 65,00 a R$ 100", "R$ 100 a R$ 150", "Acima de R$ 150"],
  "/carro-high": ["R$ 199,90 a R$ 300", "R$ 300 a R$ 500", "Acima de R$ 500"],
  "/presente-hoje": ["R$ 99,90 a R$ 160", "R$ 160 a R$ 300", "Acima de R$ 300"],
  "/tradicao-comprovacao": ["R$ 199,90 a R$ 300", "R$ 300 a R$ 450", "Acima de R$ 450"],
  "/sem-erro": ["R$ 99,90 a R$ 230", "R$ 230 a R$ 350", "Acima de R$ 350"],
  "/qual-b": ["R$ 65,00 a R$ 109,90", "R$ 110 a R$ 249,90", "Acima de R$ 250"],
  "/so-porque-sim": ["R$ 99,90 a R$ 200", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/buque-real": ["R$ 99,90 a R$ 200", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/reconciliacao": ["R$ 99,90 a R$ 199,90", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/girassol": ["R$ 65,00 a R$ 109,90", "R$ 110 a R$ 249,90", "Acima de R$ 250"],
  "/catalogo-precos": ["R$ 65,00 a R$ 134,90", "R$ 135 a R$ 249,90", "Acima de R$ 250"],
} as const;

function parseBrl(label: string) {
  return Number(label.replace(/[^\d,]/g, "").replace(",", "."));
}

/** Menor preço realmente exposto na vitrine daquela rota. */
function vitrineFloor(route: keyof typeof EXPECTED_RANGES) {
  if (route === "/") {
    return Math.min(...HOME_PRODUCTS.map((product) => parseBrl(product.priceLabel)));
  }

  const config = LP_CONFIGS[route.slice(1)];
  const prices = config.vitrineProductIds
    .map((id) => PRODUCTS[id]?.priceBrl)
    .filter((price): price is string => Boolean(price))
    .map(parseBrl);
  return Math.min(...prices);
}

function SelectorHarness() {
  return (
    <>
      <button
        type="button"
        onClick={() =>
          openPriceRangeSelector({
            cta_location: "hero",
            cta_label: "hero_whatsapp",
          })
        }
      >
        Abrir seletor
      </button>
      <PriceRangeSelector route="/urgencia" />
    </>
  );
}

describe("price-range conversion selector", () => {
  beforeEach(() => {
    vi.mocked(openPriceRangeWhatsApp).mockClear();
    trackWhatsAppClick.mockClear();
    openWhatsAppModal.mockClear();
    openWhatsAppDestination.mockClear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => cleanup());

  it("keeps exactly the three approved ranges for all published routes", () => {
    expect(Object.keys(PRICE_RANGE_CONFIGS)).toEqual(Object.keys(EXPECTED_RANGES));

    for (const [route, expectedLabels] of Object.entries(EXPECTED_RANGES)) {
      const config = PRICE_RANGE_CONFIGS[route as keyof typeof PRICE_RANGE_CONFIGS];
      expect(config.ranges).toHaveLength(3);
      expect(config.ranges.map((range) => range.label)).toEqual(expectedLabels);
      expect(config.ranges.map((range) => range.key)).toEqual(["low", "mid", "high"]);
    }
  });

  it("defaults unknown and absent faixas values to the control copy", () => {
    expect(getLilyPriceRangeVariant("")).toBe("controle");
    expect(getLilyPriceRangeVariant("?faixas=unknown")).toBe("controle");
    expect(getLilyPriceRangeVariant("?faixas=beneficios")).toBe("beneficios");
  });

  it("changes only lilies option descriptions in the benefits variant", async () => {
    window.history.replaceState({}, "", "/lirios-apt?faixas=beneficios");
    render(<PriceRangeSelector route="/lirios-apt" />);
    act(() => openPriceRangeSelector({ cta_location: "hero" }));
    await screen.findByRole("dialog");
    for (const benefit of Object.values(LILY_BENEFITS)) expect(screen.getByText(benefit)).toBeInTheDocument();
    for (const range of PRICE_RANGE_CONFIGS["/lirios-apt"].ranges) expect(screen.getByText(range.label)).toBeInTheDocument();
  });

  it("anchors every low range on the real vitrine floor advertised by the page", () => {
    for (const route of Object.keys(EXPECTED_RANGES) as (keyof typeof EXPECTED_RANGES)[]) {
      const config = PRICE_RANGE_CONFIGS[route];
      const floor = vitrineFloor(route);

      // O piso declarado é o menor preço que a vitrine realmente mostra...
      expect({ route, floor: parseBrl(config.lowFloorBrl) }).toEqual({ route, floor });
      // ...e é ele que abre o rótulo da faixa baixa, para não parecer que o
      // produto mais barato do anúncio não existe no seletor.
      expect(config.ranges[0].label.startsWith(config.lowFloorBrl)).toBe(true);
      // Uma faixa baixa estreita demais não é uma escolha.
      expect(parseBrl(config.ranges[0].label.split(" a ")[1])).toBeGreaterThanOrEqual(
        floor * 1.25,
      );
    }
  });

  it("tracks opening, closing without a choice, and a selected WhatsApp exit for lirios", async () => {
    window.history.replaceState({}, "", "/lirios-apt?faixas=beneficios");
    window.dataLayer = [];
    render(<PriceRangeSelector route="/lirios-apt" />);
    act(() => openPriceRangeSelector({ cta_location: "hero" }));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "price_selector_open", lp_slug: "lirios-apt", cta_location: "hero", faixas_variant: "beneficios" }));
    expect(trackWhatsAppClick).not.toHaveBeenCalled();
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Fechar seletor de faixa de preço" }));
    await waitFor(() => expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "price_selector_closed_without_selection", faixas_variant: "beneficios" })));
    act(() => openPriceRangeSelector({ cta_location: "hero" }));
    fireEvent.click(await screen.findByRole("button", { name: /R\$ 159,90 a R\$ 229,90/ }));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "price_range_selected", price_range_key: "low", faixas_variant: "beneficios", cta_location: "hero" }));
    expect(window.dataLayer?.filter((entry) => entry.event === "price_selector_closed_without_selection")).toHaveLength(1);
    await waitFor(() => expect(openPriceRangeWhatsApp).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ lp_slug: "lirios-apt", cta_location: "hero", price_range_key: "low", faixas_variant: "beneficios" }), expect.any(String), expect.any(String)));
    // A função canônica gera o token e registra whatsapp_click; aqui verificamos
    // que o seletor entrega o contexto correto sem registrar um clique extra.
    expect(trackWhatsAppClick).not.toHaveBeenCalled();
  });

  it("queues the opening event before the dataLayer has been initialized", async () => {
    window.history.replaceState({}, "", "/lirios-apt?faixas=controle");
    window.dataLayer = undefined;
    render(<PriceRangeSelector route="/lirios-apt" />);
    act(() => openPriceRangeSelector({ cta_location: "hero" }));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "price_selector_open", lp_slug: "lirios-apt", faixas_variant: "controle" }));
  });

  it("does not emit lirios microevents for other LP routes", async () => {
    window.history.replaceState({}, "", "/?faixas=beneficios");
    window.dataLayer = [];
    render(<PriceRangeSelector route="/urgencia" />);
    act(() => openPriceRangeSelector({ cta_location: "hero" }));
    await screen.findByRole("dialog");
    expect(window.dataLayer).not.toEqual(expect.arrayContaining([expect.objectContaining({ event: expect.stringMatching(/^price_selector_|^price_range_selected/) })]));
    fireEvent.click(screen.getByRole("button", { name: "Fechar seletor de faixa de preço" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(window.dataLayer).not.toContainEqual(expect.objectContaining({ event: "price_selector_closed_without_selection" }));
  });

  it("builds the selected-range message with the tracking code in its own labelled block", () => {
    const baseText = buildPriceRangeWhatsAppMessage(
      "flores para entrega urgente —",
      "R$ 99,90 a R$ 230",
    );
    const message = appendTrackingBlock(baseText, "AB12CD34EF", "pagina=urgencia");

    expect(baseText).toBe(
      "Oi! Quero ver opções de flores para entrega urgente — R$ 99,90 a R$ 230.",
    );
    expect(message).toBe(
      "Oi! Quero ver opções de flores para entrega urgente — R$ 99,90 a R$ 230.\n\nCódigo de atendimento: AB12CD34EF · pagina=urgencia",
    );
    // O código precisa vir rotulado e num bloco próprio: solto no fim da frase
    // o cliente apaga junto com o resto antes de enviar.
    expect(message).toMatch(/\n\nCódigo de atendimento: [A-Z0-9]{10} · pagina=urgencia$/);
    expect(message).not.toContain("marcar com");
  });

  it("opens and closes without conversion, restores focus, and keeps keyboard focus contained", async () => {
    render(<SelectorHarness />);
    const trigger = screen.getByRole("button", { name: "Abrir seletor" });

    trigger.focus();
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Qual faixa combina com o seu presente?" });
    const choices = screen.getAllByRole("button", { name: /R\$/ });
    expect(dialog).toBeInTheDocument();
    expect(choices).toHaveLength(3);
    expect(choices[0]).toHaveFocus();
    expect(openPriceRangeWhatsApp).not.toHaveBeenCalled();
    expect(trackWhatsAppClick).not.toHaveBeenCalled();

    choices[2].focus();
    fireEvent.keyDown(choices[2], { key: "Tab" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(openPriceRangeWhatsApp).not.toHaveBeenCalled();
    expect(trackWhatsAppClick).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    const backdrop = await screen.findByTestId("price-range-backdrop");
    fireEvent.pointerDown(backdrop);
    fireEvent.click(backdrop);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(openPriceRangeWhatsApp).not.toHaveBeenCalled();
  });

  it("converts once with page, range, and CTA origin only after a selection", async () => {
    render(<SelectorHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir seletor" }));

    fireEvent.click(await screen.findByRole("button", { name: /R\$ 230 a R\$ 300/ }));

    expect(openPriceRangeWhatsApp).toHaveBeenCalledTimes(1);
    expect(openPriceRangeWhatsApp).toHaveBeenCalledWith(
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "hero",
        cta_label: "hero_whatsapp",
        price_range_key: "mid",
        price_range_label: "R$ 230 a R$ 300",
      }),
      "flores para entrega urgente —",
      "R$ 230 a R$ 300",
    );
  });

  it("keeps product cards direct while generic ad CTAs open the selector", async () => {
    window.history.pushState({}, "", "/urgencia?utm_content=ad-criativo-01");
    render(<App />);

    fireEvent.click(await screen.findByTestId("product-card-buque-classico-rosas"));

    expect(openWhatsAppModal).toHaveBeenCalledTimes(1);
    expect(openWhatsAppModal).toHaveBeenCalledWith(
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "vitrine",
        product_id: "buque-classico-rosas",
      }),
      expect.stringContaining("Buquê Clássico de Rosas Vermelhas - R$ 249,90"),
      "pagina=urgencia",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // O CTA do hero vira <button> só depois da hidratação; antes disso é um
    // link wa.me puro. Espera o estado hidratado para clicar no comportamento real.
    await waitFor(() => {
      expect(screen.getByTestId("ad-lp-cta-hero").tagName).toBe("BUTTON");
    });
    fireEvent.click(screen.getByTestId("ad-lp-cta-hero"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(openWhatsAppModal).toHaveBeenCalledTimes(1);
    expect(openPriceRangeWhatsApp).not.toHaveBeenCalled();
  });
});
