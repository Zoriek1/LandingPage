import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Garante que trackPageView() dispara lp_page_view exatamente 1× no
 * dataLayer. O entry-client.tsx chama trackPageView() uma única vez logo
 * após hydrateRoot — se houver duplicação (ex.: remount do React), o
 * dataLayer acumularia entradas extras e o GTM contaria pageviews a mais.
 */

describe("trackPageView: lp_page_view single-fire", () => {
  beforeEach(() => {
    window.dataLayer = [];
    // jsdom não implementa navigator.sendBeacon — o tracking usa sendBeacon
    // como caminho primário para enviar leads (fallback para fetch).
    Object.defineProperty(navigator, "sendBeacon", {
      writable: true,
      value: () => true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pushes exactly one lp_page_view event to dataLayer", async () => {
    window.__trackingIds = { pageview: "test-pageview-id" };
    const { trackPageView } = await import("@/lib/tracking");

    trackPageView();

    const pageViewEntries = window.dataLayer.filter(
      (entry: Record<string, unknown>) => entry.event === "lp_page_view",
    );

    expect(pageViewEntries).toHaveLength(1);
    expect(pageViewEntries[0]).toMatchObject({
      event: "lp_page_view",
      event_id: "test-pageview-id",
    });
  });

  it("does not push lp_page_view before trackPageView is called", () => {
    const pageViewEntries = window.dataLayer.filter(
      (entry: Record<string, unknown>) => entry.event === "lp_page_view",
    );

    expect(pageViewEntries).toHaveLength(0);
  });
});