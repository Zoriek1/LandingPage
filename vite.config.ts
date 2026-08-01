import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, "../LandingPageMaes/node_modules"),
      ],
    },
  },
  plugins: [react()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    manifest: true,
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        mothersDay: path.resolve(__dirname, "dia-das-maes/index.html"),
        namorados: path.resolve(__dirname, "dia-dos-namorados/index.html"),
      },
      output: {
        manualChunks: {
          "react-vendor": [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react-router-dom",
          ],
          "motion": ["framer-motion"],
          "radix-dialog": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-slot",
          ],
          "radix-home": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-tooltip",
          ],
          "query": ["@tanstack/react-query"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
