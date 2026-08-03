// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AD_LP_SLUGS } from "@/routes/routeManifest";
import { LP_CONFIGS } from "@/features/ad-lps/data/configs";
import { render } from "@/features/ad-lps/entry-server";

// dia-das-maes/dia-dos-namorados têm HTML próprio (ver adLandingStaticHtml em
// vite.config.ts); o prerender só cobre os slugs servidos pelo lirios-apt.html
// e afins.
const OWN_ENTRY_SLUGS = new Set(["dia-das-maes", "dia-dos-namorados"]);
const PRERENDERED_SLUGS = AD_LP_SLUGS.filter((slug) => !OWN_ENTRY_SLUGS.has(slug));

describe("entry-server render() under Node (no window)", () => {
  it.each(PRERENDERED_SLUGS)("renders %s without throwing", (slug) => {
    expect(typeof window).toBe("undefined");
    expect(() => render(slug)).not.toThrow();
  });

  it.each(PRERENDERED_SLUGS)("%s contains the configured h1 headline", (slug) => {
    const html = render(slug);
    const config = LP_CONFIGS[slug];
    expect(html).toContain(`<h1 class="ad-lp-hero__title">${config.headline}</h1>`);
  });

  it("lirios-apt hero picture matches the AVIF/WebP preload contract", () => {
    const html = render("lirios-apt");
    const sources = [...html.matchAll(/<source type="([^"]+)" srcSet="([^"]+)" sizes="([^"]+)"/g)];

    // O <picture> do hero: primeiro source AVIF, segundo WebP, ambos 480w/900w.
    const heroSources = sources.filter(([, , srcSet]) => srcSet.includes("hero-lirios-apt"));
    expect(heroSources).toHaveLength(2);
    expect(heroSources[0][1]).toBe("image/avif");
    expect(heroSources[0][2]).toMatch(/480w.*900w/);
    expect(heroSources[0][3]).toBe("100vw");
    expect(heroSources[1][1]).toBe("image/webp");

    expect(html).toContain('data-testid="ad-lp-hero-image"');
    expect(html).toMatch(/<img[^>]*fetchPriority="high"[^>]*data-testid="ad-lp-hero-image"/);
  });

  it("does not include tracking side effects at render time (SSR is inert)", () => {
    // trackPageView()/fbq/dataLayer só existem no entry-client, nunca aqui.
    expect(() => render("lirios-apt")).not.toThrow();
    expect(typeof globalThis.sessionStorage).toBe("undefined");
  });
});
