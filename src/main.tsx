import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { trackPageView } from "./lib/tracking";

if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

createRoot(document.getElementById("root")!).render(<App />);
trackPageView();
