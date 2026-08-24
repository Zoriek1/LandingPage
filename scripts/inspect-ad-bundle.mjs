import { existsSync, readdirSync, readFileSync, rmSync, rmdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AD_ENTRY_SOURCE = "src/features/ad-lps/AdLandingPage.tsx";
const ENTRY_CLIENT_SOURCE = "src/features/ad-lps/entry-client.tsx";

const FORBIDDEN_GRAPH_MATCHES = [
  {
    label: "Framer Motion",
    pattern: /framer-motion|(?:^|[\\/_.-])motion(?:[\\/_.-]|$)/i,
  },
  {
    label: "home content",
    pattern: /src[\\/]routes[\\/]HomeRoute|src[\\/]pages[\\/]Index|(?:^|[\\/_.-])HomeRoute(?:[\\/_.-]|$)/i,
  },
  {
    label: "home provider",
    pattern: /@tanstack[\\/]react-query|(?:^|[\\/_.-])query(?:[\\/_.-]|$)|radix-home|TooltipProvider|(?:^|[\\/_.-])(?:sonner|toaster|tooltip)(?:[\\/_.-]|$)/i,
  },
];

const FORBIDDEN_CHUNK_CONTENT = [
  { label: "Framer Motion", pattern: /framer-motion/ },
  {
    label: "home provider",
    pattern: /@tanstack\/react-query|QueryClientProvider|TooltipProvider|\bToaster\b/,
  },
  { label: "home content", pattern: /src\/routes\/HomeRoute|src\/pages\/Index/ },
];

function describeChunk(key, chunk) {
  return [key, chunk.src, chunk.name, chunk.file].filter(Boolean).join("\n");
}

export function inspectAdBundle({ distDir = "dist", entrySource = AD_ENTRY_SOURCE } = {}) {
  const resolvedDist = resolve(distDir);
  const manifestPath = join(resolvedDist, ".vite", "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Vite manifest not found: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  // Entradas estáticas (declaradas em rollupOptions.input) mantêm a chave
  // igual ao caminho-fonte nas duas engines. Um módulo alcançado só por
  // import() dinâmico (caso do AdLandingPage, via React.lazy) ganha chave
  // hasheada (`_Nome-hash.js`) e sem `src` no Rolldown (bundler do Vite 8+);
  // o `name` do chunk continua sendo o nome do arquivo-fonte sem extensão.
  const entryBaseName = entrySource.split("/").pop().replace(/\.[^.]+$/, "");
  const entryKey = Object.keys(manifest).find(
    (key) =>
      key === entrySource ||
      manifest[key]?.src === entrySource ||
      manifest[key]?.name === entryBaseName,
  );
  if (!entryKey) {
    throw new Error(`Ad entry missing from Vite manifest: ${entrySource}`);
  }

  const pending = [entryKey];
  const visited = new Set();
  const files = [];

  while (pending.length) {
    const key = pending.pop();
    if (visited.has(key)) continue;
    visited.add(key);

    const chunk = manifest[key];
    if (!chunk) {
      throw new Error(`Manifest dependency missing for ad entry: ${key}`);
    }

    const description = describeChunk(key, chunk);
    for (const forbidden of FORBIDDEN_GRAPH_MATCHES) {
      if (forbidden.pattern.test(description)) {
        throw new Error(
          `Ad bundle imports forbidden ${forbidden.label} chunk: ${chunk.file ?? key}`,
        );
      }
    }

    if (chunk.file) {
      files.push(chunk.file);
      const chunkPath = join(resolvedDist, chunk.file);
      if (!existsSync(chunkPath)) {
        throw new Error(`Emitted ad dependency is missing: ${chunkPath}`);
      }
      const source = readFileSync(chunkPath, "utf8");
      for (const forbidden of FORBIDDEN_CHUNK_CONTENT) {
        if (forbidden.pattern.test(source)) {
          throw new Error(
            `Ad bundle contains forbidden ${forbidden.label} code: ${chunk.file}`,
          );
        }
      }
    }

    pending.push(...(chunk.imports ?? []), ...(chunk.dynamicImports ?? []));
  }

  return { entryKey, entryFile: manifest[entryKey].file, files: [...new Set(files)] };
}

/**
 * Toda rota é React.lazy, então sem um modulepreload no index.html o chunk da
 * LP só começa a baixar depois que o bundle principal executa — uma segunda ida
 * à rede que o usuário vê como tela de carregamento. O plugin
 * adLandingModulePreload (vite.config.ts) injeta o link; aqui garantimos que
 * ele continua sendo injetado.
 */
export function inspectAdPreload({ distDir = "dist", adChunkFile }) {
  const htmlPath = join(resolve(distDir), "index.html");
  if (!existsSync(htmlPath)) {
    throw new Error(`index.html não encontrado em dist: ${htmlPath}`);
  }

  const html = readFileSync(htmlPath, "utf8");
  const expected = `rel="modulepreload" crossorigin href="/${adChunkFile}"`;
  if (!html.includes(expected)) {
    throw new Error(
      `index.html não pré-carrega o chunk da LP de anúncio (${adChunkFile}); ` +
        `o "Carregando…" volta a aparecer no primeiro paint`,
    );
  }

  return { htmlPath, adChunkFile };
}

/**
 * Segunda rede de segurança, independente das asserções já embutidas em
 * scripts/prerender-ad-lps.mjs: relê os HTMLs finais do dist/ (depois de tudo
 * já ter rodado) e confirma que a primeira dobra de cada LP realmente foi
 * pré-renderizada — não só o preload do hero, mas o próprio conteúdo (H1 +
 * div#root não-vazio). Se o script de prerender for pulado/quebrar
 * silenciosamente, esta checagem falha o build de qualquer forma.
 */
export function inspectPrerenderedContent({ distDir = "dist" } = {}) {
  const resolvedDist = resolve(distDir);
  const slugFiles = readdirSync(resolvedDist).filter(
    (file) => file.endsWith(".html") && file !== "index.html",
  );
  if (!slugFiles.length) {
    throw new Error(`Nenhum HTML de LP encontrado em ${resolvedDist}`);
  }

  for (const file of slugFiles) {
    const html = readFileSync(join(resolvedDist, file), "utf8");

    if (/<div id="root"><\/div>/.test(html)) {
      throw new Error(`${file}: div#root está vazia — a LP não foi pré-renderizada`);
    }
    // O h1 pode trazer marcação inline (`headlineMark` em configs.ts destaca
    // uma palavra com <em>): o que se exige é texto dentro da tag.
    const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (!heading || !heading[1].replace(/<[^>]+>/g, "").trim()) {
      throw new Error(`${file}: nenhum <h1> encontrado no HTML pré-renderizado`);
    }
    if (!html.includes('data-testid="ad-lp-hero-image"')) {
      throw new Error(`${file}: hero image ausente no HTML pré-renderizado`);
    }
  }

  return { files: slugFiles };
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";
if (currentFile === invokedFile) {
  const args = process.argv.slice(2);
  const cleanupManifest = args.includes("--cleanup-manifest");
  const distArg = args.find((arg) => !arg.startsWith("--"));
  const distDir = distArg ?? join(dirname(currentFile), "..", "dist");
  const result = inspectAdBundle({ distDir });
  process.stdout.write(
    `PASS ad bundle isolation: ${result.files.length} emitted chunks inspected\n`,
  );

  const preload = inspectAdPreload({ distDir, adChunkFile: result.entryFile });
  process.stdout.write(`PASS ad chunk preloaded in index.html: ${preload.adChunkFile}\n`);

  const entryClientResult = inspectAdBundle({ distDir, entrySource: ENTRY_CLIENT_SOURCE });
  process.stdout.write(
    `PASS entry-client bundle isolation: ${entryClientResult.files.length} emitted chunks inspected\n`,
  );

  const prerendered = inspectPrerenderedContent({ distDir });
  process.stdout.write(
    `PASS prerendered content present: ${prerendered.files.length} slug HTML(s) checked\n`,
  );

  if (cleanupManifest) {
    const manifestDir = join(resolve(distDir), ".vite");
    rmSync(join(manifestDir, "manifest.json"));
    try {
      rmdirSync(manifestDir);
    } catch {
      // Preserve the directory if Vite adds other build metadata in the future.
    }
  }
}
