import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import App from "@/App";
import { PRICE_RANGE_CONFIGS } from "@/lib/price-ranges";
import { AD_LP_SLUGS } from "@/routes/routeManifest";

const root = fileURLToPath(new URL("../../", import.meta.url));
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
    const nav = screen.getByRole("navigation", { name: "Seções da página" });

    expect(skipLink).toHaveAttribute("href", "#ad-lp-main");
    expect(main).toHaveAttribute("id", "ad-lp-main");
    expect(
      skipLink.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector("#hero")).toHaveClass("ad-lp-hero");
  });

  it("ships non-blocking critical fonts and Apache cache policy", () => {
    const fontCss = readProjectFile("src/features/ad-lps/fonts.css");
    const html = readProjectFile("index.html");
    const htaccess = readProjectFile("public/.htaccess");

    expect(fontCss).toMatch(/font-display:\s*swap/g);
    expect(html.match(/rel="preload"/g)).toHaveLength(1);
    expect(html).toMatch(/as="font"[^>]+type="font\/woff2"[^>]+crossorigin/);
    expect(htaccess).toMatch(/Cache-Control "public, max-age=31536000, immutable"/);
    expect(htaccess).toMatch(/Cache-Control "no-cache"/);
    expect(htaccess).toMatch(/image\/avif/);
    expect(htaccess).toMatch(/image\/webp/);
  });
});
