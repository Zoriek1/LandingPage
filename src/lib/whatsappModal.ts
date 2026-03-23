import { trackWhatsAppClick, type TrackingParams } from "@/lib/tracking";

type ShowArgs = {
  url: string;
  context: TrackingParams;
};

type ShowFn = (args: ShowArgs) => void;
let _show: ShowFn | null = null;

export function registerWhatsAppModal(fn: ShowFn) {
  _show = fn;
}

/** Nova aba no mesmo tick do clique; se o browser bloquear, mesma aba. */
export function openWhatsAppDestination(url: string) {
  const w = window.open(url, "_blank");
  if (w) {
    w.opener = null;
    return;
  }
  window.location.assign(url);
}

export function openWhatsAppModal(url: string, context: TrackingParams = {}) {
  if (_show) {
    _show({ url, context });
  } else {
    trackWhatsAppClick({
      cta_location: context.cta_location ?? "whatsapp_direct_open",
      cta_label: context.cta_label ?? "abrir_whatsapp",
      destination_url: context.destination_url ?? url,
      ...context,
    });
    openWhatsAppDestination(url);
  }
}
