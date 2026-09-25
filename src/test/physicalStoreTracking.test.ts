import { afterEach, expect, it, vi } from "vitest";
import { trackStoreAction } from "../lib/tracking";

afterEach(() => vi.unstubAllGlobals());

it("emite somente eventos dataLayer, sem coordenadas, CRM ou Meta", () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  window.fbq = vi.fn();
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
});
