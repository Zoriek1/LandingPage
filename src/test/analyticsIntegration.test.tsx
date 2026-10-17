import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const analytics = vi.hoisted(() => ({
  initAnalytics: vi.fn(),
  navigateAnalytics: vi.fn(),
  recordAnalytics: vi.fn(),
  onAnalyticsPageView: vi.fn((_callback: () => void) => () => {}),
}));

vi.mock("@/analytics", () => analytics);

import { AnalyticsRouteObserver } from "@/App";
import AdLandingPage from "@/features/ad-lps/AdLandingPage";
import {
  asDimension,
  trackSiteClick,
  trackStoreAction,
  trackWhatsAppClick,
} from "@/lib/tracking";

const recorded = () => analytics.recordAnalytics.mock.calls;
const PRIVATE_KEYS = ["destination_url", "token_rastreio", "href", "phone", "message", "fbclid", "gclid", "ga_client_id"];

describe("integração do analytics próprio", () => {
  beforeEach(() => {
    Object.values(analytics).forEach((mock) => mock.mockClear());
    analytics.recordAnalytics.mockReset();
    window.dataLayer = [];
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true })));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("registra whatsapp_click sem dados privados e mesmo com supressão comercial de 4h", async () => {
    const payload = {
      cta_location: "hero",
      cta_label: "hero_whatsapp",
      destination_url: "https://wa.me/5562996503403?text=oi",
      token_rastreio: "abc",
      gclid: "xyz",
      price_range_key: "low",
    };

    await trackWhatsAppClick(payload);
    await trackWhatsAppClick(payload); // 2ª cai na supressão comercial, mas é outra intenção

    expect(recorded()).toHaveLength(2);
    expect(recorded()[0]).toEqual([
      "whatsapp_click",
      { cta_id: "hero_whatsapp", cta_location: "hero", price_range_key: "low" },
    ]);
    for (const key of PRIVATE_KEYS) expect(recorded()[0][1]).not.toHaveProperty(key);
    expect(window.dataLayer?.filter((e) => e.event === "whatsapp_click")).toHaveLength(2);
  });

  it("não deixa o coletor quebrar a conversão nem descarta tokens inseguros", async () => {
    analytics.recordAnalytics.mockImplementation(() => {
      throw new Error("coletor fora");
    });

    await expect(trackWhatsAppClick({ cta_location: "hero", cta_label: "5562996503403" })).resolves.toBeUndefined();
    expect(window.dataLayer?.some((e) => e.event === "whatsapp_click")).toBe(true);
  });

  it("normaliza catalog_click e ignora destination_url", () => {
    trackSiteClick({ cta_location: "footer", cta_label: "link_site", destination_url: "https://www.planteumaflor.com" });

    expect(recorded()).toEqual([
      ["catalog_click", { cta_id: "link_site", cta_location: "footer", destination: "catalog" }],
    ]);
  });

  it("asDimension converte números válidos e descarta tokens inseguros", () => {
    expect(asDimension("hero")).toBe("hero");
    expect(asDimension(42)).toBe("42");
    expect(asDimension(1234567)).toBeUndefined(); // 7 dígitos proibidos
    expect(asDimension("in valid")).toBeUndefined();
    expect(asDimension(null)).toBeUndefined();
  });

  it("mapeia ações da loja para eventos especializados", () => {
    trackStoreAction({ action: "phone", location: "hero" });
    trackStoreAction({ action: "phone", location: "backup-phone" });
    trackStoreAction({ action: "directions", location: "visit", provider: "waze" });

    expect(recorded()).toEqual([
      ["store_phone_click", { cta_id: "phone_hero", cta_location: "hero", phone_role: "store" }],
      ["store_phone_click", { cta_id: "phone_backup-phone", cta_location: "backup-phone", phone_role: "backup" }],
      ["store_directions_click", { cta_id: "directions_visit", cta_location: "visit", map_provider: "waze" }],
    ]);
  });

  it("navigateAnalytics só dispara quando o pathname resolvido muda", () => {
    let go: ReturnType<typeof useNavigate>;
    const Probe = () => {
      go = useNavigate();
      return null;
    };
    render(
      <MemoryRouter initialEntries={["/urgencia"]}>
        <AnalyticsRouteObserver />
        <Probe />
      </MemoryRouter>,
    );
    expect(analytics.navigateAnalytics).not.toHaveBeenCalled();

    act(() => go("/urgencia?utm_source=x"));
    expect(analytics.navigateAnalytics).not.toHaveBeenCalled();

    act(() => go("/girassol"));
    expect(analytics.navigateAnalytics).toHaveBeenCalledTimes(1);
    expect(analytics.navigateAnalytics).toHaveBeenCalledWith("/girassol");
  });

  describe("offer_variant_seen", () => {
    const variantEvents = () => recorded().filter(([type]) => type === "offer_variant_seen");

    it.each([
      ["", { variant_param: "oferta", variant_key: "base", variant_state: "base" }],
      ["?oferta=65", { variant_param: "oferta", variant_key: "65", variant_state: "configured", variant_product_id: "girassol-avulso" }],
      ["?oferta=zzz", { variant_param: "oferta", variant_key: "invalid", variant_state: "invalid_fallback" }],
    ])("emite um único evento para %s depois de resolvido", async (search, expected) => {
      window.history.replaceState({}, "", `/girassol${search}`);
      render(<AdLandingPage slug="girassol" />);
      await screen.findByRole("heading", { level: 1 });

      expect(variantEvents()).toEqual([["offer_variant_seen", expected]]);
    });
  });

  describe("exposição da oferta (consentimento, visibilidade, navegação)", () => {
    const variantEvents = () => recorded().filter(([type]) => type === "offer_variant_seen");
    const setVisibility = (state: "visible" | "hidden") =>
      Object.defineProperty(document, "visibilityState", { configurable: true, value: state });

    afterEach(() => setVisibility("visible"));

    it("não emite com a aba oculta e tenta de novo ao ficar visível", async () => {
      setVisibility("hidden");
      window.history.replaceState({}, "", "/girassol?oferta=65");
      render(<AdLandingPage slug="girassol" />);
      await screen.findByRole("heading", { level: 1 });
      expect(variantEvents()).toHaveLength(0);

      setVisibility("visible");
      act(() => void document.dispatchEvent(new Event("visibilitychange")));
      expect(variantEvents()).toHaveLength(1);
    });

    it("tenta de novo a cada page_view real do coletor (grant, navegação, restore)", async () => {
      let onPageView: () => void = () => {};
      const unsubscribe = vi.fn();
      analytics.onAnalyticsPageView.mockImplementation((cb: () => void) => {
        onPageView = cb;
        return unsubscribe;
      });
      window.history.replaceState({}, "", "/girassol");
      const { unmount } = render(<AdLandingPage slug="girassol" />);
      await screen.findByRole("heading", { level: 1 });
      expect(variantEvents()).toHaveLength(1);

      act(() => onPageView());
      expect(variantEvents()).toHaveLength(2); // dedupe é do coletor

      unmount();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      act(() => void document.dispatchEvent(new Event("visibilitychange")));
      expect(variantEvents()).toHaveLength(2);
    });

    it("reage a back/forward que muda só a query", async () => {
      window.history.replaceState({}, "", "/girassol");
      render(<AdLandingPage slug="girassol" />);
      await screen.findByRole("heading", { level: 1 });
      expect(variantEvents().at(-1)?.[1]).toMatchObject({ variant_state: "base" });

      window.history.replaceState({}, "", "/girassol?oferta=65");
      act(() => void window.dispatchEvent(new PopStateEvent("popstate")));
      expect(variantEvents().at(-1)?.[1]).toMatchObject({ variant_key: "65", variant_state: "configured" });
    });
  });

  it("abre o seletor de faixa como cta_click open_selector, sem whatsapp_click", async () => {
    window.history.replaceState({}, "", "/girassol");
    render(<AdLandingPage slug="girassol" />);
    fireEvent.click(await screen.findByTestId("ad-lp-cta-hero"));

    expect(recorded().filter(([type]) => type === "cta_click")).toEqual([
      ["cta_click", { cta_id: "hero_whatsapp", cta_location: "hero", action: "open_selector" }],
    ]);
    expect(recorded().some(([type]) => type === "whatsapp_click")).toBe(false);
  });
});
