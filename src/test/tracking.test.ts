import { beforeEach, describe, expect, it, vi } from "vitest";

describe("trackWhatsAppClick", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    localStorage.clear();
    sessionStorage.clear();
    window.dataLayer = [];
    window.fbq = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true })) as unknown as typeof fetch,
    );

    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("sends a valid default value and currency to Meta Contact", async () => {
    const { trackWhatsAppClick } = await import("@/lib/tracking");

    trackWhatsAppClick({ cta_label: "continuar_no_whatsapp" });

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "whatsapp_click",
        cta_label: "continuar_no_whatsapp",
        value: 1,
        currency: "BRL",
      }),
    );

    expect(window.fbq).toHaveBeenNthCalledWith(
      2,
      "track",
      "Contact",
      { value: 1, currency: "BRL" },
      expect.objectContaining({ eventID: expect.any(String) }),
    );
  });

  it("normalizes provided monetary data before sending Meta Contact", async () => {
    const { trackWhatsAppClick } = await import("@/lib/tracking");

    trackWhatsAppClick({
      price: "1.234,56",
      currency: "brl",
      cta_label: "continuar_no_whatsapp",
    });

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "whatsapp_click",
        cta_label: "continuar_no_whatsapp",
        value: 1234.56,
        currency: "BRL",
      }),
    );

    expect(window.fbq).toHaveBeenNthCalledWith(
      2,
      "track",
      "Contact",
      { value: 1234.56, currency: "BRL" },
      expect.objectContaining({ eventID: expect.any(String) }),
    );
  });

  it("includes token/status and destination URL in lead payload", async () => {
    const { trackWhatsAppClick } = await import("@/lib/tracking");

    trackWhatsAppClick({
      cta_label: "falar_no_whatsapp",
      destination_url: "https://wa.me/5562996503403?text=Ola%20[Cod%3A%20A3F9]",
      token_rastreio: "A3F9",
      status: "pendente_whatsapp",
    });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestOptions = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestOptions.body)) as Record<string, string>;

    expect(payload.token_rastreio).toBe("A3F9");
    expect(payload.status).toBe("pendente_whatsapp");
    expect(payload.destination_url).toBe(
      "https://wa.me/5562996503403?text=Ola%20[Cod%3A%20A3F9]",
    );
    expect(payload.phone).toBeUndefined();
  });
});
