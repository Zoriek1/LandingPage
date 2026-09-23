import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * trackPageView() não empurra mais `lp_page_view` para o dataLayer: não havia
 * tag consumindo o evento no GTM e o GA4 já coleta `page_view` sozinho. O
 * PageView segue indo só para o backend de leads.
 */

describe("trackPageView", () => {
  beforeEach(() => {
    window.dataLayer = [];
    // jsdom não implementa navigator.sendBeacon — fallback do envio de leads.
    Object.defineProperty(navigator, "sendBeacon", {
      writable: true,
      value: () => true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não empurra lp_page_view para o dataLayer", async () => {
    window.__trackingIds = { pageview: "test-pageview-id" };
    const { trackPageView } = await import("@/lib/tracking");

    trackPageView();

    const pageViewEntries = window.dataLayer.filter(
      (entry: Record<string, unknown>) => entry.event === "lp_page_view",
    );
    expect(pageViewEntries).toHaveLength(0);
  });
});
