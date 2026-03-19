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

function sendLead(event: string) {
  const utms = getUtmsFromStorage();
  const payload = {
    event,
    url: window.location.href,
    referrer: document.referrer || undefined,
    ...utms,
  };
  navigator.sendBeacon
    ? navigator.sendBeacon(
        'https://gestaopedidos.planteumaflor.online/api/leads',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      )
    : fetch('https://gestaopedidos.planteumaflor.online/api/leads', {
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
