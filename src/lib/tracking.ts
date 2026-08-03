import { captureUtmsFromUrl, getCampaign, getUtms } from "@/lib/attribution";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
    __trackingIds?: { pageview: string };
  }
}

export type TrackingParams = Record<string, string | number | boolean | undefined>;

type TrackingOptions = {
  eventCallback?: () => void;
  eventTimeout?: number;
};

const TRACKING_TIMEOUT_MS = 1200;

// Persiste params de tracking assim que o modulo carrega. Guardado por
// typeof window: este módulo é importado (via PriceRangeSelector ->
// whatsappModal) pela árvore que o build SSR renderiza em Node, onde não há
// window/sessionStorage — sem o guard, o import quebrava o prerender inteiro.
if (typeof window !== "undefined") {
  const _params = new URLSearchParams(window.location.search);

  // fbclid
  const _fbclid = _params.get("fbclid");
  if (_fbclid) {
    sessionStorage.setItem("fbclid", _fbclid);
    sessionStorage.setItem("fbclid_ts", Date.now().toString());
  }

  // gclid
  const _gclid = _params.get("gclid");
  if (_gclid) {
    sessionStorage.setItem("gclid", _gclid);
  }

  // UTMs — captura da URL para sessionStorage (fallback do clique na mesma aba).
  // URL vence na hora de montar o payload; ver src/lib/attribution.ts.
  captureUtmsFromUrl(window.location.search);

  // Camada de sessao — sessionStorage para refletir A SESSAO atual (por aba),
  // nao a primeira visita de sempre. Salva apenas no primeiro hit da sessao.
  if (!sessionStorage.getItem("session_first_landing_url")) {
    sessionStorage.setItem("session_first_landing_url", window.location.href);
    sessionStorage.setItem("session_referrer", document.referrer || "");
    sessionStorage.setItem("session_start_ts", Date.now().toString());
  }
}

function getFbclid(): string | undefined {
  return sessionStorage.getItem("fbclid") ?? undefined;
}

function getGclid(): string | undefined {
  return sessionStorage.getItem("gclid") ?? undefined;
}

function getSessionData(): Record<string, string> {
  const data: Record<string, string> = {};
  const first_landing_url = sessionStorage.getItem("session_first_landing_url");
  const session_referrer = sessionStorage.getItem("session_referrer");
  const session_start_ts = sessionStorage.getItem("session_start_ts");
  if (first_landing_url) data.first_landing_url = first_landing_url;
  if (session_referrer) data.session_referrer = session_referrer;
  if (session_start_ts) data.session_start_ts = session_start_ts;
  return data;
}

function getFbCookies(): { fbp?: string; fbc?: string } {
  const get = (name: string) =>
    document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1];

  return { fbp: get("_fbp"), fbc: get("_fbc") };
}

function buildFbc(): string | undefined {
  const cookie = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/)?.[1];
  if (cookie) return cookie;

  const fbclid = sessionStorage.getItem("fbclid");
  const ts = sessionStorage.getItem("fbclid_ts");
  if (fbclid && ts) {
    return `fb.1.${Math.floor(Number(ts) / 1000)}.${fbclid}`;
  }

  return undefined;
}

function generateEventId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toDataLayerPayload(payload: TrackingParams): Record<string, string | number | boolean> {
  const nextPayload: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    nextPayload[key] = value;
  }

  return nextPayload;
}

function toLeadPayload(payload: TrackingParams): Record<string, string> {
  const nextPayload: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    nextPayload[key] = String(value);
  }

  return nextPayload;
}

function pushDataLayerEvent(event: string, payload: TrackingParams = {}, options: TrackingOptions = {}) {
  const dataLayer = (window.dataLayer = window.dataLayer || []);
  const data = toDataLayerPayload(payload);

  if (!options.eventCallback) {
    dataLayer.push({ event, ...data });
    return;
  }

  const timeout = options.eventTimeout ?? TRACKING_TIMEOUT_MS;
  let completed = false;
  const safeCallback = () => {
    if (completed) return;
    completed = true;
    options.eventCallback?.();
  };

  dataLayer.push({
    event,
    ...data,
    event_callback: safeCallback,
    event_timeout: timeout,
  });

  window.setTimeout(safeCallback, timeout);
}

const LEADS_ENDPOINT = "https://gestaopedidos.planteumaflor.online/api/leads/";

function postLead(payload: Record<string, string | undefined>) {
  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });

  if (navigator.sendBeacon(LEADS_ENDPOINT, blob)) return;

  fetch(LEADS_ENDPOINT, {
    method: "POST",
    keepalive: true,
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body,
  }).catch(() => {});
}

function sendLead(event: string, eventId?: string, extra: TrackingParams = {}) {
  const utms = getUtms();
  const { fbp } = getFbCookies();
  const payload: Record<string, string | undefined> = {
    event,
    event_id: eventId,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    referrer: document.referrer || undefined,
    fbclid: getFbclid(),
    gclid: getGclid(),
    fbp,
    fbc: buildFbc(),
    ...utms,
    ...getSessionData(),
    ...toLeadPayload(extra),
  };

  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  postLead(payload);
}

const DEDUP_TS_KEY = "contact_dedup_ts";
const DEDUP_CAMPAIGN_KEY = "contact_dedup_campaign";
const DEDUP_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 horas

function isContactDuplicated(): boolean {
  const storedTs = localStorage.getItem(DEDUP_TS_KEY);
  const storedCampaign = localStorage.getItem(DEDUP_CAMPAIGN_KEY);
  const currentCampaign = getCampaign();
  if (!storedTs || storedCampaign !== currentCampaign) return false;
  return Date.now() - Number(storedTs) < DEDUP_WINDOW_MS;
}

function markContactSent(): void {
  const currentCampaign = getCampaign();
  localStorage.setItem(DEDUP_TS_KEY, Date.now().toString());
  localStorage.setItem(DEDUP_CAMPAIGN_KEY, currentCampaign);
}

export function trackWhatsAppClick(payload: TrackingParams = {}, options: TrackingOptions = {}) {
  const eventId = generateEventId();
  const capiDedupPayload: TrackingParams = {
    meta_event_id_contact: eventId,
    capi_event_id: eventId,
  };
  const eventPayload: TrackingParams = {
    event_id: eventId,
    meta_event_name: "Contact",
    lead_stage: "whatsapp_click",
    ...payload,
    ...capiDedupPayload,
  };

  pushDataLayerEvent("whatsapp_click", eventPayload, options);

  if (!isContactDuplicated()) {
    window.fbq?.("track", "Contact", {}, { eventID: eventId });
    sendLead("whatsapp_click", eventId, {
      meta_event_name: "Contact",
      meta_event_id_contact: eventId,
      lead_stage: "whatsapp_click",
      ...payload,
      ...capiDedupPayload,
    });
    markContactSent();
  }
}

// site_click = click para catalogo/site externo
export function trackSiteClick(payload: TrackingParams = {}) {
  const eventId = generateEventId();
  const eventPayload: TrackingParams = {
    event_id: eventId,
    ...payload,
  };

  pushDataLayerEvent("site_click", eventPayload);
  window.fbq?.("track", "ViewContent", {}, { eventID: eventId });
  sendLead("site_click", eventId, payload);
}

export function trackPageView() {
  const eventId = window.__trackingIds?.pageview;

  pushDataLayerEvent("lp_page_view", { event_id: eventId });
  sendLead("PageView", eventId);
}
