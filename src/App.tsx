import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AD_LP_SLUGS } from "@/routes/routeManifest";

const HomeRoute = lazy(() => import("@/routes/HomeRoute"));
const AdLandingPage = lazy(() => import("@/features/ad-lps/AdLandingPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RouteFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-background text-foreground">
      <p role="status">Carregando…</p>
    </main>
  );
}

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteFallback />}>
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
