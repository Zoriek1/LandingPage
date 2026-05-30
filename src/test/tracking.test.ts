import { beforeEach, describe, expect, it, vi } from "vitest";

describe("trackWhatsAppClick", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
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

  it("sends Meta Contact without value or currency", async () => {
    const { trackWhatsAppClick } = await import("@/lib/tracking");

    trackWhatsAppClick({ cta_label: "continuar_no_whatsapp" });

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "whatsapp_click",
        cta_label: "continuar_no_whatsapp",
      }),
    );
    expect(window.dataLayer[0]).not.toHaveProperty("value");
    expect(window.dataLayer[0]).not.toHaveProperty("currency");

    expect(window.fbq).toHaveBeenNthCalledWith(
      1,
      "track",
      "Contact",
      {},
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
    expect(payload.meta_event_name).toBe("Contact");
    expect(payload.lead_stage).toBe("whatsapp_click");
    expect(payload.meta_event_id_contact).toBe(payload.event_id);
    expect(payload.capi_event_id).toBe(payload.event_id);
    expect(payload.value).toBeUndefined();
    expect(payload.currency).toBeUndefined();
    expect(payload.destination_url).toBe(
      "https://wa.me/5562996503403?text=Ola%20[Cod%3A%20A3F9]",
    );
    expect(payload.phone).toBeUndefined();
  });

  it("usa a UTM da URL no payload do lead (URL vence o storage)", async () => {
    // Storage tem campanha antiga; a URL do clique traz a campanha correta.
    sessionStorage.setItem("utm_campaign", "campanha_velha");
    window.history.replaceState({}, "", "?utm_campaign=campanha_url&utm_source=ig");

    const { trackWhatsAppClick } = await import("@/lib/tracking");
    trackWhatsAppClick({ cta_label: "falar_no_whatsapp" });

    const fetchMock = vi.mocked(fetch);
    const requestOptions = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestOptions.body)) as Record<string, string>;

    expect(payload.utm_campaign).toBe("campanha_url");
    expect(payload.utm_source).toBe("ig");
  });

  it("does not fire Contact/POST on second click within 4h window", async () => {
    const { trackWhatsAppClick } = await import("@/lib/tracking");
    sessionStorage.setItem("utm_campaign", "natal_2025");

    trackWhatsAppClick({ cta_label: "cta_1" });
    expect(window.fbq).toHaveBeenCalledTimes(1); // Contact
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    // Segundo clique — mesma campanha, dentro da janela
    trackWhatsAppClick({ cta_label: "cta_2" });
    expect(window.fbq).toHaveBeenCalledTimes(1); // sem novos disparos
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1); // sem novo POST
    // DataLayer ainda registra o segundo clique (para GTM/remarketing)
    expect(window.dataLayer).toHaveLength(2);
  });

  it("fires Contact again after the dedup window expires", async () => {
    const { trackWhatsAppClick } = await import("@/lib/tracking");
    sessionStorage.setItem("utm_campaign", "natal_2025");
    // Simula último Contact enviado há 5 horas
    localStorage.setItem("contact_dedup_ts", (Date.now() - 5 * 60 * 60 * 1000).toString());
    localStorage.setItem("contact_dedup_campaign", "natal_2025");

    trackWhatsAppClick({ cta_label: "cta_after_window" });

    expect(window.fbq).toHaveBeenCalledTimes(1); // dispara normalmente
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("fires Contact for a different campaign even within the dedup window", async () => {
    const { trackWhatsAppClick } = await import("@/lib/tracking");

    sessionStorage.setItem("utm_campaign", "natal_2025");
    trackWhatsAppClick({ cta_label: "cta_campanha_a" });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    // Campanha diferente → novo evento
    sessionStorage.setItem("utm_campaign", "pascoa_2026");
    trackWhatsAppClick({ cta_label: "cta_campanha_b" });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    expect(window.fbq).toHaveBeenCalledTimes(2); // +1 Contact
  });
});
