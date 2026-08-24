import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isCompleteLilyFamily, parseLilyFamilyPage } from "./product-parser.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "../..");
const SNAPSHOT_PATH = path.join(PROJECT_ROOT, "src", "data", "lily-products.snapshot.json");

export const LILY_FAMILY_SOURCES = {
  arranjo: "https://www.planteumaflor.com/produtos/arranjo-mao-lirios/",
  buque: "https://www.planteumaflor.com/produtos/buque-lirios/",
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/135 Safari/537.36";

export async function fetchLilyProductHtml(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: { "accept-language": "pt-BR,pt;q=0.9", "user-agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Falha ao baixar ${url}: ${response.status}`);
  return response.text();
}

export async function buildLilyCatalogSnapshot({
  snapshot,
  fetchHtml = fetchLilyProductHtml,
  logger = console,
} = {}) {
  const fallback = snapshot ?? JSON.parse(await fs.readFile(SNAPSHOT_PATH, "utf8"));
  const families = { ...fallback.families };

  for (const [family, sourceUrl] of Object.entries(LILY_FAMILY_SOURCES)) {
    try {
      const html = await fetchHtml(sourceUrl);
      const parsed = parseLilyFamilyPage({ html, family, sourceUrl });
      if (!isCompleteLilyFamily(parsed)) throw new Error(`Família ${family} incompleta`);
      families[family] = parsed;
    } catch (error) {
      if (!isCompleteLilyFamily(fallback.families?.[family])) throw error;
      logger.warn(
        `[lily-products] snapshot preservado para ${family}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      families[family] = fallback.families[family];
    }
  }

  return { schemaVersion: 1, families };
}

export async function syncLilyCatalog({
  snapshotPath = SNAPSHOT_PATH,
  fetchHtml = fetchLilyProductHtml,
  logger = console,
} = {}) {
  const currentText = await fs.readFile(snapshotPath, "utf8");
  const next = await buildLilyCatalogSnapshot({
    snapshot: JSON.parse(currentText),
    fetchHtml,
    logger,
  });
  const nextText = `${JSON.stringify(next, null, 2)}\n`;

  if (nextText !== currentText) {
    const temporaryPath = `${snapshotPath}.tmp-${process.pid}`;
    await fs.writeFile(temporaryPath, nextText, "utf8");
    await fs.rename(temporaryPath, snapshotPath);
    logger.info(`[lily-products] snapshot atualizado em ${snapshotPath}`);
  } else {
    logger.info("[lily-products] snapshot já está atualizado");
  }
  return next;
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  syncLilyCatalog().catch((error) => {
    console.error("[lily-products] sync falhou", error);
    process.exitCode = 1;
  });
}
