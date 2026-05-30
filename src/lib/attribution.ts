// Fonte única de atribuição (UTM/campanha) da LP.
//
// Regra: a URL do clique VENCE; sessionStorage é só fallback dentro da mesma aba.
// Antes, cada caminho (lead, token do WhatsApp, link pro site) lia de uma fonte
// diferente — o lead lia só localStorage e perdia a campanha em webview in-app.
//
// Por que sessionStorage e não localStorage:
// - zera over-attribution: visita orgânica futura não herda campanha paga antiga;
// - em webview (Instagram/Facebook) o storage já é por-aba/efêmero de qualquer forma.

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];

function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    // Storage pode lançar em modos restritos de privacidade.
    return null;
  }
}

/**
 * Captura as UTM presentes na URL para sessionStorage (o fallback do clique).
 *
 * Se QUALQUER utm nova chega na URL, limpa as 5 chaves ANTES de gravar — impede
 * misturar `utm_content`/`utm_term` de uma campanha antiga com a campanha nova
 * (o "Frankenstein UTM"). Chamado uma vez no load do módulo de tracking.
 */
export function captureUtmsFromUrl(search: string = window.location.search): void {
  const store = safeSession();
  if (!store) return;

  const params = new URLSearchParams(search);
  const hasNewUtm = UTM_KEYS.some((key) => params.get(key));
  if (!hasNewUtm) return;

  for (const key of UTM_KEYS) {
    store.removeItem(key);
    const val = params.get(key);
    if (val) store.setItem(key, val);
  }
}

/** UTM bag do clique: URL vence, sessionStorage como fallback por-chave. */
export function getUtms(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const store = safeSession();
  const out: Record<string, string> = {};

  for (const key of UTM_KEYS) {
    const val = params.get(key) ?? store?.getItem(key) ?? null;
    if (val) out[key] = val;
  }

  return out;
}

/** Campanha do clique: URL vence, sessionStorage como fallback. */
export function getCampaign(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("utm_campaign") ?? safeSession()?.getItem("utm_campaign") ?? "";
}
