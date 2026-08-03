import { renderToString } from "react-dom/server";
import AdLandingPage from "./AdLandingPage";
import { BRAND_DOMAIN, LP_CONFIGS } from "./data/configs";
import { resolveOgImagePath } from "./lib/hero-images";

/**
 * Chamado em Node (via `vite build --ssr`) pelo script de prerender, um slug
 * por vez. Mesma árvore React da hidratação no cliente (ver entry-client.tsx)
 * — zero markup duplicado.
 */
export function render(slug: string): string {
  return renderToString(<AdLandingPage slug={slug} />);
}

export type SlugMeta = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
};

/**
 * Mesmos dados/mesma fonte que <DocumentMeta> recebe dentro de AdLandingPage
 * (ver AdLandingPage.tsx) — usado pelo script de prerender para gravar
 * title/meta/canonical corretos direto no HTML de cada slug, sem esperar o
 * useEffect do cliente rodar.
 */
export function renderMeta(slug: string): SlugMeta {
  const config = LP_CONFIGS[slug];
  const canonicalUrl = config.canonicalUrl ?? `https://${BRAND_DOMAIN}/${config.slug}`;

  return {
    title: config.pageTitle,
    description: config.pageDescription,
    canonical: canonicalUrl,
    ogTitle: config.pageTitle,
    ogDescription: config.pageDescription,
    ogUrl: canonicalUrl,
    ogImage: `https://${BRAND_DOMAIN}${resolveOgImagePath(config)}`,
  };
}
