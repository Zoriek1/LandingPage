import { beforeEach, describe, expect, it, vi } from "vitest";

const trackWhatsAppClick = vi.fn();

vi.mock("@/lib/tracking", () => ({
  trackWhatsAppClick,
}));

describe("whatsappModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("generates a token with checksum", async () => {
    const { generateTrackingToken, isTrackingTokenValid } = await import("@/lib/whatsappModal");

    const token = generateTrackingToken();
    expect(token).toMatch(/^[A-Z0-9]{10}$/);
    expect(isTrackingTokenValid(token)).toBe(true);
  });

  it("detects invalid checksum", async () => {
    const { isTrackingTokenValid } = await import("@/lib/whatsappModal");
    expect(isTrackingTokenValid("ABCD1234ZZ")).toBe(false);
  });

  it("replaces any pre-existing WhatsApp text with the message plus tracking block", async () => {
    const { appendTokenToWhatsAppUrl } = await import("@/lib/whatsappModal");

    const url = appendTokenToWhatsAppUrl(
      "https://wa.me/5562996503403?text=Ola%2C%20vim%20pela%20LP",
      "A3F9",
      "Oi! Quero o Buquê 6 Rosas.",
    );

    const parsed = new URL(url);
    const text = parsed.searchParams.get("text") ?? "";
    expect(text).toBe("Oi! Quero o Buquê 6 Rosas.\n\nCódigo de atendimento: A3F9");
    expect(text).not.toContain("vim pela LP");
    // O checklist de faixas foi removido: ele carregava uma terceira escada de
    // preços (149,90/299,90) que contradizia a tabela do seletor.
    expect(text).not.toContain("[ ] Até R$ 149,90");
  });

  it("carries the page reference alongside the code in the same block", async () => {
    const { appendTokenToWhatsAppUrl } = await import("@/lib/whatsappModal");

    const url = appendTokenToWhatsAppUrl(
      "https://wa.me/5562996503403",
      "A3F9",
      "Oi! Quero o Buquê 6 Rosas.",
      "pagina=urgencia",
    );

    const parsed = new URL(url);
    const text = parsed.searchParams.get("text") ?? "";
    expect(text).toBe(
      "Oi! Quero o Buquê 6 Rosas.\n\nCódigo de atendimento: A3F9 · pagina=urgencia",
    );
  });

  it("tracks pending lead and redirects in same tab", async () => {
    const { openWhatsAppModal } = await import("@/lib/whatsappModal");

    try {
      openWhatsAppModal(
        "https://wa.me/5562996503403?text=Ola",
        { cta_location: "hero", cta_label: "falar_no_whatsapp" },
        "Oi! Quero o Buquê 6 Rosas.",
      );
    } catch {
      // JSDOM may throw on navigation; payload assertion still validates flow.
    }

    expect(trackWhatsAppClick).toHaveBeenCalledTimes(1);

    const payload = trackWhatsAppClick.mock.calls[0]?.[0] as Record<string, string>;
    expect(payload.cta_location).toBe("hero");
    expect(payload.cta_label).toBe("falar_no_whatsapp");
    expect(payload.status).toBe("pendente_whatsapp");
    expect(payload.token_rastreio).toMatch(/^[A-Z0-9]{10}$/);

    const destination = new URL(payload.destination_url);
    expect(destination.searchParams.get("text")).toContain("\n\nCódigo de atendimento: ");
  });

  it("waits for the pending lead request before finishing the WhatsApp redirect", async () => {
    let confirmLead: (() => void) | undefined;
    trackWhatsAppClick.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        confirmLead = resolve;
      }),
    );

    const { openWhatsAppModal } = await import("@/lib/whatsappModal");
    const redirect = openWhatsAppModal(
      "https://wa.me/5562996503403",
      { cta_location: "hero", cta_label: "falar_no_whatsapp" },
      "Oi! Quero um buquê.",
    );

    expect(redirect).toBeInstanceOf(Promise);

    let finished = false;
    Promise.resolve(redirect).then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);

    confirmLead?.();
    await redirect;
    expect(finished).toBe(true);
  });

  it("tracks one attributed range selection with the code in its own block", async () => {
    const { openPriceRangeWhatsApp } = await import("@/lib/whatsappModal");

    try {
      openPriceRangeWhatsApp(
        "https://wa.me/5562996503403",
        {
          lp_slug: "urgencia",
          cta_location: "hero",
          cta_label: "hero_whatsapp",
          price_range_key: "mid",
          price_range_label: "R$ 230 a R$ 300",
        },
        "flores para entrega urgente —",
        "R$ 230 a R$ 300",
      );
    } catch {
      // JSDOM may throw on navigation; payload assertion still validates flow.
    }

    expect(trackWhatsAppClick).toHaveBeenCalledTimes(1);
    const payload = trackWhatsAppClick.mock.calls[0]?.[0] as Record<string, string>;
    expect(payload).toEqual(
      expect.objectContaining({
        lp_slug: "urgencia",
        cta_location: "hero",
        price_range_key: "mid",
        price_range_label: "R$ 230 a R$ 300",
        status: "pendente_whatsapp",
      }),
    );

    const message = new URL(payload.destination_url).searchParams.get("text") ?? "";
    expect(message).toMatch(
      /^Oi! Quero ver opções de flores para entrega urgente — R\$ 230 a R\$ 300\.\n\nCódigo de atendimento: [A-Z0-9]{10} · pagina=urgencia$/,
    );
  });

  it("reuses the same token when the campaign has not changed", async () => {
    const { openWhatsAppModal } = await import("@/lib/whatsappModal");

    sessionStorage.setItem("utm_campaign", "natal_2025");

    try { openWhatsAppModal("https://wa.me/5562996503403?text=Ola", {}, "Oi! Quero um buquê."); } catch { /* noop */ }
    const firstToken = (trackWhatsAppClick.mock.calls[0]?.[0] as Record<string, string>).token_rastreio;

    vi.clearAllMocks();

    try { openWhatsAppModal("https://wa.me/5562996503403?text=Ola", {}, "Oi! Quero um buquê."); } catch { /* noop */ }
    const secondToken = (trackWhatsAppClick.mock.calls[0]?.[0] as Record<string, string>).token_rastreio;

    expect(firstToken).toBe(secondToken);
  });

  it("generates a new token when the campaign changes", async () => {
    const { openWhatsAppModal } = await import("@/lib/whatsappModal");

    sessionStorage.setItem("utm_campaign", "natal_2025");
    try { openWhatsAppModal("https://wa.me/5562996503403?text=Ola", {}, "Oi! Quero um buquê."); } catch { /* noop */ }
    const firstToken = (trackWhatsAppClick.mock.calls[0]?.[0] as Record<string, string>).token_rastreio;

    vi.clearAllMocks();

    sessionStorage.setItem("utm_campaign", "pascoa_2026");
    try { openWhatsAppModal("https://wa.me/5562996503403?text=Ola", {}, "Oi! Quero um buquê."); } catch { /* noop */ }
    const secondToken = (trackWhatsAppClick.mock.calls[0]?.[0] as Record<string, string>).token_rastreio;

    expect(firstToken).not.toBe(secondToken);
  });

  it("does not open WhatsApp in a popup window", async () => {
    const openSpy = vi.spyOn(window, "open");
    const { openWhatsAppDestination } = await import("@/lib/whatsappModal");

    try {
      openWhatsAppDestination("https://wa.me/5562996503403?text=Ola");
    } catch {
      // JSDOM may throw on navigation.
    }

    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
