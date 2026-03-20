declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    __trackingIds?: { pageview: string };
  }
}

// Persiste fbclid e phone assim que o módulo carrega
const _params = new URLSearchParams(window.location.search);
const _fbclid = _params.get('fbclid');
if (_fbclid) {
  sessionStorage.setItem('fbclid', _fbclid);
  sessionStorage.setItem('fbclid_ts', Date.now().toString());
}

export function setLeadPhone(phone: string) {
  sessionStorage.setItem('lead_phone', phone);
}

function getUtmsFromStorage(): Record<string, string> {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck'];
  const utms: Record<string, string> = {};
  for (const key of keys) {
    const val = localStorage.getItem(key);
    if (val) utms[key] = val;
  }
  return utms;
}

function getFbclid(): string | undefined {
  return sessionStorage.getItem('fbclid') ?? undefined;
}

function getFbCookies(): { fbp?: string; fbc?: string } {
  const get = (name: string) =>
    document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))?.[1];
  return { fbp: get('_fbp'), fbc: get('_fbc') };
}

function buildFbc(): string | undefined {
  const cookie = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/)?.[1];
  if (cookie) return cookie;
  const fbclid = sessionStorage.getItem('fbclid');
  const ts = sessionStorage.getItem('fbclid_ts');
  if (fbclid && ts) {
    return `fb.1.${Math.floor(Number(ts) / 1000)}.${fbclid}`;
  }
  return undefined;
}

function generateEventId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getPhone(): string | undefined {
  return sessionStorage.getItem('lead_phone') ?? undefined;
}

const LEADS_ENDPOINT = 'https://gestaopedidos.planteumaflor.online/api/leads/';

function postLead(payload: Record<string, string | undefined>) {
  const body = JSON.stringify(payload);
  fetch(LEADS_ENDPOINT, {
    method: 'POST',
    keepalive: true,
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
  }).catch(() => {
    navigator.sendBeacon(LEADS_ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
  });
}

function sendLead(event: string, eventId?: string) {
  const utms = getUtmsFromStorage();
  const { fbp } = getFbCookies();
  const payload: Record<string, string | undefined> = {
    event,
    event_id: eventId,
    url: window.location.href,
    referrer: document.referrer || undefined,
    fbclid: getFbclid(),
    fbp,
    fbc: buildFbc(),
    phone: getPhone(),
    ...utms,
  };
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
  postLead(payload);
}

export function trackWhatsAppClick() {
  const eventId = generateEventId();
  window.gtag?.('event', 'conversion', { send_to: 'AW-11455088769' });
  window.gtag?.('event', 'whatsapp_click');
  window.fbq?.('track', 'Lead', {}, { eventID: eventId });
  sendLead('whatsapp_click', eventId);
}

export function trackSiteClick() {
  const eventId = generateEventId();
  window.fbq?.('track', 'ViewContent', {}, { eventID: eventId });
  window.gtag?.('event', 'site_click');
  sendLead('site_click', eventId);
}

export function trackPageView() {
  const eventId = window.__trackingIds?.pageview;
  sendLead('PageView', eventId);
}
