import { beforeEach, describe, expect, it, vi } from "vitest";

// Captura de gclid/gbraid/wbraid: a URL do clique vence, sessionStorage é o
// fallback na mesma aba e os IDs chegam ao POST do lead (base da conversão
// offline de compra no Google Ads).

async function loadTracking(path: string) {
  window.history.replaceState({}, "", path);
  return import("@/lib/tracking");
}

function postedPayload(fetchMock: ReturnType<typeof vi.fn>): Record<string, string> {
  const requestOptions = fetchMock.mock.calls[0]?.[1] as RequestInit;
  return JSON.parse(String(requestOptions.body)) as Record<string, string>;
}

describe("click IDs do Google Ads", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    window.dataLayer = [];

    fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it.each(["gclid", "gbraid", "wbraid"])("captura %s da URL no storage", async (key) => {
    await loadTracking(`/?${key}=ID-${key}`);

    expect(sessionStorage.getItem(key)).toBe(`ID-${key}`);
  });

  it("usa o storage como fallback quando a URL não traz click ID", async () => {
    await loadTracking("/?wbraid=WB-1");
    window.history.replaceState({}, "", "/obrigado");
    const { getClickIds } = await import("@/lib/attribution");

    expect(getClickIds()).toEqual({ wbraid: "WB-1" });
  });

  it("nova visita paga substitui os IDs antigos", async () => {
    sessionStorage.setItem("gclid", "GCLID-ANTIGO");
    await loadTracking("/?gbraid=GB-NOVO");
    const { getClickIds } = await import("@/lib/attribution");

    expect(sessionStorage.getItem("gclid")).toBeNull();
    expect(getClickIds()).toEqual({ gbraid: "GB-NOVO" });
  });

  it("não envia string vazia", async () => {
    const { trackPageView } = await loadTracking("/?gclid=&gbraid=");

    trackPageView();

    const payload = postedPayload(fetchMock);
    expect(payload).not.toHaveProperty("gclid");
    expect(payload).not.toHaveProperty("gbraid");
    expect(payload).not.toHaveProperty("wbraid");
  });

  it("WhatsApp da loja física leva gclid e código de atendimento ao lead", async () => {
    await loadTracking("/loja-fisica/?gclid=G-LOJA");
    const { openWhatsAppModal } = await import("@/lib/whatsappModal");

    try {
      await openWhatsAppModal(
        "https://wa.me/5562996503403",
        { lp_slug: "loja-fisica", cta_location: "header", cta_label: "icone_whatsapp" },
        "Olá! Quero tirar uma dúvida.",
        "pagina=loja-fisica",
      );
    } catch {
      // JSDOM may throw on navigation.
    }

    const payload = postedPayload(fetchMock);
    expect(payload).toMatchObject({ event: "whatsapp_click", gclid: "G-LOJA", lp_slug: "loja-fisica", cta_label: "icone_whatsapp" });
    expect(new URL(payload.destination_url).searchParams.get("text")).toContain(
      `Código de atendimento: ${payload.token_rastreio} · pagina=loja-fisica`,
    );
  });

  it("inclui os IDs no POST do lead", async () => {
    const { trackPageView } = await loadTracking("/?gclid=G-1&gbraid=GB-1&wbraid=WB-1");

    trackPageView();

    expect(postedPayload(fetchMock)).toMatchObject({
      gclid: "G-1",
      gbraid: "GB-1",
      wbraid: "WB-1",
    });
  });
});
