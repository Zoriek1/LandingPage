import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// O HTML de /loja-fisica/ é a página entregue ao robô do Google Ads: tudo o que
// está aqui precisa aparecer sem JavaScript.
const html = readFileSync(path.join(process.cwd(), "loja-fisica/index.html"), "utf8");
const page = new DOMParser().parseFromString(html, "text/html");
const text = page.body.textContent!.replace(/\s+/g, " ");

const trackStoreAction = vi.fn();
const trackWhatsAppClick = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/tracking", () => ({ trackStoreAction, trackWhatsAppClick }));

describe("conteúdo estático da loja física", () => {
  it("fala de plantas e mudas no title, na description e no H1", () => {
    expect(page.title).toBe("Plantas, mudas e vasos no Setor Sul | Plante Uma Flor");
    const description = page.querySelector('meta[name="description"]')!.getAttribute("content")!;
    expect(description).toMatch(/plantas/);
    expect(description).toMatch(/mudas/);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(page.querySelector("h1")!.textContent).toBe("Plantas, mudas, vasos e adubo para levar na hora.");
  });

  it("traz os termos das buscas no texto", () => {
    for (const term of ["Loja de plantas", "jardinagem", "garden center", "Frutíferas", "muda", "bambu da sorte", "zamioculca", "rosa-do-deserto", "Bonsai", "Ipê amarelo", "jabuticaba"]) {
      expect(text.toLowerCase()).toContain(term.toLowerCase());
    }
  });

  it("não cita o que a loja não vende nem flor de corte", () => {
    for (const term of ["grama", "semente", "pau-brasil", "barbatimão", "tagete", "bulbo", "peônia", "buquê", "flor de corte", "flores de corte"]) {
      expect(text.toLowerCase()).not.toContain(term);
    }
    expect(text).not.toContain("—");
  });

  it("mantém as âncoras antigas e cria as dos anúncios com scroll-margin", () => {
    for (const id of ["visite", "categories-title", "reviews-title"]) expect(page.getElementById(id)).not.toBeNull();
    for (const id of ["mudas", "plantas", "vasos", "terras", "jardim"]) {
      expect(page.getElementById(id)?.classList.contains("anchor-target")).toBe(true);
    }
    expect(page.querySelector('a[href="#mudas"]')).not.toBeNull();
  });

  it("põe Ligar, WhatsApp e Como chegar lado a lado no topo", () => {
    const actions = [...page.querySelectorAll<HTMLAnchorElement>("#hero-actions a")];
    expect(actions.map((a) => a.textContent!.trim())).toEqual(["Ligar", "WhatsApp", "Como chegar"]);
    expect(actions.map((a) => a.getAttribute("href"))).toEqual([
      "tel:+556232819367",
      "https://wa.me/5562996503403",
      "https://www.google.com/maps/dir/?api=1&destination=Rua+132+289+Setor+Sul+Goiania+GO",
    ]);
  });

  it("todo link de WhatsApp é o número da loja, com origem e rótulo próprios", () => {
    const links = [...page.querySelectorAll<HTMLAnchorElement>("[data-whatsapp]")];
    expect(links.map((a) => [a.dataset.location, a.dataset.label])).toEqual([
      ["header", "icone_whatsapp"],
      ["hero", "botao_whatsapp"],
      ["mudas", "botao_whatsapp"],
      ["visit", "link_whatsapp"],
    ]);
    for (const link of links) expect(link.getAttribute("href")).toBe("https://wa.me/5562996503403");
    expect(page.querySelectorAll('a[href*="wa.me"]:not([data-whatsapp])')).toHaveLength(0);
  });

  it("preserva os links de ligação e rota rastreados", () => {
    const phone = [...page.querySelectorAll<HTMLAnchorElement>('[data-store-action="phone"]')];
    expect(phone.map((a) => a.dataset.location)).toEqual(["hero", "mudas", "visit", "backup-phone", "sticky"]);
    const routes = [...page.querySelectorAll<HTMLAnchorElement>('[data-store-action="directions"]')];
    expect(routes.map((a) => `${a.dataset.location}:${a.dataset.provider}`)).toEqual([
      "hero:google_maps", "visit:google_maps", "visit:waze", "sticky:google_maps",
    ]);
  });
});

describe("cliques na página", () => {
  const blockNavigation = (event: Event) => event.preventDefault();
  // O helper real navega para o wa.me no fim; o jsdom só registra "Not implemented".
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeAll(async () => {
    document.body.innerHTML = page.body.innerHTML;
    document.addEventListener("click", blockNavigation);
    await import("../loja-fisica/main");
    await vi.waitFor(() => {
      document.querySelector<HTMLAnchorElement>('#hero-actions [data-store-action="phone"]')!.click();
      expect(trackStoreAction).toHaveBeenCalled();
    });
    trackStoreAction.mockClear();
  });

  afterAll(() => {
    document.removeEventListener("click", blockNavigation);
    consoleError.mockRestore();
  });

  it("cada WhatsApp dispara whatsapp_click com cta_location, cta_label e código de atendimento", async () => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-whatsapp]")];
    for (const [index, link] of links.entries()) {
      link.click();
      await vi.waitFor(() => expect(trackWhatsAppClick).toHaveBeenCalledTimes(index + 1));
      const payload = trackWhatsAppClick.mock.calls[index][0];
      expect(payload).toMatchObject({
        lp_slug: "loja-fisica",
        campaign: "loja-fisica",
        cta_location: link.dataset.location,
        cta_label: link.dataset.label,
        status: "pendente_whatsapp",
      });
      const message = new URL(payload.destination_url).searchParams.get("text");
      expect(payload.destination_url).toMatch(/^https:\/\/wa\.me\/5562996503403\?/);
      expect(message).toContain(`Código de atendimento: ${payload.token_rastreio} · pagina=loja-fisica`);
    }
  });

  it("Ligar da seção de mudas conta como ligação", () => {
    document.querySelector<HTMLAnchorElement>('#mudas [data-store-action="phone"]')!.click();
    expect(trackStoreAction).toHaveBeenCalledWith({ action: "phone", location: "mudas", provider: undefined });
  });
});
