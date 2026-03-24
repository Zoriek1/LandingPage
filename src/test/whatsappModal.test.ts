import { beforeEach, describe, expect, it, vi } from "vitest";

const trackWhatsAppClick = vi.fn();

vi.mock("@/lib/tracking", () => ({
  trackWhatsAppClick,
}));

describe("whatsappModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("appends token at the end of existing WhatsApp text", async () => {
    const { appendTokenToWhatsAppUrl } = await import("@/lib/whatsappModal");

    const url = appendTokenToWhatsAppUrl(
      "https://wa.me/5562996503403?text=Ola%2C%20vim%20pela%20LP",
      "A3F9",
    );

    const parsed = new URL(url);
    expect(parsed.searchParams.get("text")).toBe("Ola, vim pela LP [Cod: A3F9]");
  });

  it("tracks pending lead and redirects in same tab", async () => {
    const { openWhatsAppModal } = await import("@/lib/whatsappModal");

    try {
      openWhatsAppModal("https://wa.me/5562996503403?text=Ola", {
        cta_location: "hero",
        cta_label: "falar_no_whatsapp",
      });
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
    expect(destination.searchParams.get("text")).toContain("[Cod: ");
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
