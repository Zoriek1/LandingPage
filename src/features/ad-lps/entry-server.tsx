import { renderToString } from "react-dom/server";
import AdLandingPage from "./AdLandingPage";

/**
 * Chamado em Node (via `vite build --ssr`) pelo script de prerender, um slug
 * por vez. Mesma árvore React da hidratação no cliente (ver entry-client.tsx)
 * — zero markup duplicado.
 */
export function render(slug: string): string {
  return renderToString(<AdLandingPage slug={slug} />);
}
