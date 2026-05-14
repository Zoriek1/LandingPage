import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_OUTPUT = path.join(PROJECT_ROOT, "public", "lpb", "google-reviews.json");

const DEFAULT_URL =
  "https://www.google.com/search?q=plante+uma+flor#mpd=~8971672067068898504/customers/reviews";

const REVIEW_CARD_SELECTORS = [
  "[data-review-id]",
  ".jftiEf",
  ".gws-localreviews__google-review",
  "div[jscontroller][data-hveid]",
];

const TEXT_SELECTORS = [
  ".wiI7pd",
  ".MyEned",
  ".Jtu6Td",
  "[data-expandable-section]",
  "span[jsname='fbQN7e']",
  "span[jsname='bN97Pc']",
];

const AUTHOR_SELECTORS = [
  ".d4r55",
  ".TSUbDb",
  ".WNxzHc",
  ".N0c6q",
  "a[role='link']",
  "button[aria-label]",
];

const TIME_SELECTORS = [".rsqaWe", ".dehysf", ".PuaHbe", ".xRkPPb"];

const PHOTO_SELECTORS = ["img.NBa7we", ".lDY1rd img", "img[src*='googleusercontent']"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    url: DEFAULT_URL,
    output: DEFAULT_OUTPUT,
    debugDir: "",
    manualWaitMs: 0,
    profileDir: path.join(PROJECT_ROOT, "output", "playwright", "google-reviews-profile"),
    maxScrolls: 120,
    headed: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--url") options.url = args[++i] || options.url;
    if (arg === "--output") options.output = path.resolve(args[++i] || options.output);
    if (arg === "--debug-dir") options.debugDir = path.resolve(args[++i] || options.debugDir);
    if (arg === "--manual-wait-ms") options.manualWaitMs = Number(args[++i] || options.manualWaitMs);
    if (arg === "--profile-dir") options.profileDir = path.resolve(args[++i] || options.profileDir);
    if (arg === "--max-scrolls") options.maxScrolls = Number(args[++i] || options.maxScrolls);
    if (arg === "--headed") options.headed = true;
  }

  return options;
};

const normalizeWhitespace = (value = "") => value.replace(/\s+/g, " ").trim();

async function clickIfVisible(page, labels) {
  for (const label of labels) {
    const locator = page.getByRole("button", { name: new RegExp(label, "i") }).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click().catch(() => {});
      await sleep(800);
      return true;
    }
  }

  return false;
}

async function prepareGooglePage(page, { headed } = {}) {
  const pageText = normalizeWhitespace(await page.locator("body").innerText().catch(() => ""));
  if (/Não sou um robô|unusual traffic|tráfego incomum|not a robot/i.test(pageText)) {
    console.warn("[google-reviews] Google showed a robot check. Solve it in the opened browser to continue.");
    await page
      .waitForFunction(
        () => !/Não sou um robô|unusual traffic|tráfego incomum|not a robot/i.test(document.body.innerText),
        null,
        { timeout: 180000 },
      )
      .catch(() => {});
    await sleep(1500);
  }

  await clickIfVisible(page, [
    "Aceitar tudo",
    "Aceito",
    "Accept all",
    "I agree",
    "Concordo",
    "Rejeitar tudo",
    "Reject all",
  ]);

  if (headed) {
    const limitedText = normalizeWhitespace(await page.locator("body").innerText().catch(() => ""));
    if (/visualiza(?:ç|c)[aã]o limitada|Aproveite ao máximo o Google Maps|Fazer login/i.test(limitedText)) {
      console.warn(
        "[google-reviews] Google Maps is in limited mode. In the opened browser, sign in or open the Reviews tab manually; waiting up to 3 minutes.",
      );
      await page
        .waitForFunction(
          () =>
            /avaliaç(?:ão|ões)|reviews?/i.test(document.body.innerText) &&
            !/visualiza(?:ç|c)[aã]o limitada/i.test(document.body.innerText),
          null,
          { timeout: 180000 },
        )
        .catch(() => {});
      await sleep(1000);
    }
  }

  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll("div")).filter(
      (element) => element.scrollHeight > element.clientHeight + 120,
    );
    for (const element of scrollables) {
      element.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  });
  await sleep(500);

  await clickIfVisible(page, ["Avaliações", "Reviews"]);
  const reviewTrigger = page
    .locator("button, a, div[role='button'], span, div")
    .filter({ hasText: /avaliaç(?:ão|ões)|reviews?/i })
    .first();
  if (await reviewTrigger.isVisible().catch(() => false)) {
    await reviewTrigger.click({ force: true }).catch(() => {});
    await sleep(1800);
  }

  await sleep(1500);
}

async function findReviewsScroller(page) {
  return page.evaluateHandle(() => {
    const candidates = Array.from(document.querySelectorAll("div, c-wiz, g-scrolling-carousel"));
    const scored = candidates
      .map((element) => {
        const style = window.getComputedStyle(element);
        const overflowScore = /(auto|scroll)/.test(`${style.overflow}${style.overflowY}`) ? 5 : 0;
        const sizeScore = element.scrollHeight > element.clientHeight + 120 ? 5 : 0;
        const reviewScore =
          element.querySelectorAll(
            "[data-review-id], .jftiEf, .gws-localreviews__google-review, [aria-label*='estrela'], [aria-label*='star']",
          ).length * 3;
        return { element, score: overflowScore + sizeScore + reviewScore };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score);

    return scored[0]?.element || document.scrollingElement || document.body;
  });
}

async function scrollReviews(page, maxScrolls) {
  const scroller = await findReviewsScroller(page);
  let stableRounds = 0;
  let previousCount = 0;
  let previousHeight = 0;

  for (let i = 0; i < maxScrolls; i += 1) {
    const stats = await page.evaluate(
      ({ element, selectors }) => {
        const target = element || document.scrollingElement || document.body;
        target.scrollTop = target.scrollHeight;
        window.scrollTo(0, document.body.scrollHeight);
        const count = selectors.reduce(
          (total, selector) => total + document.querySelectorAll(selector).length,
          0,
        );
        return { count, height: target.scrollHeight };
      },
      { element: scroller, selectors: REVIEW_CARD_SELECTORS },
    );

    await sleep(900);

    if (stats.count === previousCount && stats.height === previousHeight) {
      stableRounds += 1;
    } else {
      stableRounds = 0;
      previousCount = stats.count;
      previousHeight = stats.height;
    }

    if (stableRounds >= 8) break;
  }
}

function pageExtractionScript({ reviewSelectors, textSelectors, authorSelectors, timeSelectors, photoSelectors }) {
  const normalize = (value = "") => value.replace(/\s+/g, " ").trim();
  const firstText = (root, selectors) => {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      const text = normalize(element?.textContent ?? "");
      if (text) return text;
    }
    return "";
  };
  const firstAttr = (root, selectors, attr) => {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      const value = element?.getAttribute(attr);
      if (value) return value;
    }
    return "";
  };
  const parseRating = (root) => {
    const ratingElement = Array.from(root.querySelectorAll("[aria-label]")).find((element) =>
      /(\d+[,.]?\d*)\s*(estrela|star)/i.test(element.getAttribute("aria-label") || ""),
    );
    const label = ratingElement?.getAttribute("aria-label") || "";
    const match = label.match(/(\d+[,.]?\d*)/);
    return match ? Number(match[1].replace(",", ".")) : null;
  };
  const parseAuthor = (root) => {
    const direct = firstText(root, authorSelectors);
    if (direct && !/^\d+[,.]?\d*\s*(estrela|star)/i.test(direct)) {
      return direct.replace(/^Foto de\s+/i, "");
    }

    const imgAlt = firstAttr(root, photoSelectors, "alt");
    return imgAlt.replace(/^Foto de\s+/i, "");
  };

  const cards = Array.from(new Set(reviewSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))));
  const reviews = cards
    .map((card) => {
      const text = firstText(card, textSelectors);
      const author = parseAuthor(card);
      const rating = parseRating(card);
      const relativeTime = firstText(card, timeSelectors);
      const photoUrl = firstAttr(card, photoSelectors, "src");

      return {
        author,
        rating,
        text,
        relativeTime,
        photoUrl,
        source: "google",
      };
    })
    .filter((review) => review.author && review.rating && (review.text || review.relativeTime));
  const blockedAuthors = new Set(["facebook", "google", "tripadvisor"]);
  const blockedText = /Sobre esses provedores|fornecedores s[aã]o listados|providers are listed/i;

  const seen = new Set();
  return reviews.filter((review) => {
    if (blockedAuthors.has(review.author.toLowerCase())) return false;
    if (blockedText.test(review.text)) return false;
    const key = `${review.author}|${review.rating}|${review.text.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function scrapeGoogleReviews({ url, output, maxScrolls, headed, manualWaitMs, profileDir }) {
  let browser;
  let context;

  if (headed) {
    await fs.mkdir(profileDir, { recursive: true });
    try {
      context = await chromium.launchPersistentContext(profileDir, {
        channel: "chrome",
        headless: false,
        viewport: { width: 1366, height: 900 },
        locale: "pt-BR",
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
      });
    } catch {
      context = await chromium.launchPersistentContext(profileDir, {
        headless: false,
        viewport: { width: 1366, height: 900 },
        locale: "pt-BR",
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
      });
    }
  } else {
    try {
      browser = await chromium.launch({
        channel: "chrome",
        headless: true,
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
      });
    } catch {
      browser = await chromium.launch({
        headless: true,
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
      });
    }
  }

  try {
    const page =
      context?.pages()[0] ||
      (context
        ? await context.newPage()
        : await browser.newPage({
            locale: "pt-BR",
            viewport: { width: 1366, height: 900 },
            userAgent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
          }));

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (manualWaitMs > 0) {
      console.warn(
        `[google-reviews] waiting ${Math.round(
          manualWaitMs / 1000,
        )}s for manual login/navigation. Open Reviews, then leave the browser open.`,
      );
      await sleep(manualWaitMs);
    }
    await prepareGooglePage(page, { headed });
    await scrollReviews(page, maxScrolls);

    const reviews = await page.evaluate(pageExtractionScript, {
      reviewSelectors: REVIEW_CARD_SELECTORS,
      textSelectors: TEXT_SELECTORS,
      authorSelectors: AUTHOR_SELECTORS,
      timeSelectors: TIME_SELECTORS,
      photoSelectors: PHOTO_SELECTORS,
    });

    const payload = {
      scrapedAt: new Date().toISOString(),
      sourceUrl: url,
      count: reviews.length,
      reviews,
    };

    if (reviews.length === 0 && arguments[0]?.debugDir) {
      await fs.mkdir(arguments[0].debugDir, { recursive: true });
      await page.screenshot({
        path: path.join(arguments[0].debugDir, "google-reviews-debug.png"),
        fullPage: true,
      });
      await fs.writeFile(
        path.join(arguments[0].debugDir, "google-reviews-debug.html"),
        await page.content(),
        "utf-8",
      );
      const labels = await page
        .locator("button, a, div[role='button']")
        .evaluateAll((elements) =>
          elements
            .map((element) => ({
              tag: element.tagName.toLowerCase(),
              role: element.getAttribute("role") || "",
              aria: element.getAttribute("aria-label") || "",
              text: (element.textContent || "").replace(/\s+/g, " ").trim(),
            }))
            .filter((item) => item.aria || item.text)
            .slice(0, 120),
        )
        .catch(() => []);
      await fs.writeFile(
        path.join(arguments[0].debugDir, "google-reviews-debug-elements.json"),
        `${JSON.stringify(labels, null, 2)}\n`,
        "utf-8",
      );
      console.warn(`[google-reviews] no reviews found; debug saved to ${arguments[0].debugDir}`);
    }

    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
    console.log(`[google-reviews] saved ${reviews.length} reviews to ${output}`);
    return payload;
  } finally {
    await context?.close();
    await browser?.close();
  }
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  scrapeGoogleReviews(parseArgs()).catch((error) => {
    console.error("[google-reviews] scrape failed", error);
    process.exitCode = 1;
  });
}

export { scrapeGoogleReviews };
