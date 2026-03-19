declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
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
  const fromUrl = new URLSearchParams(window.location.search).get('fbclid');
  if (fromUrl) return fromUrl;
  const stored = localStorage.getItem('fbclid') || sessionStorage.getItem('fbclid');
  return stored ?? undefined;
}

function sendLead(event: string) {
  const utms = getUtmsFromStorage();
  const fbclid = getFbclid();
  const payload: Record<string, string | undefined> = {
    event,
    url: window.location.href,
    referrer: document.referrer || undefined,
    fbclid,
    ...utms,
  };
  // Remove undefined fields
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

  fetch('https://gestaopedidos.planteumaflor.online/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
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
