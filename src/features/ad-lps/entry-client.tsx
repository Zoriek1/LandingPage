import { hydrateRoot } from "react-dom/client";
import AdLandingPage from "./AdLandingPage";
import { trackPageView } from "@/lib/tracking";

/**
 * Entry dedicado dos HTMLs estáticos por slug (dist/<slug>.html, ver
 * adLandingStaticHtml em vite.config.ts) — NÃO passa por App.tsx/BrowserRouter/
 * React.lazy. Isso evita o flash de hidratação que aconteceria se a árvore
 * pré-renderizada fosse hidratada atrás de um Suspense boundary lazy: o
 * fallback (null) substituiria o conteúdo já pintado até o chunk resolver.
 *
 * Cada documento estático já É o slug específico (a regra do .htaccess mapeia
 * /<slug> e /<slug>/ para o mesmo <slug>.html), então o slug vem direto da URL
 * — sem precisar de router nem de um <script> inline com o valor.
 */
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

// .replace(/\.html$/, "") cobre o acesso direto ao arquivo (vite preview, um
// servidor estático sem o rewrite do .htaccess) — em produção via Apache a URL
// já chega limpa (/lirios-apt), sem a extensão.
const slug = location.pathname.replace(/^\/|\/$/g, "").replace(/\.html$/, "");

hydrateRoot(document.getElementById("root")!, <AdLandingPage slug={slug} />);
trackPageView();
