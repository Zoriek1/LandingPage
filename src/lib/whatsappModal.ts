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

function openTrackedWindow(url: string) {
  const popup = window.open("", "_blank", "noopener,noreferrer");

  const navigate = () => {
    if (popup && !popup.closed) {
      popup.location.href = url;
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return { navigate };
}

export function openWhatsAppModal(url: string, context: TrackingParams = {}) {
  if (_show) {
    _show({ url, context });
  } else {
    const { navigate } = openTrackedWindow(url);

    trackWhatsAppClick(
      {
        cta_location: context.cta_location ?? "whatsapp_direct_open",
        cta_label: context.cta_label ?? "abrir_whatsapp",
        destination_url: context.destination_url ?? url,
        ...context,
      },
      {
        eventCallback: navigate,
      },
    );
  }
}
