import { trackWhatsAppClick, type TrackingParams } from "@/lib/tracking";

/** LP de anúncios de buquê; mensagem pré-formatada para qualificar faixa de valor. */
const WHATSAPP_BOUQUET_CHECKLIST = `Me conta por onde você quer começar, marca com X numa das opções:

[ ] Até R$ 149,90: um mimo bonito que cabe no bolso
[ ] Até R$ 299,90: aquele buquê médio, bem à altura da ocasião
[ ] Acima de R$ 299,90: pra caprichar de verdade e impressionar

_É só marcar com *X* na que mais combina com você._

Se puder, manda também a data da entrega e o bairro aqui em Goiânia.`;

const WHATSAPP_INTROS = [
  "Olá! Vi o anúncio de vocês e quero encomendar um buquê.",
  "Olá! Vi o anúncio de vocês e quero pedir um buquê.",
  "Olá! Vi o anúncio de vocês e quero fechar um buquê.",
];

const STORED_TOKEN_KEY = "wa_tracking_token";
const STORED_TOKEN_CAMPAIGN_KEY = "wa_tracking_token_campaign";

function getCurrentCampaign(): string {
  return localStorage.getItem("utm_campaign") ?? "";
}

function getOrCreateToken(): string {
  const stored = localStorage.getItem(STORED_TOKEN_KEY);
  const storedCampaign = localStorage.getItem(STORED_TOKEN_CAMPAIGN_KEY);
  const currentCampaign = getCurrentCampaign();

  if (stored && isTrackingTokenValid(stored) && storedCampaign === currentCampaign) {
    return stored;
  }

  const token = generateTrackingToken();
  localStorage.setItem(STORED_TOKEN_KEY, token);
  localStorage.setItem(STORED_TOKEN_CAMPAIGN_KEY, currentCampaign);
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

export function appendTokenToWhatsAppUrl(
  url: string,
  token: string,
  messageText?: string,
  extraRef?: string,
) {
  const phrase = WHATSAPP_INTROS[Math.floor(Math.random() * WHATSAPP_INTROS.length)];
  const baseText = messageText?.trim() || `${phrase}\n\n${WHATSAPP_BOUQUET_CHECKLIST}`;
  const refSuffix = extraRef ? ` · ${extraRef}` : "";
  const text = `${baseText}\n\n(código de atendimento: ${token}${refSuffix})`;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("text", text);
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}text=${encodeURIComponent(text)}`;
  }
}

export function openWhatsAppDestination(url: string) {
  window.location.assign(url);
}

export function openWhatsAppModal(
  url: string,
  context: TrackingParams = {},
  messageText?: string,
  extraRef?: string,
) {
  const token = getOrCreateToken();
  const destinationUrl = appendTokenToWhatsAppUrl(url, token, messageText, extraRef);

  trackWhatsAppClick({
    cta_location: context.cta_location ?? "whatsapp_direct_open",
    cta_label: context.cta_label ?? "abrir_whatsapp",
    ...context,
    destination_url: destinationUrl,
    token_rastreio: token,
    status: "pendente_whatsapp",
  });

  openWhatsAppDestination(destinationUrl);
}
