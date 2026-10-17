import { beforeEach, describe, expect, it, vi } from "vitest";

// IDs do GA4 (cookies _ga e _ga_RZRVEXS4CP) no whatsapp_click: o Gestor usa
// esses campos para o whatsapp_message_sent server-side (Measurement Protocol)
// entrar na mesma sessão do anúncio no GA4. Só o whatsapp_click os leva.

const GA_KEYS = ["ga_client_id", "ga_session_id", "ga_session_started_at"];

async function loadTracking(path: string) {
  window.history.replaceState({}, "", path);
  return import("@/lib/tracking");
}

function postedPayload(fetchMock: ReturnType<typeof vi.fn>, call = 0): Record<string, string> {
  const requestOptions = fetchMock.mock.calls[call]?.[1] as RequestInit;
  return JSON.parse(String(requestOptions.body)) as Record<string, string>;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`;
}

function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

describe("IDs do GA4 no whatsapp_click", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    clearCookies();
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

  it("lê client_id e session_id do cookie GS2", async () => {
    setCookie("_ga", "GA1.1.1234567890.1727280000");
    setCookie("_ga_RZRVEXS4CP", "GS2.1.s1727280000$o3$g1$t1727280100$j0$l0$h0");
    const { getGaIds } = await import("@/lib/attribution");

    expect(getGaIds()).toEqual({
      ga_client_id: "1234567890.1727280000",
      ga_session_id: "1727280000",
      ga_session_started_at: "1727280000000",
    });
  });

  it("lê client_id e session_id do cookie GS1", async () => {
    setCookie("_ga", "GA1.2.987654321.1727000000");
    setCookie("_ga_RZRVEXS4CP", "GS1.1.1727280000.3.1.1727280100.0.0.0");
    const { getGaIds } = await import("@/lib/attribution");

    expect(getGaIds()).toEqual({
      ga_client_id: "987654321.1727000000",
      ga_session_id: "1727280000",
      ga_session_started_at: "1727280000000",
    });
  });

  it("sem cookies não envia nenhuma chave ga_*", async () => {
    const { trackWhatsAppClick } = await loadTracking("/");

    await trackWhatsAppClick({ cta_location: "hero", cta_label: "falar_no_whatsapp" });

    const payload = postedPayload(fetchMock);
    expect(payload.event).toBe("whatsapp_click");
    for (const key of GA_KEYS) expect(payload).not.toHaveProperty(key);
  });

  it("ignora _ga malformado", async () => {
    setCookie("_ga", "GA1.1.abc.def");
    setCookie("_ga_RZRVEXS4CP", "GS2.1.s1727280000$o3$g1$t1727280100$j0$l0$h0");
    const { getGaIds } = await import("@/lib/attribution");

    const ids = getGaIds();
    expect(ids).not.toHaveProperty("ga_client_id");
    expect(ids.ga_session_id).toBe("1727280000");
  });

  it("ignora cookie de sessão de outra propriedade GA4", async () => {
    setCookie("_ga", "GA1.1.1234567890.1727280000");
    setCookie("_ga_OUTRAPROP1", "GS2.1.s1727999999$o1$g0$t1727999999$j0$l0$h0");
    const { getGaIds } = await import("@/lib/attribution");

    expect(getGaIds()).toEqual({ ga_client_id: "1234567890.1727280000" });
  });

  it("whatsapp_click leva os IDs, PageView e site_click não", async () => {
    setCookie("_ga", "GA1.1.1234567890.1727280000");
    setCookie("_ga_RZRVEXS4CP", "GS2.1.s1727280000$o3$g1$t1727280100$j0$l0$h0");
    const { trackPageView, trackSiteClick, trackWhatsAppClick } = await loadTracking("/?gclid=G-1");

    trackPageView();
    trackSiteClick({ cta_location: "hero", cta_label: "ver_catalogo" });
    await trackWhatsAppClick({ cta_location: "hero", cta_label: "falar_no_whatsapp" });

    const [pageView, siteClick, whatsappClick] = [0, 1, 2].map((i) => postedPayload(fetchMock, i));
    expect(pageView.event).toBe("PageView");
    expect(siteClick.event).toBe("site_click");
    for (const key of GA_KEYS) {
      expect(pageView).not.toHaveProperty(key);
      expect(siteClick).not.toHaveProperty(key);
    }
    expect(whatsappClick).toMatchObject({
      event: "whatsapp_click",
      gclid: "G-1",
      ga_client_id: "1234567890.1727280000",
      ga_session_id: "1727280000",
      ga_session_started_at: "1727280000000",
    });
    for (const entry of window.dataLayer ?? []) {
      for (const key of GA_KEYS) expect(entry).not.toHaveProperty(key);
    }
  });
});
