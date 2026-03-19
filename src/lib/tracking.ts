declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// Persiste fbclid e phone assim que o módulo carrega
const _params = new URLSearchParams(window.location.search);
const _fbclid = _params.get('fbclid');
if (_fbclid) sessionStorage.setItem('fbclid', _fbclid);

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

function sendLead(event: string) {
  const utms = getUtmsFromStorage();
  const payload: Record<string, string | undefined> = {
    event,
    url: window.location.href,
    referrer: document.referrer || undefined,
    fbclid: getFbclid(),
    phone: getPhone(),
    ...utms,
  };
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
  postLead(payload);
}

export function trackWhatsAppClick() {
  window.gtag?.('event', 'conversion', { send_to: 'AW-11455088769' });
  window.gtag?.('event', 'whatsapp_click');
  sendLead('whatsapp_click');
}

export function trackSiteClick() {
  window.fbq?.('track', 'ViewContent');
  window.gtag?.('event', 'site_click');
  sendLead('site_click');
}
