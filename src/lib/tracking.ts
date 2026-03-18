declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackWhatsAppClick() {
  window.fbq?.('track', 'Contact');
  window.gtag?.('event', 'conversion', { send_to: 'AW-11455088769' });
  window.gtag?.('event', 'whatsapp_click');
}

export function trackSiteClick() {
  window.fbq?.('track', 'ViewContent');
  window.gtag?.('event', 'site_click');
}
