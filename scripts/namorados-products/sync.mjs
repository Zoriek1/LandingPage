import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFeaturedProductsData } from "../mothers-day-products/sync.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "../..");

const SOURCES_PATH = path.join(
  PROJECT_ROOT,
  "src",
  "features",
  "namorados",
  "data",
  "featured-product-sources.json",
);
const SNAPSHOT_PATH = path.join(
  PROJECT_ROOT,
  "src",
  "features",
  "namorados",
  "data",
  "featured-products.snapshot.json",
);
const OUTPUT_PATH = path.join(PROJECT_ROOT, "public", "dia-dos-namorados", "featured-products.json");

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf-8"));

const ensureDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

export const syncFeaturedProducts = async ({
  outputPath = OUTPUT_PATH,
  snapshotPath = SNAPSHOT_PATH,
  logger = console,
} = {}) => {
  const sources = await readJson(SOURCES_PATH);
  const snapshot = await readJson(SNAPSHOT_PATH);
  const featuredProducts = await buildFeaturedProductsData({
    sources,
    snapshot,
    logger,
  });

  await ensureDir(outputPath);
  await ensureDir(snapshotPath);
  await fs.writeFile(outputPath, `${JSON.stringify(featuredProducts, null, 2)}\n`, "utf-8");
  await fs.writeFile(snapshotPath, `${JSON.stringify(featuredProducts, null, 2)}\n`, "utf-8");
  logger.info(`[namorados] wrote ${featuredProducts.length} featured products to ${outputPath}`);
  logger.info(`[namorados] wrote fallback snapshot to ${snapshotPath}`);
  return featuredProducts;
};

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  syncFeaturedProducts().catch((error) => {
    console.error("[namorados] sync failed", error);
    process.exitCode = 1;
  });
}
