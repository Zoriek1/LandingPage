import { createRoot } from "react-dom/client";
import AdLandingPage from "@/features/ad-lps/AdLandingPage";
import "@/index.css";
import { trackPageView } from "@/lib/tracking";

if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

createRoot(document.getElementById("root")!).render(<AdLandingPage slug="dia-das-maes" />);
trackPageView();
