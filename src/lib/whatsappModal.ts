import { getCampaign } from "@/lib/attribution";
import { buildPriceRangeWhatsAppMessage } from "@/lib/price-ranges";
import { trackWhatsAppClick, type TrackingParams } from "@/lib/tracking";

const STORED_TOKEN_KEY = "wa_tracking_token";
const STORED_TOKEN_CAMPAIGN_KEY = "wa_tracking_token_campaign";
const STORED_TOKEN_CREATED_AT_KEY = "wa_tracking_token_created_at";
const TOKEN_REUSE_WINDOW_MS = 4 * 60 * 60 * 1000;

function getCurrentCampaign(): string {
  // URL do clique vence; sessionStorage como fallback (ver attribution.ts).
  return getCampaign();
}

function getOrCreateToken(): string {
  const stored = localStorage.getItem(STORED_TOKEN_KEY);
  const storedCampaign = localStorage.getItem(STORED_TOKEN_CAMPAIGN_KEY);
  const storedCreatedAt = localStorage.getItem(STORED_TOKEN_CREATED_AT_KEY);
  const currentCampaign = getCurrentCampaign();
  const now = Date.now();
  const tokenAgeMs = storedCreatedAt ? now - Number(storedCreatedAt) : Number.NaN;

  if (
    stored &&
    isTrackingTokenValid(stored) &&
    storedCampaign === currentCampaign &&
    tokenAgeMs >= 0 &&
    tokenAgeMs < TOKEN_REUSE_WINDOW_MS
  ) {
    return stored;
  }

  const token = generateTrackingToken();
  localStorage.setItem(STORED_TOKEN_KEY, token);
  localStorage.setItem(STORED_TOKEN_CAMPAIGN_KEY, currentCampaign);
  localStorage.setItem(STORED_TOKEN_CREATED_AT_KEY, now.toString());
  return token;
}

const TRACKING_TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TOKEN_RANDOM_LENGTH = 4;
const TOKEN_TIME_LENGTH = 4;
const TOKEN_CHECKSUM_LENGTH = 2;

function getRandomTokenChar() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(1);
    crypto.getRandomValues(bytes);
    return TRACKING_TOKEN_CHARS[bytes[0] % TRACKING_TOKEN_CHARS.length];
  }

  const randomIndex = Math.floor(Math.random() * TRACKING_TOKEN_CHARS.length);
  return TRACKING_TOKEN_CHARS[randomIndex];
}

function getTokenCharValue(char: string) {
  return TRACKING_TOKEN_CHARS.indexOf(char);
}

export function calculateTrackingTokenChecksum(baseToken: string) {
  let sumA = 0;
  let sumB = 0;

  for (let i = 0; i < baseToken.length; i += 1) {
    const value = getTokenCharValue(baseToken[i]);
    if (value < 0) continue;
    sumA += value * (i + 1);
    sumB += value * (i + 3);
  }

  const first = TRACKING_TOKEN_CHARS[sumA % TRACKING_TOKEN_CHARS.length];
  const second = TRACKING_TOKEN_CHARS[(sumA + sumB) % TRACKING_TOKEN_CHARS.length];
  return `${first}${second}`;
}

export function isTrackingTokenValid(token: string) {
  const normalized = token.trim().toUpperCase();
  const baseLength = TOKEN_TIME_LENGTH + TOKEN_RANDOM_LENGTH;
  const fullLength = baseLength + TOKEN_CHECKSUM_LENGTH;

  if (!new RegExp(`^[A-Z0-9]{${fullLength}}$`).test(normalized)) {
    return false;
  }

  const baseToken = normalized.slice(0, baseLength);
  const checksum = normalized.slice(baseLength);
  return calculateTrackingTokenChecksum(baseToken) === checksum;
}

export function generateTrackingToken() {
  const timePart = Date.now()
    .toString(36)
    .toUpperCase()
    .slice(-TOKEN_TIME_LENGTH)
    .padStart(TOKEN_TIME_LENGTH, "0");

  let randomPart = "";
  for (let i = 0; i < TOKEN_RANDOM_LENGTH; i += 1) {
    randomPart += getRandomTokenChar();
  }

  const baseToken = `${timePart}${randomPart}`;
  return `${baseToken}${calculateTrackingTokenChecksum(baseToken)}`;
}

/**
 * O código de rastreio vai num bloco próprio, separado por linha em branco e
 * rotulado. Solto no fim da frase o cliente apaga junto com o resto antes de
 * enviar, e a atribuição do lead se perde.
 */
export function appendTrackingBlock(baseText: string, token: string, extraRef?: string) {
  const refSuffix = extraRef ? ` · ${extraRef}` : "";
  return `${baseText.trim()}\n\nCódigo de atendimento: ${token}${refSuffix}`;
}

function withWhatsAppText(url: string, text: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("text", text);
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}text=${encodeURIComponent(text)}`;
  }
}

export function appendTokenToWhatsAppUrl(
  url: string,
  token: string,
  messageText: string,
  extraRef?: string,
) {
  return withWhatsAppText(url, appendTrackingBlock(messageText, token, extraRef));
}

export function openWhatsAppDestination(url: string) {
  window.location.assign(url);
}

export function appendPriceRangeToWhatsAppUrl(
  url: string,
  token: string,
  messageContext: string,
  rangeLabel: string,
  extraRef?: string,
) {
  const baseText = buildPriceRangeWhatsAppMessage(messageContext, rangeLabel);
  return withWhatsAppText(url, appendTrackingBlock(baseText, token, extraRef));
}

export async function openPriceRangeWhatsApp(
  url: string,
  context: TrackingParams,
  messageContext: string,
  rangeLabel: string,
) {
  const token = getOrCreateToken();
  const destinationUrl = appendPriceRangeToWhatsAppUrl(
    url,
    token,
    messageContext,
    rangeLabel,
    context.lp_slug ? `pagina=${context.lp_slug}` : undefined,
  );

  await trackWhatsAppClick({
    cta_location: context.cta_location ?? "whatsapp_range_selection",
    cta_label: context.cta_label ?? "selecionar_faixa",
    ...context,
    destination_url: destinationUrl,
    token_rastreio: token,
    status: "pendente_whatsapp",
  });

  openWhatsAppDestination(destinationUrl);
}

export async function openWhatsAppModal(
  url: string,
  context: TrackingParams,
  messageText: string,
  extraRef?: string,
) {
  const token = getOrCreateToken();
  const destinationUrl = appendTokenToWhatsAppUrl(url, token, messageText, extraRef);

  await trackWhatsAppClick({
    cta_location: context.cta_location ?? "whatsapp_direct_open",
    cta_label: context.cta_label ?? "abrir_whatsapp",
    ...context,
    destination_url: destinationUrl,
    token_rastreio: token,
    status: "pendente_whatsapp",
  });

  openWhatsAppDestination(destinationUrl);
}
