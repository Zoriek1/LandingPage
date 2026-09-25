import { afterEach, expect, it, vi } from "vitest";
import { STORE_ADS_SEND_TO, trackStoreAction } from "../lib/tracking";

afterEach(() => {
  vi.unstubAllGlobals();
  STORE_ADS_SEND_TO.phone = "";
  STORE_ADS_SEND_TO.directions = "";
  delete window.gtag;
});

it("emite somente eventos dataLayer, sem coordenadas, CRM ou Meta", () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  window.fbq = vi.fn();
  window.gtag = vi.fn();
  window.dataLayer = [];
  trackStoreAction({ action: "directions", location: "hero", provider: "google_maps" });
  trackStoreAction({ action: "phone", location: "sticky" });
  expect(window.dataLayer).toEqual([
    expect.objectContaining({ event: "store_directions_click", lp_slug: "loja-fisica", cta_location: "hero", map_provider: "google_maps", event_id: expect.any(String) }),
    expect.objectContaining({ event: "store_phone_click", cta_location: "sticky" }),
  ]);
  for (const event of window.dataLayer) {
    expect(event).not.toHaveProperty("latitude");
    expect(event).not.toHaveProperty("longitude");
    expect(event).not.toHaveProperty("url");
    expect(event).not.toHaveProperty("origin");
  }
  expect(request).not.toHaveBeenCalled();
  expect(window.fbq).not.toHaveBeenCalled();
  expect(window.gtag).not.toHaveBeenCalled();
});

it("envia a conversão do Google Ads com o event_id do clique como transaction_id", () => {
  STORE_ADS_SEND_TO.phone = "AW-18285244155/ligacao";
  STORE_ADS_SEND_TO.directions = "AW-18285244155/rota";
  window.gtag = vi.fn();
  window.dataLayer = [];
  trackStoreAction({ action: "phone", location: "hero" });
  trackStoreAction({ action: "directions", location: "sticky", provider: "waze" });
  const [phone, directions] = window.dataLayer;
  expect(window.gtag).toHaveBeenNthCalledWith(1, "event", "conversion", { send_to: "AW-18285244155/ligacao", transaction_id: phone.event_id });
  expect(window.gtag).toHaveBeenNthCalledWith(2, "event", "conversion", { send_to: "AW-18285244155/rota", transaction_id: directions.event_id });
  expect(phone.event_id).not.toBe(directions.event_id);
});

it("mantém o clique utilizável sem a Google tag carregada", () => {
  STORE_ADS_SEND_TO.phone = "AW-18285244155/ligacao";
  window.dataLayer = [];
  expect(() => trackStoreAction({ action: "phone", location: "hero" })).not.toThrow();
  expect(window.dataLayer).toHaveLength(1);
});
