import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AD_LP_SLUGS } from "@/routes/routeManifest";

const HomeRoute = lazy(() => import("@/routes/HomeRoute"));
const AdLandingPage = lazy(() => import("@/features/ad-lps/AdLandingPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * Sem fallback visível: o chunk da rota é pré-carregado em paralelo com o bundle
 * principal (ver o plugin adLandingModulePreload em vite.config.ts), então uma
 * tela intermediária só apareceria como um flash indesejado.
 */
const App = () => (
  <BrowserRouter>
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
