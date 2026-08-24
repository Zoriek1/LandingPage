import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import App from "@/App";
import { PRICE_RANGE_CONFIGS } from "@/lib/price-ranges";
import { AD_LP_SLUGS } from "@/routes/routeManifest";

const currentModuleUrl = import.meta.url;
const root = fileURLToPath(new URL("../../", currentModuleUrl));
const readProjectFile = (path: string) => readFileSync(`${root}${path}`, "utf8");

afterEach(() => cleanup());

describe("ad landing delivery", () => {
  it("keeps the complete 13-route conversion manifest", () => {
    expect(["/", ...AD_LP_SLUGS.map((slug) => `/${slug}`)]).toEqual(
      Object.keys(PRICE_RANGE_CONFIGS),
    );
  });

  it("keeps home providers and ad pages behind route-level lazy imports", () => {
    const appSource = readProjectFile("src/App.tsx");

    expect(appSource).toContain('lazy(() => import("@/routes/HomeRoute"))');
    expect(appSource).toContain('lazy(() => import("@/features/ad-lps/AdLandingPage"))');
    expect(appSource).not.toContain("@/features/ad-lps/data/configs");
    expect(appSource).not.toContain("QueryClientProvider");
  });

  it("keeps Framer Motion out of the ad landing implementation", () => {
    const adLandingSource = readProjectFile("src/features/ad-lps/AdLandingPage.tsx");

    expect(adLandingSource).not.toContain("framer-motion");
    expect(adLandingSource).not.toContain("<motion.");
  });

  it("limits ad landing transitions to transform and opacity", () => {
    const themeCss = readProjectFile("src/features/ad-lps/theme.css");
    const selectorSource = readProjectFile("src/components/conversion/PriceRangeSelector.tsx");

    expect(themeCss).not.toMatch(
      /transition(?:-property)?:[^;]*(?:background|border-color|box-shadow|color|gap)/,
    );
    expect(selectorSource).not.toMatch(/(?:^|\s)transition(?:-colors)?(?=\s|")/);
    expect(selectorSource).toContain("transition-transform");
  });

  it("prioritizes a responsive modern-format hero and defers product imagery", async () => {
    window.history.pushState({}, "", "/lirios-apt");
    render(<App />);

    const hero = await screen.findByTestId("ad-lp-hero-image");
    const picture = hero.closest("picture");
    const sources = picture?.querySelectorAll("source");

    expect(picture).not.toBeNull();
    expect(sources).toHaveLength(2);
    expect(sources?.[0]).toHaveAttribute("type", "image/avif");
    expect(sources?.[0].getAttribute("srcset")).toMatch(/480w.*900w/);
    expect(sources?.[1]).toHaveAttribute("type", "image/webp");
    expect(hero).toHaveAttribute("fetchpriority", "high");
    expect(hero).toHaveAttribute("width");
    expect(hero).toHaveAttribute("height");
    expect(hero).not.toHaveAttribute("loading", "lazy");

    const product = await screen.findByAltText("Arranjo de Mão Lírios P");
    expect(product).toHaveAttribute("loading", "lazy");
    expect(product).toHaveAttribute("width", "1024");
    expect(product).toHaveAttribute("height", "1024");
    expect(product.getAttribute("srcset")).toMatch(/480w.*640w.*1024w/);
    expect(product).toHaveAttribute("sizes");

    const originalSrc = product.getAttribute("src");
    fireEvent.error(product);
    expect(product).not.toHaveAttribute("srcset");
    expect(product).toHaveAttribute("src", originalSrc);
    expect(product).not.toHaveAttribute("src", "/lpb/placeholders/product.svg");

    fireEvent.error(product);
    expect(product).toHaveAttribute("src", "/lpb/placeholders/product.svg");
  });

  it("offers keyboard users a skip link to the stable main target", async () => {
    window.history.pushState({}, "", "/lirios-apt");
    const { container } = render(<App />);

    const skipLink = await screen.findByRole("link", { name: "Pular para o conteúdo principal" });
    const main = screen.getByRole("main");
    // A /lirios-apt usa nav minimal (só logo + CTA), então o marco estável do
    // cabeçalho é o logo, não a lista de âncoras.
    const brandLink = screen.getByRole("link", { name: "Plante Uma Flor" });

    expect(skipLink).toHaveAttribute("href", "#ad-lp-main");
    expect(main).toHaveAttribute("id", "ad-lp-main");
    expect(
      skipLink.compareDocumentPosition(brandLink) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector("#hero")).toHaveClass("ad-lp-hero");
  });

  it("ships non-blocking critical fonts and Apache cache policy", () => {
    const fontCss = readProjectFile("src/features/ad-lps/fonts.css");
    const html = readProjectFile("index.html");
    const htaccess = readProjectFile("public/.htaccess");

    // D3/T6: a fonte Playfair não tem mais preload no <head> raiz — ele competia
    // com a imagem LCP no throttling. As fontes continuam disponíveis via
    // critical.css (T5) inline com `font-display: swap`, sem competir com o
    // LCP. O único preload do index.html raiz é o que o Vite injeta por LP.
    expect(fontCss).toMatch(/font-display:\s*swap/g);
    expect(html).not.toMatch(/rel="preload"[^>]+as="font"/);
    expect(htaccess).toMatch(/Cache-Control "public, max-age=31536000, immutable"/);
    expect(htaccess).toMatch(/Cache-Control "no-cache"/);
    expect(htaccess).toMatch(/image\/avif/);
    expect(htaccess).toMatch(/image\/webp/);
  });

  it("keeps the ad landing stylesheet able to paint without the global one", () => {
    const themeCss = readProjectFile("src/features/ad-lps/theme.css");

    // O index.css sai do caminho crítico nas LPs, então esta folha precisa
    // trazer o próprio reset e a tipografia. Sem isso a primeira pintura usa a
    // margem e a fonte padrão do navegador e o corpo inteiro desloca quando o
    // Tailwind chega — 0,021 de CLS quando isso regrediu.
    expect(themeCss).toMatch(/@tailwind base;/);
    expect(themeCss).toMatch(/--font-body:\s*"Montserrat"/);
    expect(themeCss).toMatch(/--font-display:\s*"Playfair Display"/);
  });

  it("serves ad landing routes from their own static HTML", () => {
    const htaccess = readProjectFile("public/.htaccess");
    const viteConfig = readProjectFile("vite.config.ts");

    // /lirios-apt e /lirios-apt/ -> lirios-apt.html, antes do fallback do SPA e
    // sem sequestrar as páginas que têm diretório próprio. A condição usa
    // DOCUMENT_ROOT porque com barra final o REQUEST_FILENAME nunca casaria.
    expect(htaccess).toMatch(/RewriteCond %\{DOCUMENT_ROOT\}\/\$1\.html -f/);
    expect(htaccess).toMatch(/RewriteRule \^\(\[\^\/\]\+\)\/\?\$ \/\$1\.html \[L\]/);
    expect(htaccess).toMatch(/RewriteCond %\{REQUEST_FILENAME\} !-d/);
    expect(htaccess.indexOf("$1.html")).toBeLessThan(htaccess.indexOf("RewriteRule . /index.html"));
    expect(viteConfig).toContain('rel="preload" as="image"');
    expect(viteConfig).toContain('type="image/avif"');
  });

  it("asks the browser for card images no wider than the card", async () => {
    window.history.pushState({}, "", "/rosas-apt");
    render(<App />);

    const product = await screen.findByAltText("Buquê Clássico de Rosas Vermelhas");
    // A vitrine mobile é uma grade de 2 colunas com gutter de 4vw e gap de 1rem.
    // Com `50vw` o navegador pedia a variante de 480 para um slot de ~180 CSS px.
    expect(product.getAttribute("sizes")).toMatch(/\(max-width: 719px\) calc\(46vw - 8px\)/);
    expect(product.getAttribute("sizes")).not.toMatch(/50vw/);
  });

  it("describes the twelve-column grid in the sizes of the /lirios-apt cards", async () => {
    window.history.pushState({}, "", "/lirios-apt");
    render(<App />);

    // Uma coluna até 639px, duas até 999px, depois span 3 (~24vw, 290px no
    // container travado). O card largo — destaque e par — ocupa span 6.
    const normal = await screen.findByAltText("Arranjo de Mão Lírios P");
    expect(normal.getAttribute("sizes")).toBe(
      "(max-width: 639px) 92vw, (max-width: 999px) calc(46vw - 8px), (max-width: 1259px) 24vw, 290px",
    );

    for (const alt of ["Arranjo de Mão Lírios M", "Buquê de Lírios M"]) {
      expect(screen.getByAltText(alt).getAttribute("sizes")).toBe(
        "(max-width: 639px) 92vw, (max-width: 999px) calc(46vw - 8px), (max-width: 1259px) 48vw, 600px",
      );
    }
  });
});
