import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const AD_LANDING_ENTRY = "src/features/ad-lps/AdLandingPage.tsx";

/**
 * Todas as rotas são React.lazy, então sem ajuda o chunk da LP só começa a
 * baixar depois que o bundle principal executa — uma segunda ida à rede que o
 * usuário enxerga como tela de carregamento. Este plugin injeta o modulepreload
 * do chunk da LP no index.html da raiz para que ele desça em paralelo.
 *
 * Só o index.html da raiz usa o router; dia-das-maes/ e dia-dos-namorados/ são
 * entradas próprias e não devem receber o link.
 */
function adLandingModulePreload(): Plugin {
  return {
    name: "ad-landing-module-preload",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        // Em dev não há bundle para inspecionar.
        if (ctx.path !== "/index.html" || !ctx.bundle) return;

        const adChunk = Object.values(ctx.bundle).find(
          (chunk) =>
            chunk.type === "chunk" &&
            chunk.facadeModuleId?.replace(/\\/g, "/").endsWith(AD_LANDING_ENTRY),
        );
        if (!adChunk || adChunk.type !== "chunk") {
          throw new Error(
            `Chunk da LP de anúncio não encontrado no bundle: ${AD_LANDING_ENTRY}`,
          );
        }

        // O HTML já traz o grafo estático da SUA entrada; preload duplicado só
        // desperdiça markup. Precisa ser a entrada desta página: as outras
        // (dia-das-maes, dia-dos-namorados) têm grafo próprio, e considerá-las
        // aqui filtrava justamente o chunk que queremos anunciar.
        const htmlEntry = ctx.chunk;
        if (!htmlEntry) {
          throw new Error("Chunk de entrada de index.html não encontrado no bundle");
        }

        const alreadyLinked = new Set<string>();
        const pending = [htmlEntry.fileName, ...htmlEntry.imports];
        while (pending.length) {
          const fileName = pending.pop()!;
          if (alreadyLinked.has(fileName)) continue;
          alreadyLinked.add(fileName);
          const chunk = ctx.bundle[fileName];
          if (chunk?.type === "chunk") pending.push(...chunk.imports);
        }

        const files = [adChunk.fileName, ...adChunk.imports].filter(
          (file) => !alreadyLinked.has(file),
        );

        const tags = files.map<HtmlTagDescriptor>((file) => ({
          tag: "link",
          attrs: { rel: "modulepreload", crossorigin: true, href: `/${file}` },
          injectTo: "head",
        }));

        // O CSS da LP é inserido em runtime quando o chunk carrega; sem aquecer
        // o cache antes, o estilo custaria uma terceira ida à rede.
        for (const css of adChunk.viteMetadata?.importedCss ?? []) {
          tags.push({
            tag: "link",
            attrs: { rel: "preload", as: "style", href: `/${css}` },
            injectTo: "head",
          });
        }

        return tags;
      },
    },
  };
}

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
  plugins: [react(), adLandingModulePreload()],
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
