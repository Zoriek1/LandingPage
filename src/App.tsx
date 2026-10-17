import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { navigateAnalytics } from "@/analytics";
import { AD_LP_SLUGS } from "@/routes/routeManifest";

const HomeRoute = lazy(() => import("@/routes/HomeRoute"));
const AdLandingPage = lazy(() => import("@/features/ad-lps/AdLandingPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * A primeira página é registrada por initAnalytics() no entry; aqui só as
 * navegações SPA seguintes, quando o pathname resolvido muda.
 */
export function AnalyticsRouteObserver() {
  const { pathname } = useLocation();
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    navigateAnalytics(pathname);
  }, [pathname]);

  return null;
}

/**
 * Sem fallback visível: o chunk da rota é pré-carregado em paralelo com o bundle
 * principal (ver o plugin adLandingModulePreload em vite.config.ts), então uma
 * tela intermediária só apareceria como um flash indesejado.
 */
const App = () => (
  <BrowserRouter>
    <AnalyticsRouteObserver />
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        {AD_LP_SLUGS.map((slug) => (
          <Route key={slug} path={`/${slug}`} element={<AdLandingPage slug={slug} />} />
        ))}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
