import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import {
  PRICE_RANGE_CONFIGS,
  buildPriceRangeWhatsAppMessage,
  openPriceRangeSelector,
} from "@/lib/price-ranges";
import { PriceRangeSelector } from "@/components/conversion/PriceRangeSelector";

const { openPriceRangeWhatsApp, openWhatsAppModal } = vi.hoisted(() => ({
  openPriceRangeWhatsApp: vi.fn(),
  openWhatsAppModal: vi.fn(),
}));

vi.mock("@/lib/whatsappModal", () => ({
  openPriceRangeWhatsApp,
  openWhatsAppModal,
}));

const EXPECTED_RANGES = {
  "/": ["Até R$ 200", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/dia-das-maes": ["Até R$ 230", "R$ 230 a R$ 300", "Acima de R$ 300"],
  "/dia-dos-namorados": ["Até R$ 200", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/urgencia": ["Até R$ 230", "R$ 230 a R$ 300", "Acima de R$ 300"],
  "/aniversario": ["Até R$ 250", "R$ 250 a R$ 300", "Acima de R$ 300"],
  "/rosas-apt": ["Até R$ 200", "R$ 200 a R$ 300", "Acima de R$ 300"],
  "/lirios-apt": ["Até R$ 230", "R$ 230 a R$ 400", "Acima de R$ 400"],
  "/carro-low": ["Até R$ 100", "R$ 100 a R$ 150", "Acima de R$ 150"],
  "/carro-high": ["Até R$ 300", "R$ 300 a R$ 500", "Acima de R$ 500"],
  "/presente-hoje": ["Até R$ 160", "R$ 160 a R$ 300", "Acima de R$ 300"],
  "/tradicao-comprovacao": ["Até R$ 250", "R$ 250 a R$ 450", "Acima de R$ 450"],
  "/sem-erro": ["Até R$ 230", "R$ 230 a R$ 350", "Acima de R$ 350"],
  "/qual-b": ["Até R$ 110", "R$ 110 a R$ 250", "Acima de R$ 250"],
} as const;

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
    openPriceRangeWhatsApp.mockClear();
    openWhatsAppModal.mockClear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => cleanup());

  it("keeps exactly the three approved ranges for all 13 published routes", () => {
    expect(Object.keys(PRICE_RANGE_CONFIGS)).toEqual(Object.keys(EXPECTED_RANGES));

    for (const [route, expectedLabels] of Object.entries(EXPECTED_RANGES)) {
      const config = PRICE_RANGE_CONFIGS[route as keyof typeof PRICE_RANGE_CONFIGS];
      expect(config.ranges).toHaveLength(3);
      expect(config.ranges.map((range) => range.label)).toEqual(expectedLabels);
      expect(config.ranges.map((range) => range.key)).toEqual(["low", "mid", "high"]);
    }
  });

  it("builds the exact one-line selected-range message ending in the ten-character token", () => {
    const message = buildPriceRangeWhatsAppMessage(
      "flores para entrega urgente —",
      "Até R$ 230",
      "AB12CD34EF",
    );

    expect(message).toBe(
      "Oi! Quero ver opções de flores para entrega urgente — Até R$ 230. [AB12CD34EF]",
    );
    expect(message).not.toMatch(/[\r\n]/);
    expect(message).toMatch(/\[[A-Z0-9]{10}\]$/);
    expect(message).not.toContain("marcar com");
    expect(message).not.toContain("código de atendimento");
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

    choices[2].focus();
    fireEvent.keyDown(choices[2], { key: "Tab" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(openPriceRangeWhatsApp).not.toHaveBeenCalled();

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

    fireEvent.click(await screen.findByTestId("product-card-buque-6-rosas"));

    expect(openWhatsAppModal).toHaveBeenCalledTimes(1);
    expect(openWhatsAppModal).toHaveBeenCalledWith(
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "vitrine",
        product_id: "buque-6-rosas",
      }),
      expect.stringContaining("Buquê Clássico de Rosas Vermelhas - R$ 249,90"),
      "pagina=urgencia",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("ad-lp-cta-hero"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(openWhatsAppModal).toHaveBeenCalledTimes(1);
    expect(openPriceRangeWhatsApp).not.toHaveBeenCalled();
  });
});
