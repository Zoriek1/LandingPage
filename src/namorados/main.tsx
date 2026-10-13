import { createRoot } from "react-dom/client";
import AdLandingPage from "@/features/ad-lps/AdLandingPage";
import "@/index.css";
import { initAnalytics } from "@/analytics";
import { trackPageView } from "@/lib/tracking";

if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

initAnalytics();
createRoot(document.getElementById("root")!).render(<AdLandingPage slug="dia-dos-namorados" />);
trackPageView();
