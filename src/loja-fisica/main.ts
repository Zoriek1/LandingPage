import "./style.css";
import { calculateDrivingDistance, getStoreStatus, googleDirections, type Coordinates } from "./store";
import type { StoreAction } from "../lib/tracking";

// Keep navigation and location controls operational if analytics/storage is blocked.
const tracking = import("../lib/tracking").catch(() => undefined);
let track: ((action: StoreAction) => void) | undefined;
let authorizedOrigin: Coordinates | undefined;
void tracking.then((module) => { track = module?.trackStoreAction; });

function refreshHours() {
  const status = getStoreStatus();
  const badge = document.querySelector<HTMLElement>("#store-status");
  if (badge) {
    badge.textContent = status.label;
    badge.dataset.open = String(status.open);
  }
  const sticky = document.querySelector<HTMLElement>("#sticky-status");
  if (sticky) sticky.textContent = status.short;
}
refreshHours();
window.setInterval(refreshHours, 60_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshHours(); });

// Sem JavaScript a barra fica sempre visível; com ele, só depois que os botões do hero saem da tela.
const mobileBar = document.querySelector<HTMLElement>("#mobile-actions");
const heroActions = document.querySelector("#hero-actions");
if (mobileBar && heroActions && "IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    mobileBar.dataset.hidden = String(entry.isIntersecting || entry.boundingClientRect.top > 0);
  }).observe(heroActions);
}

document.querySelectorAll<HTMLAnchorElement>("[data-store-action]").forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    // Keep coordinates out of DOM hrefs: generic outbound-link analytics may read them.
    // Modified clicks retain the native generic URL; Google can obtain origin itself.
    if (authorizedOrigin && anchor.dataset.provider === "google_maps" && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      window.open(googleDirections(authorizedOrigin), "_blank", "noopener,noreferrer");
    }
    try {
      track?.({
        action: anchor.dataset.storeAction === "phone" ? "phone" : "directions",
        location: anchor.dataset.location || "unknown",
        provider: anchor.dataset.provider === "waze" ? "waze" : anchor.dataset.provider === "google_maps" ? "google_maps" : undefined,
      });
    } catch { /* Conversion must remain usable without analytics. */ }
  });
});

const whatsapp = document.querySelector<HTMLAnchorElement>("#whatsapp-link");
whatsapp?.addEventListener("click", async (event) => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  try {
    const { openWhatsAppModal } = await import("../lib/whatsappModal");
    await openWhatsAppModal(whatsapp.href, { lp_slug: "loja-fisica", cta_location: "header", campaign: "loja-fisica" }, "Olá! Quero tirar uma dúvida sobre produtos disponíveis na loja do Setor Sul.");
  } catch { window.location.assign(whatsapp.href); }
});

const locate = document.querySelector<HTMLButtonElement>("#locate-me")!;
const result = document.querySelector<HTMLElement>("#location-result")!;
const attribution = document.querySelector<HTMLElement>("#google-attribution")!;
const distanceEnabled = import.meta.env.VITE_STORE_DISTANCE_ENABLED === "true";
document.querySelector<HTMLElement>("#location-tools")!.hidden = false;
if (distanceEnabled) {
  locate.querySelector("span")!.textContent = "Ver distância de carro até a loja";
  document.querySelector<HTMLElement>("#location-privacy")!.textContent = "Só com sua permissão. Suas coordenadas são enviadas ao nosso servidor e ao Google para calcular a rota, sem serem salvas no navegador, CRM ou analytics.";
}

locate.addEventListener("click", () => {
  if (!navigator.geolocation || !window.isSecureContext) {
    result.textContent = "A localização não está disponível neste navegador. Use Google Maps ou Waze acima para consultar sua rota.";
    return;
  }
  locate.disabled = true;
  attribution.hidden = true;
  result.textContent = "Aguardando sua permissão para acessar a localização…";
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const origin = { latitude: coords.latitude, longitude: coords.longitude };
    authorizedOrigin = origin;
    try {
      if (!distanceEnabled) {
        result.textContent = "Localização encontrada. Abra o Google Maps acima para ver a distância e iniciar sua rota.";
        return;
      }
      result.textContent = "Calculando o trajeto de carro até a loja…";
      const route = await calculateDrivingDistance(origin);
      const km = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(route.distance);
      const minutes = route.duration === undefined ? "" : ` · cerca de ${Math.max(1, Math.round(route.duration))} min`;
      result.textContent = `Você está a aproximadamente ${km} km de carro${minutes}. Abra o Google Maps para iniciar a rota.`;
      attribution.hidden = false;
    } catch {
      result.textContent = "Não foi possível calcular a distância agora. Sua rota está pronta: abra o Google Maps acima para continuar.";
    } finally { locate.disabled = false; }
  }, (error) => {
    locate.disabled = false;
    result.textContent = error.code === 1
      ? "Você não autorizou a localização. Tudo bem: use Google Maps ou Waze acima para definir seu ponto de partida."
      : "Não conseguimos localizar você a tempo. Tente novamente ou abra Google Maps ou Waze acima.";
  }, { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false });
});
