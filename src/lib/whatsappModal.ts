type ShowFn = (url: string) => void;
let _show: ShowFn | null = null;

export function registerWhatsAppModal(fn: ShowFn) {
  _show = fn;
}

export function openWhatsAppModal(url: string) {
  if (_show) {
    _show(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
