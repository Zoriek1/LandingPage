import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "path";
import { AD_LP_SLUGS } from "./src/routes/routeManifest";

const AD_LANDING_ENTRY = "src/features/ad-lps/AdLandingPage.tsx";
const ENTRY_CLIENT_SOURCE = "src/features/ad-lps/entry-client.tsx";

/** Onde o <picture> do hero é montado: ver ResponsivePicture em AdLandingPage. */
const HERO_SIZES = "100vw";

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
        adLandingCssFiles.length = 0;

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
        // o cache antes, o estilo custaria uma terceira ida à rede. Nos HTMLs
        // estáticos por slug esse mesmo arquivo vira <link rel=stylesheet>.
        for (const css of adChunk.viteMetadata?.importedCss ?? []) {
          adLandingCssFiles.push(css);
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

/**
 * Preenchido pelo plugin acima e consumido por adLandingStaticHtml: é o CSS
 * próprio da LP (theme.css + fonts.css), o único crítico para a primeira
 * pintura dessas páginas.
 */
const adLandingCssFiles: string[] = [];

/**
 * Todos os nomes de origem que apontam para um mesmo arquivo emitido.
 *
 * É plural de propósito: assets com conteúdo idêntico são deduplicados num
 * único arquivo pelo Rollup, e aí `name` guarda só o primeiro. A foto de
 * /presente-hoje é byte a byte igual à de /urgencia, então indexar por `name`
 * fazia /presente-hoje não achar o próprio hero e cair no preload da fachada —
 * bytes desperdiçados e o LCP real seguindo sem preload.
 */
function assetSourceNames(output: {
  fileName: string;
  name?: string;
  names?: readonly string[];
  originalFileNames?: readonly string[];
}) {
  const names = new Set<string>();
  for (const name of output.names ?? []) names.add(path.basename(name));
  for (const original of output.originalFileNames ?? []) names.add(path.basename(original));
  if (output.name) names.add(path.basename(output.name));
  if (!names.size) {
    // Rede de segurança: casa exatamente os 8 caracteres do hash do Vite.
    names.add(path.basename(output.fileName).replace(/-[A-Za-z0-9_-]{8}(\.[^.]+)$/, "$1"));
  }
  return names;
}

/**
 * O SPA entrega um único index.html para as 13 rotas, então o hero — o elemento
 * de LCP — só existia depois que o React montava: o Lighthouse media ~1,5 s de
 * atraso só para *descobrir* a imagem. Um preload fixo no index.html não
 * resolve, porque cada LP usa uma foto diferente.
 *
 * Este plugin emite um HTML por slug (`/lirios-apt` -> `lirios-apt.html`, ver
 * public/.htaccess) com o preload do hero daquela LP no documento inicial. Os
 * nomes com hash saem do bundle, nunca hardcoded.
 *
 * Aproveita a mesma passagem para acertar o CSS: o Tailwind global bloqueia a
 * renderização e é 95% inútil aqui (a LP tem folha própria; só o modal de
 * faixa de preço usa utilitários), enquanto a folha da LP só virava stylesheet
 * depois que o JS executava. Nos HTMLs por slug os dois trocam de papel.
 *
 * Também troca o <script type=module> do index.html (que monta App.tsx via
 * BrowserRouter/React.lazy) pelo chunk do entry-client, que hidrata
 * AdLandingPage direto — ver entry-client.tsx sobre por que isso evita o
 * flash de hidratação de um Suspense boundary lazy sobre conteúdo pré-renderizado.
 * O conteúdo em si (SSR de cada slug) é injetado depois por
 * scripts/prerender-ad-lps.mjs, que roda após este build.
 */
function adLandingStaticHtml(): Plugin {
  return {
    name: "ad-landing-static-html",
    apply: "build",
    // writeBundle: o index.html já está em disco e o bundle traz os hashes.
    writeBundle(options, bundle) {
      const outDir = options.dir ?? path.resolve(__dirname, "dist");
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;

      // Slugs com entrada HTML própria (dia-das-maes/, dia-dos-namorados/) são
      // servidos pelo diretório, não pelo router — emitir .html para eles
      // sequestraria a URL da página dedicada.
      const ownEntries = new Set(
        Object.values(bundle)
          .filter((output) => output.fileName.endsWith("index.html"))
          .map((output) => output.fileName.replace(/\/?index\.html$/, "")),
      );

      const entryClientChunk = Object.values(bundle).find(
        (chunk) =>
          chunk.type === "chunk" &&
          chunk.facadeModuleId?.replace(/\\/g, "/").endsWith(ENTRY_CLIENT_SOURCE),
      );
      if (!entryClientChunk || entryClientChunk.type !== "chunk") {
        throw new Error(`Chunk do entry-client não encontrado no bundle: ${ENTRY_CLIENT_SOURCE}`);
      }

      const assetsByName = new Map<string, string>();
      for (const output of Object.values(bundle)) {
        for (const name of assetSourceNames(output)) {
          assetsByName.set(name, output.fileName);
        }
      }

      const heroSources = (slug: string) => {
        const own = [480, 900].map((w) => assetsByName.get(`hero-${slug}-${w}.avif`));
        // Mesma regra de getHeroSources: sem as variantes próprias, a LP mostra
        // a fachada — e é ela que precisa ser pré-carregada.
        if (own.every(Boolean)) return own as string[];
        const fallback = [480, 900].map((w) => assetsByName.get(`fachada-${w}.avif`));
        return fallback.every(Boolean) ? (fallback as string[]) : null;
      };

      const indexHtml = fs.readFileSync(indexPath, "utf8");
      const written: string[] = [];

      for (const slug of AD_LP_SLUGS) {
        if (ownEntries.has(slug)) continue;

        const sources = heroSources(slug);
        if (!sources) {
          throw new Error(`Variantes AVIF do hero não encontradas para /${slug}`);
        }
        const [avif480, avif900] = sources;

        // href é o fallback para quem ignora imagesrcset; imagesrcset/imagesizes
        // repetem o <source> do <picture> para que o preload seja reaproveitado
        // em vez de virar um segundo download. type="image/avif" faz o navegador
        // sem suporte pular o preload e seguir pelo webp do <picture>.
        const heroPreload =
          `<link rel="preload" as="image" fetchpriority="high" type="image/avif" ` +
          `href="/${avif900}" imagesrcset="/${avif480} 480w, /${avif900} 900w" ` +
          `imagesizes="${HERO_SIZES}" />`;

        let html = indexHtml.replace(
          /(<meta name="viewport"[^>]*>)/,
          `$1\n    ${heroPreload}`,
        );
        if (!html.includes(heroPreload)) {
          throw new Error("Âncora <meta name=\"viewport\"> não encontrada no index.html");
        }

        html = deferGlobalStylesheets(html);
        html = promoteAdLandingStylesheets(html);
        html = swapEntryClientScript(html, entryClientChunk.fileName);

        fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
        written.push(`${slug}.html`);
      }

      this.info?.(`HTML estático das LPs: ${written.join(", ")}`);
    },
  };
}

/**
 * O Tailwind global é a única folha bloqueante do documento e não pinta um
 * pixel sequer da LP (conferido com screenshot full-page byte a byte): só o
 * modal de faixa de preço, aberto por clique, usa esses utilitários. media=print
 * tira a folha do caminho crítico sem deixar de baixá-la.
 */
function deferGlobalStylesheets(html: string) {
  return html.replace(
    /<link rel="stylesheet"([^>]*?)href="([^"]+)"([^>]*)>/g,
    (_match, before, href, after) =>
      `<link rel="stylesheet"${before}href="${href}"${after} media="print" ` +
      `onload="this.media='all'" />` +
      `<noscript><link rel="stylesheet" href="${href}" /></noscript>`,
  );
}

/**
 * Troca o <script type=module> do index.html (que monta App.tsx via
 * BrowserRouter/React.lazy) pelo chunk do entry-client (hidrata AdLandingPage
 * direto). O root ainda pode estar vazio neste ponto — prerender-ad-lps.mjs
 * injeta o SSR depois — mas o script certo já precisa apontar pra cá.
 */
function swapEntryClientScript(html: string, entryClientFile: string) {
  const scriptTagPattern = /<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/;
  if (!scriptTagPattern.test(html)) {
    throw new Error("Tag <script type=\"module\"> não encontrada no HTML da LP");
  }
  return html.replace(
    scriptTagPattern,
    `<script type="module" crossorigin src="/${entryClientFile}"></script>`,
  );
}

/** A folha da LP deixa de esperar o JS e passa a descer junto com o documento. */
function promoteAdLandingStylesheets(html: string) {
  let result = html;
  for (const css of adLandingCssFiles) {
    result = result.replace(
      `<link rel="preload" as="style" href="/${css}">`,
      `<link rel="stylesheet" href="/${css}">`,
    );
  }
  return result;
}

export default defineConfig(({ isSsrBuild }) => ({
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
  plugins: [react(), adLandingModulePreload(), adLandingStaticHtml()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    manifest: true,
    reportCompressedSize: false,
    rollupOptions: isSsrBuild
      ? undefined
      : {
          input: {
            main: path.resolve(__dirname, "index.html"),
            mothersDay: path.resolve(__dirname, "dia-das-maes/index.html"),
            namorados: path.resolve(__dirname, "dia-dos-namorados/index.html"),
            entryClient: path.resolve(
              __dirname,
              "src/features/ad-lps/entry-client.tsx",
            ),
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
}));
