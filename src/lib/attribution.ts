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

// Click IDs do Google Ads. gbraid/wbraid substituem o gclid em tráfego iOS/app,
// e o backend usa qualquer um deles na conversão offline de compra.
export const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;

type ClickIdKey = (typeof CLICK_ID_KEYS)[number];

/**
 * Captura os click IDs presentes na URL para sessionStorage.
 *
 * Mesma regra das UTMs: se QUALQUER click ID novo chega, limpa os 3 antes de
 * gravar — um gclid de campanha antiga nunca acompanha o wbraid do clique novo.
 */
export function captureClickIdsFromUrl(search: string = window.location.search): void {
  const store = safeSession();
  if (!store) return;

  const params = new URLSearchParams(search);
  if (!CLICK_ID_KEYS.some((key) => params.get(key))) return;

  for (const key of CLICK_ID_KEYS) {
    store.removeItem(key);
    const val = params.get(key);
    if (val) store.setItem(key, val);
  }
}

/**
 * Click IDs do clique: se a URL traz algum, ela vence por inteiro (sem misturar
 * com o storage); senão cai no sessionStorage. Chaves vazias são omitidas.
 */
export function getClickIds(): Partial<Record<ClickIdKey, string>> {
  const params = new URLSearchParams(window.location.search);
  const urlHasClickId = CLICK_ID_KEYS.some((key) => params.get(key));
  const store = safeSession();
  const out: Partial<Record<ClickIdKey, string>> = {};

  for (const key of CLICK_ID_KEYS) {
    const val = urlHasClickId ? params.get(key) : store?.getItem(key);
    if (val) out[key] = val;
  }

  return out;
}

// GA4 do contêiner GTM-KCRTLDV4. Serve só para achar o cookie de sessão
// (_ga_<ID sem "G-">) e precisa ser o mesmo GA4_MEASUREMENT_ID configurado no
// Gestor. Não chame gtag() com ele: o GA4 continua 100% via GTM.
export const GA4_MEASUREMENT_ID = "G-RZRVEXS4CP";

type GaIdKey = "ga_client_id" | "ga_session_id" | "ga_session_started_at";

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) return cookie.slice(prefix.length);
  }
  return undefined;
}

/**
 * IDs do GA4 lidos dos cookies do navegador, para o Gestor enviar eventos
 * server-side (Measurement Protocol) na mesma sessão do anúncio.
 *
 * - `ga_client_id`: `_ga` (`GA1.1.<n>.<ts>`) vira `<n>.<ts>`.
 * - `ga_session_id`: início da sessão (epoch em segundos) do cookie
 *   `_ga_RZRVEXS4CP`, formato GS2 (`GS2.1.s<id>$...`) ou GS1 (`GS1.1.<id>.`).
 *   Cookies `_ga_*` de outras propriedades (ex.: o e-commerce) são ignorados.
 * - `ga_session_started_at`: o mesmo início em milissegundos (contrato do tema
 *   Nuvemshop).
 *
 * Sem consentimento de analytics o `_ga` não existe e nada é enviado.
 * Chaves inválidas são omitidas; SSR ou erro devolvem `{}`.
 */
export function getGaIds(): Partial<Record<GaIdKey, string>> {
  if (typeof document === "undefined") return {};

  try {
    const out: Partial<Record<GaIdKey, string>> = {};

    const clientId = readCookie("_ga")?.split(".").slice(-2).join(".");
    if (clientId && /^\d+\.\d+$/.test(clientId)) out.ga_client_id = clientId;

    const sessionCookie = readCookie(`_ga_${GA4_MEASUREMENT_ID.replace(/^G-/, "")}`) ?? "";
    const sessionId =
      sessionCookie.match(/^GS2\.\d+\.s(\d+)/)?.[1] ?? sessionCookie.match(/^GS1\.\d+\.(\d+)\./)?.[1];
    if (sessionId) {
      out.ga_session_id = sessionId;
      out.ga_session_started_at = String(Number(sessionId) * 1000);
    }

    return out;
  } catch {
    return {};
  }
}
