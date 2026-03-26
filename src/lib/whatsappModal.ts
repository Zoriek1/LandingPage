import { trackWhatsAppClick, type TrackingParams } from "@/lib/tracking";

const WHATSAPP_MESSAGES = [
  "Olá! Vi o anúncio de vocês e gostaria de encomendar um buquê.",
  "Olá! Vi o anúncio de vocês e achei o trabalho de vocês lindo. Gostaria de encomendar um buquê.",
  "Olá! Vi o anúncio de vocês e gostei muito dos buquês. Gostaria de encomendar um buquê.",
];

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

export function appendTokenToWhatsAppUrl(url: string, token: string) {
  const phrase = WHATSAPP_MESSAGES[Math.floor(Math.random() * WHATSAPP_MESSAGES.length)];
  const text = `${phrase}\n\n(código de atendimento: ${token})`;

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

export function openWhatsAppModal(url: string, context: TrackingParams = {}) {
  const token = generateTrackingToken();
  const destinationUrl = appendTokenToWhatsAppUrl(url, token);

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
