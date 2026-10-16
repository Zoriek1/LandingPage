import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// O HTML de /loja-fisica/ é a página entregue ao robô do Google Ads: tudo o que
// está aqui precisa aparecer sem JavaScript.
const html = readFileSync(path.join(process.cwd(), "loja-fisica/index.html"), "utf8");
const css = readFileSync(path.join(process.cwd(), "src/loja-fisica/style.css"), "utf8");
const page = new DOMParser().parseFromString(html, "text/html");
const normalize = (value: string | null) => (value ?? "").replace(/\s+/g, " ").trim();
const text = normalize(page.body.textContent);
// O que a loja não vende só pode aparecer dentro de "Aqui você não encontra".
const textOutsideLack = (() => {
  const copy = page.body.cloneNode(true) as HTMLElement;
  copy.querySelector("#nao-encontra")?.remove();
  return normalize(copy.textContent);
})();

const trackStoreAction = vi.fn();
const trackWhatsAppClick = vi.fn().mockResolvedValue(undefined);
const initCategoryCarousels = vi.fn();
vi.mock("@/lib/tracking", () => ({ trackStoreAction, trackWhatsAppClick }));
// A ilha React não carrega no jsdom: aqui só se confere quando o main.ts a chama.
vi.mock("../loja-fisica/carousels", () => ({ initCategoryCarousels }));

// IntersectionObserver que registra quem observa o quê, para disparar a interseção à mão.
type ObserverRecord = { callback: IntersectionObserverCallback; options?: IntersectionObserverInit; targets: Element[]; disconnected: boolean };
const observers: ObserverRecord[] = [];
class RecordingObserver {
  readonly record: ObserverRecord;
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.record = { callback, options, targets: [], disconnected: false };
    observers.push(this.record);
  }
  observe = (target: Element) => { this.record.targets.push(target); };
  unobserve = () => {};
  disconnect = () => { this.record.disconnected = true; };
  takeRecords = () => [];
}

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
    for (const term of ["Loja de plantas", "jardinagem", "garden center", "plantas ornamentais", "mudas", "ficus", "monstera", "samambaia", "bambu da sorte", "zamioculca", "rosa-do-deserto", "vasos", "adubo", "terra"]) {
      expect(text.toLowerCase()).toContain(term.toLowerCase());
    }
  });

  it("não cita o que a loja não vende nem flor de corte", () => {
    for (const term of ["pau-brasil", "barbatimão", "tagete", "bulbo", "peônia", "buquê", "flor de corte", "flores de corte"]) {
      expect(text.toLowerCase()).not.toContain(term);
    }
    expect(text).not.toContain("—");
  });

  it("grama e semente só aparecem em \"Aqui você não encontra\"", () => {
    const lack = page.getElementById("nao-encontra")!;
    expect(lack.querySelector("h3")!.textContent).toBe("Aqui você não encontra");
    const lackText = normalize(lack.textContent).toLowerCase();
    for (const term of ["grama", "plantas do cerrado", "sementes", "ração para gado"]) expect(lackText).toContain(term);
    for (const term of ["grama", "semente"]) expect(textOutsideLack.toLowerCase()).not.toContain(term);
  });

  it("não fala mais de frutíferas, árvores nem estoque sob consulta", () => {
    for (const term of ["frutífera", "jabuticaba", "ipê", "palmeira", "pomar", "sob consulta", "cajuzinho", "pequi"]) {
      expect(text.toLowerCase()).not.toContain(term);
    }
  });

  it("lista as plantas ornamentais em \"Aqui você encontra\"", () => {
    const have = page.getElementById("plantas")!;
    expect(have.querySelector("h3")!.textContent).toBe("Aqui você encontra");
    const items = [...have.querySelectorAll("li")].map((li) => normalize(li.textContent));
    for (const plant of ["Ficus", "Monstera", "Samambaia", "Begônia dragão", "Impatiens", "Jiboia", "Zamioculca", "Orquídea", "Rosa-do-deserto", "Bambu da sorte"]) {
      expect(items).toContain(plant);
    }
    expect(new Set(items).size).toBe(items.length);
    // "encontra" e "não encontra" são blocos separados: nada de grama na lista de plantas.
    expect(have.contains(page.getElementById("nao-encontra"))).toBe(false);
    expect(page.getElementById("mudas")!.contains(have)).toBe(true);
    expect(page.getElementById("mudas")!.contains(page.getElementById("nao-encontra"))).toBe(true);
  });

  it("mantém as âncoras dos anúncios com scroll-margin e tira as dos grupos de plantas", () => {
    for (const id of ["visite", "categories-title", "reviews-title"]) expect(page.getElementById(id)).not.toBeNull();
    for (const id of ["mudas", "plantas", "vasos", "terras", "jardim"]) {
      expect(page.getElementById(id)?.classList.contains("anchor-target")).toBe(true);
    }
    for (const id of ["frutiferas", "arvores", "palmeiras", "floriferas", "suculentas", "horta"]) {
      expect(page.getElementById(id)).toBeNull();
    }
    expect(page.querySelector('a[href="#mudas"]')).not.toBeNull();
    expect(page.querySelector(".plant-index, .plant-group")).toBeNull();
    // Links internos ("Ver a lista") só rolam a página: nunca contam como conversão.
    for (const a of page.querySelectorAll<HTMLAnchorElement>('main a[href^="#"]')) {
      expect(page.getElementById(a.getAttribute("href")!.slice(1))).not.toBeNull();
      expect(a.matches("[data-store-action],[data-whatsapp]")).toBe(false);
    }
  });

  it("mostra o logo da marca no cabeçalho, com o nome para leitor de tela", () => {
    const brand = page.querySelector(".site-header .brand")!;
    expect(brand.querySelector(".brand-logo")?.getAttribute("aria-hidden")).toBe("true");
    expect(brand.querySelector(".sr-only")?.textContent).toContain("Plante Uma Flor");
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
      ["sticky", "botao_whatsapp"],
    ]);
    for (const link of links) expect(link.getAttribute("href")).toBe("https://wa.me/5562996503403");
    expect(page.querySelectorAll('a[href*="wa.me"]:not([data-whatsapp])')).toHaveLength(0);
  });

  it("põe Ligar, WhatsApp e Como chegar na barra fixa do celular", () => {
    const bar = [...page.querySelectorAll<HTMLAnchorElement>("#mobile-actions a")];
    expect(bar.map((a) => a.querySelector(".bar-label")!.firstChild!.textContent)).toEqual(["Ligar", "WhatsApp", "Como chegar"]);
    expect(bar.map((a) => a.dataset.location)).toEqual(["sticky", "sticky", "sticky"]);
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

describe("carrosséis das categorias (HTML estático)", () => {
  const carousels = [...page.querySelectorAll<HTMLElement>("[data-carousel]")];
  const assetsOf = (carousel: Element) => [
    ...[...carousel.querySelectorAll("img")].map((img) => img.getAttribute("src")!),
    ...[...carousel.querySelectorAll("source,img")].flatMap((node) => (node.getAttribute("srcset") ?? "").split(",").map((candidate) => candidate.trim().split(/\s+/)[0]).filter(Boolean)),
  ];

  it("há um carrossel por categoria com foto, cada um com nome próprio", () => {
    expect(carousels).toHaveLength(4);
    const labels = carousels.map((carousel) => carousel.dataset.carouselLabel);
    expect(labels.every(Boolean)).toBe(true);
    expect(new Set(labels).size).toBe(4);
    for (const [index, id] of [[0, "vasos"], [2, "terras"]] as const) expect(page.getElementById(id)!.contains(carousels[index])).toBe(true);
    for (const carousel of carousels) expect(carousel.closest("li.category-entry")).not.toBeNull();
  });

  it("cada carrossel traz 3 ou mais fotos com alt, legenda, dimensões e arquivos que existem", () => {
    for (const carousel of carousels) {
      const slides = [...carousel.querySelectorAll<HTMLElement>("li.category-carousel-slide")];
      const pictures = carousel.querySelectorAll("picture");
      expect(pictures.length).toBeGreaterThanOrEqual(3);
      expect(pictures).toHaveLength(slides.length);
      const alts = [...carousel.querySelectorAll("img")].map((img) => normalize(img.getAttribute("alt")));
      expect(alts.every((alt) => alt.length > 0)).toBe(true);
      expect(new Set(alts).size).toBe(alts.length);
      for (const slide of slides) {
        expect(normalize(slide.dataset.caption).length).toBeGreaterThan(0);
        const img = slide.querySelector("img")!;
        expect(Number(img.getAttribute("width")) / Number(img.getAttribute("height"))).toBeCloseTo(4 / 5, 5);
        expect(img.getAttribute("loading")).toBe("lazy");
        expect([...slide.querySelectorAll("source")].map((source) => source.getAttribute("type"))).toEqual(["image/avif", "image/webp"]);
      }
      const assets = assetsOf(carousel);
      expect(assets.length).toBeGreaterThan(0);
      for (const asset of assets) {
        expect(asset).toMatch(/^\/src\/assets\/generated\/loja-cat-[a-z]+-\d+-(480|960)\.(avif|webp)$/);
        expect(existsSync(path.join(process.cwd(), asset)), asset).toBe(true);
      }
    }
  });

  it("sem JS o CSS mostra só a primeira foto, na mesma caixa, e já reserva a altura dos controles", () => {
    for (const carousel of carousels) {
      const first = carousel.querySelector("li.category-carousel-slide")!;
      expect(first.hasAttribute("hidden")).toBe(false);
      expect(first.closest("[aria-hidden='true']")).toBeNull();
      expect(carousel.hasAttribute("data-carousel-ready")).toBe(false);
    }
    expect(css).toMatch(/\.category-carousel-slide\s*\{\s*display:\s*none;?\s*\}/);
    expect(css).toMatch(/\.category-carousel-slide:first-child\s*\{[^}]*display:\s*block/);
    expect(css).toMatch(/\.category-carousel:not\(\[data-carousel-ready\]\)::after\s*\{[^}]*height:\s*6rem/);
  });

  it("o CSS do carrossel respeita movimento reduzido, cores forçadas e texto ampliado", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*\.category-carousel-btn/);
    expect(css).toMatch(/forced-colors: active\)[\s\S]*\.category-carousel-dot::before/);
    expect(css).toMatch(/max-width: 19\.5em\)[\s\S]*\.stock-list/);
  });

  it("não traz botão, link nem atributo de conversão dentro dos carrosséis", () => {
    for (const carousel of carousels) {
      expect(carousel.querySelectorAll("a, button, [data-whatsapp], [data-store-action]")).toHaveLength(0);
    }
  });
});

// Proporção de cada foto de faixa: a mesma tabela do scripts/optimize-images.mjs (STORE_STRIP_RATIOS).
const STRIP_RATIOS: Record<string, number> = {
  "ornamentais-1": 3 / 2, "ornamentais-2": 4 / 5, "ornamentais-3": 4 / 5,
  "vasos-1": 4 / 5, "vasos-2": 4 / 5, "vasos-3": 4 / 5, "vasos-4": 4 / 5, "vasos-5": 4 / 5,
  "historia-1": 4 / 3, "historia-2": 4 / 5, "historia-3": 4 / 5,
  "avaliacoes-1": 4 / 3,
};
const PHOTO_CLASS_RATIOS: Record<string, number> = { "photo-3x2": 3 / 2, "photo-4x3": 4 / 3, "photo-4x5": 4 / 5 };
const photoName = (img: Element) => /loja-faixa-([a-z]+-\d+)-1200\.webp$/.exec(img.getAttribute("src") ?? "")?.[1] ?? "";
const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const srcsetFiles = (root: Element) => [...root.querySelectorAll("source")].flatMap((source) => (source.getAttribute("srcset") ?? "").split(",").map((candidate) => candidate.trim().split(/\s+/)[0]).filter(Boolean));

describe("faixas entre as plantas e as avaliações (HTML estático)", () => {
  const ids = { ornamentais: "faixa-ornamentais", vasos: "faixa-vasos", historia: "nossa-historia" } as const;
  const sections = Object.values(ids).map((id) => page.getElementById(id)!);
  const expectedPhotos = { ornamentais: 3, vasos: 5, historia: 3 } as const;
  const stripsText = normalize(sections.map((section) => section.textContent).join(" ")).toLowerCase();

  it("vêm na ordem: categorias, plantas, ornamentais, vasos, história, avaliações e visita", () => {
    const chain = [
      page.getElementById("categories-title")!.closest("section")!,
      page.getElementById("mudas")!,
      ...sections,
      page.getElementById("reviews-title")!.closest("section")!,
      page.getElementById("visite")!,
    ];
    for (let index = 0; index < chain.length - 1; index++) {
      expect(follows(chain[index], chain[index + 1]), `${chain[index].id || chain[index].className} antes de ${chain[index + 1].id || chain[index + 1].className}`).toBe(true);
      // Sem nenhuma outra seção no meio.
      expect(chain[index].nextElementSibling).toBe(chain[index + 1]);
    }
  });

  it("cada faixa é uma seção com âncora própria e título H2 ligado por aria-labelledby", () => {
    for (const [name, id] of Object.entries(ids)) {
      const section = page.getElementById(id)!;
      expect(section, name).not.toBeNull();
      expect(section.tagName).toBe("SECTION");
      expect(section.classList.contains("anchor-target")).toBe(true);
      expect(section.classList.contains("section")).toBe(true);
      const heading = page.getElementById(section.getAttribute("aria-labelledby")!)!;
      expect(heading.tagName).toBe("H2");
      expect(section.contains(heading)).toBe(true);
      expect(heading.classList.contains("font-display")).toBe(true);
      expect(normalize(heading.textContent).length).toBeGreaterThan(0);
    }
    // Os ids antigos das categorias não foram reaproveitados pelas faixas.
    expect(page.querySelectorAll("#vasos")).toHaveLength(1);
    expect(page.getElementById("vasos")!.classList.contains("category-entry")).toBe(true);
  });

  it("o texto das faixas só usa o que a página já afirma: sem preço, entrega, travessão nem número novo", () => {
    expect(stripsText).not.toContain("—");
    expect(stripsText).not.toMatch(/r\$|preço|entrega|frete|pagamento|parcel|desconto|garantia|promoção|últimas unidades|estoque limitado/);
    // Só 40 (anos no Setor Sul) e 132 (Rua 132) aparecem como número.
    expect(new Set(stripsText.match(/\d+/g) ?? [])).toEqual(new Set(["40", "132"]));
    const history = normalize(page.getElementById(ids.historia)!.textContent).toLowerCase();
    for (const fact of ["mais de 40 anos", "setor sul", "garden & flora", "balcão", "estacionar na porta"]) expect(history).toContain(fact);
    const vasos = normalize(page.getElementById(ids.vasos)!.textContent).toLowerCase();
    for (const material of ["barro", "cerâmica", "polietileno"]) expect(vasos).toContain(material);
  });

  it("cada faixa traz as fotos previstas, em avif e webp, com alt descritivo, dimensões e arquivos que existem", () => {
    for (const [name, count] of Object.entries(expectedPhotos)) {
      const section = page.getElementById(ids[name as keyof typeof ids])!;
      const pictures = [...section.querySelectorAll("picture")];
      expect(pictures, name).toHaveLength(count);
      const alts = pictures.map((picture) => normalize(picture.querySelector("img")!.getAttribute("alt")));
      expect(alts.every((alt) => alt.length >= 20), `${name}: alt curto demais`).toBe(true);
      expect(new Set(alts).size).toBe(alts.length);
      for (const picture of pictures) {
        const img = picture.querySelector("img")!;
        const photo = photoName(img);
        expect(photo.startsWith(`${name}-`), `${name}: ${img.getAttribute("src")}`).toBe(true);
        expect([...picture.querySelectorAll("source")].map((source) => source.getAttribute("type"))).toEqual(["image/avif", "image/webp"]);
        for (const source of picture.querySelectorAll("source")) {
          expect(source.getAttribute("srcset")).toMatch(/-640\.(avif|webp) 640w, \S+-1200\.(avif|webp) 1200w$/);
          expect(normalize(source.getAttribute("sizes")).length).toBeGreaterThan(0);
        }
        expect(Number(img.getAttribute("width")) / Number(img.getAttribute("height"))).toBeCloseTo(STRIP_RATIOS[photo], 5);
        expect(img.getAttribute("loading")).toBe("lazy");
        expect(img.getAttribute("decoding")).toBe("async");
      }
      const files = [...section.querySelectorAll("img")].map((img) => img.getAttribute("src")!).concat(srcsetFiles(section));
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        expect(file).toMatch(/^\/src\/assets\/generated\/loja-faixa-[a-z]+-\d+-(640|1200)\.(avif|webp)$/);
        expect(existsSync(path.join(process.cwd(), file)), file).toBe(true);
      }
    }
  });

  it("a classe de proporção de cada foto bate com a proporção das dimensões do HTML e existe no CSS", () => {
    for (const figure of page.querySelectorAll("#faixa-ornamentais .photo, #faixa-vasos .photo, #nossa-historia .photo, .reviews .photo")) {
      const classes = [...figure.classList].filter((name) => name in PHOTO_CLASS_RATIOS);
      expect(classes, figure.outerHTML.slice(0, 60)).toHaveLength(1);
      const img = figure.querySelector("img")!;
      expect(Number(img.getAttribute("width")) / Number(img.getAttribute("height"))).toBeCloseTo(PHOTO_CLASS_RATIOS[classes[0]], 5);
    }
    for (const [name, ratio] of Object.entries({ "photo-3x2": "3 / 2", "photo-4x3": "4 / 3", "photo-4x5": "4 / 5" })) {
      expect(css).toContain(`.${name} { aspect-ratio: ${ratio}; }`);
    }
  });

  it("Ornamentais é um mosaico de uma foto horizontal e duas verticais", () => {
    const mosaic = page.querySelector("#faixa-ornamentais .mosaic")!;
    const figures = [...mosaic.children];
    expect(figures.map((figure) => [...figure.classList].filter((name) => name in PHOTO_CLASS_RATIOS)[0])).toEqual(["photo-3x2", "photo-4x5", "photo-4x5"]);
    expect(figures[0].classList.contains("mosaic-lead")).toBe(true);
    expect(css).toMatch(/\.mosaic\s*\{[^}]*grid/);
  });

  it("a fila de Vasos rola de lado só com CSS, é focável por teclado e cada foto tem legenda de material", () => {
    const section = page.getElementById(ids.vasos)!;
    const scroller = section.querySelector<HTMLElement>(".strip-scroller")!;
    expect(scroller.getAttribute("role")).toBe("region");
    expect(scroller.getAttribute("tabindex")).toBe("0");
    expect(normalize(scroller.getAttribute("aria-label")).length).toBeGreaterThan(0);
    const items = [...scroller.querySelectorAll("li.strip-item")];
    expect(items).toHaveLength(5);
    expect(scroller.querySelector("ul")!.getAttribute("role")).toBe("list");
    for (const item of items) {
      expect(normalize(item.querySelector("figcaption")!.textContent)).toMatch(/^(Barro|Cerâmica|Polietileno)\b/);
      expect(item.querySelectorAll("picture")).toHaveLength(1);
    }
    // Sem script, sem setas e sem carrossel da ilha: a rolagem é do navegador.
    expect(section.querySelectorAll("script, button, [data-carousel]")).toHaveLength(0);
    expect(css).toMatch(/\.strip-scroller\s*\{[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*x mandatory/);
    expect(css).toMatch(/\.strip-item\s*\{[^}]*scroll-snap-align:\s*start/);
    expect(css).toMatch(/\.strip-scroller:focus-visible\s*\{[^}]*outline-offset/);
    // A região rolável é a única que passa da largura da tela: o resto da página não ganha barra horizontal.
    expect(css).toMatch(/\.strip-scroller\s*\{[^}]*overscroll-behavior-x:\s*contain/);
  });

  it("Nossa História segue a ordem título, foto, texto e duas fotos verticais, sem chamada para ação", () => {
    const history = page.querySelector("#nossa-historia .history")!;
    expect([...history.children].map((child) => child.className.split(" ").find((name) => name.startsWith("history-")))).toEqual(["history-title", "history-lead", "history-copy", "history-pair"]);
    expect(history.querySelectorAll(".history-pair picture")).toHaveLength(2);
    expect(history.querySelectorAll(".history-copy p").length).toBeGreaterThanOrEqual(2);
  });

  it("o CSS das faixas respeita movimento reduzido, cores forçadas e texto ampliado", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.strip-scroller\s*\{\s*scroll-behavior:\s*auto/);
    expect(css).toMatch(/forced-colors: active\)[\s\S]*\.strip-scroller:focus-visible/);
    expect(css).toMatch(/max-width: 19\.5em\)[\s\S]*\.mosaic[\s\S]*\.history-pair[\s\S]*\.review-figures/);
  });

  it("nenhuma faixa nem a seção de avaliações ganha link, botão ou atributo de conversão", () => {
    const reviews = page.getElementById("reviews-title")!.closest("section")!;
    for (const section of [...sections, reviews]) {
      expect(section.querySelectorAll("a, button, form, input, [data-whatsapp], [data-store-action], [data-location]"), section.id || "reviews").toHaveLength(0);
    }
  });
});

describe("avaliações com foto da loja e números que sobem (HTML estático)", () => {
  const reviews = page.getElementById("reviews-title")!.closest("section")!;
  const figures = [...reviews.querySelectorAll(".review-figure")];

  it("os números finais já estão no HTML, só com texto, para o count-up e para o robô", () => {
    const counters = [...page.querySelectorAll("[data-count-up]")];
    expect(counters.map((counter) => counter.textContent)).toEqual(["4,8", "200+", "40+"]);
    for (const counter of counters) {
      expect(reviews.contains(counter)).toBe(true);
      expect(counter.childElementCount).toBe(0);
      expect(counter.parentElement!.tagName).toBe("DD");
      expect(counter.hasAttribute("aria-hidden")).toBe(false);
    }
  });

  it("cada número tem o rótulo real e o rótulo vem antes do valor na leitura", () => {
    expect(figures).toHaveLength(3);
    expect(figures.map((figure) => normalize(figure.querySelector("dt")!.textContent))).toEqual(["nota no Google", "avaliações no Google", "anos no Setor Sul"]);
    for (const figure of figures) {
      expect(figure.firstElementChild!.tagName).toBe("DT");
      expect(figure.lastElementChild!.tagName).toBe("DD");
      expect(figure.parentElement!.tagName).toBe("DL");
    }
  });

  it("repete só o que o topo da página já afirma: 4,8 no Google, mais de 200 avaliações e mais de 40 anos", () => {
    const proof = normalize(page.querySelector(".hero-proof")!.textContent);
    expect(proof).toContain("4,8 no Google · mais de 200 avaliações");
    expect(proof).toContain("mais de 40 anos no Setor Sul");
    const [score, count, years] = figures.map((figure) => figure.querySelector("[data-count-up]")!.textContent!);
    expect(score).toBe("4,8");
    expect(count).toBe("200+");
    expect(years).toBe("40+");
  });

  it("mantém as três citações de clientes", () => {
    const quotes = [...reviews.querySelectorAll("figure.review")];
    expect(quotes.map((quote) => normalize(quote.querySelector("figcaption")!.textContent))).toEqual([
      "Thatiany G. · avaliação no Google",
      "Márcia S. · avaliação no Google",
      "Calmon X. · avaliação no Google",
    ]);
    expect(quotes.every((quote) => normalize(quote.querySelector("blockquote")!.textContent).length > 40)).toBe(true);
  });

  it("a foto da loja tem alt descritivo, dimensões e arquivos que existem, e fica antes das citações", () => {
    const photo = reviews.querySelector(".reviews-photo")!;
    const img = photo.querySelector("img")!;
    expect(photoName(img)).toBe("avaliacoes-1");
    expect(normalize(img.getAttribute("alt")).length).toBeGreaterThanOrEqual(20);
    expect(Number(img.getAttribute("width")) / Number(img.getAttribute("height"))).toBeCloseTo(STRIP_RATIOS["avaliacoes-1"], 5);
    expect(img.getAttribute("loading")).toBe("lazy");
    for (const file of [img.getAttribute("src")!, ...srcsetFiles(photo)]) {
      expect(file).toMatch(/^\/src\/assets\/generated\/loja-faixa-avaliacoes-1-(640|1200)\.(avif|webp)$/);
      expect(existsSync(path.join(process.cwd(), file)), file).toBe(true);
    }
    const head = reviews.querySelector(".reviews-head")!;
    const body = reviews.querySelector(".reviews-body")!;
    expect(follows(head, photo)).toBe(true);
    expect(follows(photo, body)).toBe(true);
  });

  it("o CSS usa algarismos tabulares nos números e mantém .reviews como a faixa tonal da página", () => {
    expect(css).toMatch(/\[data-count-up\]\s*\{[^}]*tabular-nums/);
    expect(css).toMatch(/\.reviews\s*\{\s*background:\s*hsl\(var\(--color-surface-sunken\)\)/);
    expect(page.querySelectorAll("section.reviews")).toHaveLength(1);
    expect(css.match(/background:\s*hsl\(var\(--color-surface-sunken\)\)/g)).toHaveLength(1);
  });
});

describe("cliques na página", () => {
  const blockNavigation = (event: Event) => event.preventDefault();
  // O helper real navega para o wa.me no fim; o jsdom só registra "Not implemented".
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  const originalObserver = window.IntersectionObserver;
  const setObserver = (value: typeof IntersectionObserver) => { window.IntersectionObserver = value; globalThis.IntersectionObserver = value; };

  beforeAll(async () => {
    document.body.innerHTML = page.body.innerHTML;
    document.addEventListener("click", blockNavigation);
    setObserver(RecordingObserver as unknown as typeof IntersectionObserver);
    await import("../loja-fisica/main");
    await vi.waitFor(() => {
      document.querySelector<HTMLAnchorElement>('#hero-actions [data-store-action="phone"]')!.click();
      expect(trackStoreAction).toHaveBeenCalled();
    });
    trackStoreAction.mockClear();
  });

  afterAll(() => {
    setObserver(originalObserver);
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

  it("carrega os carrosséis só quando a seção das categorias chega a 600 px da tela", async () => {
    const section = document.querySelector("#categories-title")!.closest("section")!;
    const record = observers.find((item) => item.targets.includes(section))!;
    expect(record).toBeDefined();
    expect(record.options?.rootMargin).toBe("600px 0px");
    expect(initCategoryCarousels).not.toHaveBeenCalled();

    const entry = (isIntersecting: boolean) => [{ isIntersecting, target: section }] as unknown as IntersectionObserverEntry[];
    record.callback(entry(false), {} as IntersectionObserver);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(initCategoryCarousels).not.toHaveBeenCalled();

    record.callback(entry(true), {} as IntersectionObserver);
    await vi.waitFor(() => expect(initCategoryCarousels).toHaveBeenCalledTimes(1));
    expect(record.disconnected).toBe(true);
  });

  it("os controles do carrossel não ganham tratamento de conversão do main.ts", () => {
    const converting = document.querySelectorAll("[data-whatsapp], [data-store-action]");
    for (const element of converting) expect(element.closest("[data-carousel]")).toBeNull();
  });
});
