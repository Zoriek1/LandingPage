import { createRoot } from "react-dom/client";
import NamoradosPage from "@/features/namorados/NamoradosPage";
import "@/index.css";
import { trackPageView } from "@/lib/tracking";

if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

createRoot(document.getElementById("root")!).render(<NamoradosPage />);
trackPageView();
