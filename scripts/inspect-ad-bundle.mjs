import { existsSync, readFileSync, rmSync, rmdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AD_ENTRY_SOURCE = "src/features/ad-lps/AdLandingPage.tsx";

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

export function inspectAdBundle({ distDir = "dist" } = {}) {
  const resolvedDist = resolve(distDir);
  const manifestPath = join(resolvedDist, ".vite", "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Vite manifest not found: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const entryKey = Object.keys(manifest).find(
    (key) => key === AD_ENTRY_SOURCE || manifest[key]?.src === AD_ENTRY_SOURCE,
  );
  if (!entryKey) {
    throw new Error(`Ad entry missing from Vite manifest: ${AD_ENTRY_SOURCE}`);
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

  return { entryKey, files: [...new Set(files)] };
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
