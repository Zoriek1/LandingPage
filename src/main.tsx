import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAnalytics } from "./analytics";
import { trackPageView } from "./lib/tracking";

if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

initAnalytics();
createRoot(document.getElementById("root")!).render(<App />);
trackPageView();
