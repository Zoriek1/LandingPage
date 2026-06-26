import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isValidFeaturedProduct,
  parseFeaturedProductPage,
  slugFromUrl,
} from "../mothers-day-products/product-parser.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "../..");

const SOURCES_PATH = path.join(PROJECT_ROOT, "src", "data", "featured-product-sources.json");
const SNAPSHOT_PATH = path.join(PROJECT_ROOT, "src", "data", "featured-products.snapshot.json");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "public", "featured-products.json");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf-8"));

const ensureDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const sanitizeFeaturedProduct = (product) => ({
  slug: String(product.slug ?? "").trim(),
  title: String(product.title ?? "").trim(),
  url: String(product.url ?? "").trim(),
  imageUrl: String(product.imageUrl ?? "").trim(),
  priceLabel: String(product.priceLabel ?? "").trim(),
  ...(product.pixPriceLabel ? { pixPriceLabel: String(product.pixPriceLabel).trim() } : {}),
  ...(product.waText ? { waText: String(product.waText).trim() } : {}),
});

const mergeWithFallback = (product, fallbackProduct) =>
  sanitizeFeaturedProduct({
    ...fallbackProduct,
    ...product,
    slug: product.slug || fallbackProduct?.slug,
    title: product.title || fallbackProduct?.title,
    url: product.url || fallbackProduct?.url,
    imageUrl: product.imageUrl || fallbackProduct?.imageUrl,
    priceLabel: product.priceLabel || fallbackProduct?.priceLabel,
    pixPriceLabel: product.pixPriceLabel || fallbackProduct?.pixPriceLabel,
    waText: product.waText || fallbackProduct?.waText,
  });

const normalizeForMatch = (value = "") =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeSlug = (value = "") => normalizeForMatch(String(value).replace(/\s+/g, "-")).replace(/\s+/g, "-");

const PRODUCT_TOKEN_STOPWORDS = new Set([
  "a",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "para",
]);

const doesParsedProductMatchUrl = (url, productTitle = "") => {
  const slugTokens = slugFromUrl(url)
    .split("-")
    .map(normalizeForMatch)
    .filter((token) => token.length > 1 && !PRODUCT_TOKEN_STOPWORDS.has(token));

  if (slugTokens.length === 0) {
    return true;
  }

  const normalizedTitle = ` ${normalizeForMatch(productTitle)} `;
  const matchingTokenCount = slugTokens.filter((token) => normalizedTitle.includes(` ${token} `)).length;
  return matchingTokenCount >= Math.max(1, Math.ceil(slugTokens.length / 2));
};

const fetchProductHtmlWithBrowser = async (url) => {
  const { chromium } = await import("@playwright/test");

  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      channel: "chrome",
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
  } catch {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
  }

  try {
    const page = await browser.newPage({
      locale: "pt-BR",
      userAgent: USER_AGENT,
    });

    await page.goto(url, {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
};

export const fetchProductHtml = async (url, fetchImpl = fetch) => {
  try {
    const response = await fetchImpl(url, {
      headers: {
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "user-agent": USER_AGENT,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
  } catch (error) {
    try {
      return await fetchProductHtmlWithBrowser(url);
    } catch {
      throw error;
    }
  }
};

export const buildFeaturedProductsData = async ({
  sources,
  snapshot,
  fetchHtml = fetchProductHtml,
  logger = console,
} = {}) => {
  const featuredSources = sources ?? (await readJson(SOURCES_PATH));
  const fallbackSnapshot = (snapshot ?? (await readJson(SNAPSHOT_PATH))).map(sanitizeFeaturedProduct);
  const snapshotBySlug = new Map();

  for (const product of fallbackSnapshot) {
    const explicitSlug = normalizeSlug(product.slug);
    const urlSlug = normalizeSlug(slugFromUrl(product.url));

    if (explicitSlug) {
      snapshotBySlug.set(explicitSlug, product);
    }

    if (urlSlug) {
      snapshotBySlug.set(urlSlug, product);
    }
  }

  const results = [];

  for (const source of featuredSources) {
    const url = String(source.url ?? "").trim();
    const slug = normalizeSlug(slugFromUrl(url));
    const fallbackProduct = snapshotBySlug.get(slug);

    try {
      const html = await fetchHtml(url);
      const parsedPayload = parseFeaturedProductPage({ html, url });
      const parsedCanonicalSlug = normalizeSlug(slugFromUrl(parsedPayload.canonicalUrl));

      if (parsedCanonicalSlug && parsedCanonicalSlug !== slug) {
        throw new Error(`Parsed page canonical did not match requested product for ${url}`);
      }

      const rawParsedProduct = sanitizeFeaturedProduct(parsedPayload);

      if (!doesParsedProductMatchUrl(url, rawParsedProduct.title)) {
        throw new Error(`Parsed page did not match requested product for ${url}`);
      }

      const parsedProduct = mergeWithFallback(rawParsedProduct, fallbackProduct);

      if (!isValidFeaturedProduct(parsedProduct)) {
        throw new Error(`Invalid product payload for ${url}`);
      }

      results.push(parsedProduct);
    } catch (error) {
      if (fallbackProduct) {
        logger.warn(
          `[home] fallback used for ${url}: ${error instanceof Error ? error.message : String(error)}`,
        );
        results.push(fallbackProduct);
        continue;
      }

      logger.warn(
        `[home] product skipped for ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return results;
};

export const syncFeaturedProducts = async ({
  outputPath = OUTPUT_PATH,
  snapshotPath = SNAPSHOT_PATH,
  logger = console,
} = {}) => {
  const featuredProducts = await buildFeaturedProductsData({ logger });
  await ensureDir(outputPath);
  await ensureDir(snapshotPath);
  await fs.writeFile(outputPath, `${JSON.stringify(featuredProducts, null, 2)}\n`, "utf-8");
  await fs.writeFile(snapshotPath, `${JSON.stringify(featuredProducts, null, 2)}\n`, "utf-8");
  logger.info(`[home] wrote ${featuredProducts.length} featured products to ${outputPath}`);
  logger.info(`[home] wrote fallback snapshot to ${snapshotPath}`);
  return featuredProducts;
};

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  syncFeaturedProducts().catch((error) => {
    console.error("[home] sync failed", error);
    process.exitCode = 1;
  });
}
