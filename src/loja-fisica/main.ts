import "./style.css";
import { initCountUp } from "./count-up";
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
  // Só reescreve quando muda: #store-status é role=status e o leitor de tela repetiria o anúncio.
  if (badge) {
    if (badge.textContent !== status.label) badge.textContent = status.label;
    badge.dataset.open = String(status.open);
  }
}
refreshHours();
window.setInterval(refreshHours, 60_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshHours(); });

// Sem JavaScript a barra fica sempre visível; com ele, só depois que os botões do hero saem da tela.
// A foto também é observada: com texto ampliado os botões podem começar abaixo da dobra e, sem um
// segundo alvo, voltar ao topo não dispararia o observer (os dois estados ficam "fora da tela").
const mobileBar = document.querySelector<HTMLElement>("#mobile-actions");
const heroActions = document.querySelector("#hero-actions");
if (mobileBar && heroActions && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(() => {
    mobileBar.dataset.hidden = String(heroActions.getBoundingClientRect().bottom > 0);
  });
  observer.observe(heroActions);
  const heroPhoto = document.querySelector(".hero-photo");
  if (heroPhoto) observer.observe(heroPhoto);
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

// Todos os links de WhatsApp (cabeçalho, topo, mudas e visita) usam o mesmo helper;
// data-location e data-label viram cta_location e cta_label do whatsapp_click.
document.querySelectorAll<HTMLAnchorElement>("[data-whatsapp]").forEach((whatsapp) => {
  whatsapp.addEventListener("click", async (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try {
      const { openWhatsAppModal } = await import("../lib/whatsappModal");
      // O código de atendimento vai na mensagem e no lead (com gclid/gbraid/wbraid);
      // é ele que liga uma venda fechada no WhatsApp ao clique do anúncio no Google Ads.
      await openWhatsAppModal(
        whatsapp.href,
        { lp_slug: "loja-fisica", cta_location: whatsapp.dataset.location || "unknown", cta_label: whatsapp.dataset.label || "botao_whatsapp", campaign: "loja-fisica" },
        "Olá! Quero tirar uma dúvida sobre produtos disponíveis na loja do Setor Sul.",
        "pagina=loja-fisica",
      );
    } catch { window.location.assign(whatsapp.href); }
  });
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

// Melhorias progressivas que nunca podem atrapalhar a conversão: o HTML estático já mostra tudo
// (primeira foto de cada categoria, números finais), então qualquer falha aqui só deixa a página como veio.

// Carrosséis das categorias (ilha React). O chunk só é baixado quando a seção chega a ~600 px da tela.
// Sem IntersectionObserver (navegador antigo), carrega quando o navegador está ocioso.
function loadCategoryCarousels() {
  import("./carousels").then((module) => module.initCategoryCarousels()).catch(() => { /* fica a primeira foto estática */ });
}
try {
  const categories = document.querySelector("[data-carousel]")?.closest("section");
  if (categories) {
    const hasObserver = "IntersectionObserver" in window;
    if (hasObserver) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadCategoryCarousels();
      }, { rootMargin: "600px 0px" });
      observer.observe(categories);
    } else if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(loadCategoryCarousels, { timeout: 4000 });
    } else {
      window.setTimeout(loadCategoryCarousels, 2000);
    }
  }
} catch { /* sem carrossel, a foto estática continua */ }

// Números das avaliações: o valor final já está no HTML; o script só conta ao entrar na tela.
try {
  if (document.querySelector("[data-count-up]")) initCountUp();
} catch { /* o número do HTML continua valendo */ }
