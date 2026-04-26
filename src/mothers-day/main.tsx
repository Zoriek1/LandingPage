import { createRoot } from "react-dom/client";
import MothersDayPage from "@/features/mothers-day/MothersDayPage";
import "@/index.css";
import { trackPageView } from "@/lib/tracking";

if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

createRoot(document.getElementById("root")!).render(<MothersDayPage />);
trackPageView();
