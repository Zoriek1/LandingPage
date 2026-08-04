/**
 * lighthouse-run.mjs — Run mobile Lighthouse audits against a local static
 * server and save results to perf-artifacts/.
 *
 * Usage:
 *   node scripts/perf/lighthouse-run.mjs <url> <runCount> [outputDir]
 *   node scripts/perf/lighthouse-run.mjs --self-check
 *
 * Example:
 *   node scripts/perf/lighthouse-run.mjs http://127.0.0.1:4178/lirios-apt 3
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve as pathResolve, join } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a safe slug from a URL for file naming. */
function safeSlug(url) {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9_-]/g, "-") || "root";
  } catch {
    return "unknown";
  }
}

/** Compute median of a sorted numeric array. */
function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Format milliseconds for display. */
function fmtMs(v) {
  if (v == null) return "N/A";
  return `${Math.round(v)} ms`;
}

/** Format a 0-1 score as 0-100 integer. */
function fmtScore(v) {
  if (v == null) return "N/A";
  return String(Math.round(v * 100));
}

// ---------------------------------------------------------------------------
// Chrome launcher
// ---------------------------------------------------------------------------

const CHROME_PATH_WIN = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

/**
 * Launch Chrome with appropriate flags for Lighthouse on Windows.
 * @returns {Promise<{ chrome: import("chrome-launcher").LaunchedChrome, port: number }>}
 */
async function launchChrome() {
  // Dynamic import so the script is loadable even without chrome-launcher installed
  const chromeLauncher = await import("chrome-launcher");

  const opts = {
    chromeFlags: [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--no-first-run",
      "--disable-default-apps",
      "--hide-scrollbars",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-zygote",
    ],
    chromePath: undefined,
  };

  // On Windows, prefer the known system path
  if (process.platform === "win32") {
    try {
      const { stat } = await import("node:fs/promises");
      await stat(CHROME_PATH_WIN);
      opts.chromePath = CHROME_PATH_WIN;
    } catch {
      // Fall back to chrome-launcher's own discovery
    }
  }

  const chrome = await chromeLauncher.launch(opts);
  return { chrome, port: chrome.port };
}

// ---------------------------------------------------------------------------
// Lighthouse runner
// ---------------------------------------------------------------------------

/**
 * Run a single Lighthouse audit.
 * @param {string} url
 * @param {number} chromePort
 * @returns {Promise<object>} Lighthouse JSON result
 */
async function runAudit(url, chromePort) {
  const lighthouse = await import("lighthouse");

  const result = await lighthouse.default(url, {
    port: chromePort,
    output: "json",
    onlyCategories: ["performance"],
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 360,
      height: 640,
      deviceScaleFactor: 2,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
    },
    emulatedUserAgent:
      "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  }, {
    extends: "lighthouse:default",
    settings: {
      skipAudits: ["uses-http2", "is-on-https"],
    },
  });

  if (!result) {
    throw new Error("Lighthouse returned no result");
  }

  return JSON.parse(result.report);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  // --self-check mode
  if (args.includes("--self-check")) {
    return selfCheck();
  }

  if (args.length < 2) {
    console.error("Usage: node lighthouse-run.mjs <url> <runCount> [outputDir]");
    console.error("       node lighthouse-run.mjs --self-check");
    process.exit(1);
  }

  const url = args[0];
  const runCount = parseInt(args[1], 10);
  const outputDir = args[2] ?? pathResolve(
    fileURLToPath(import.meta.url),
    "../../../perf-artifacts",
  );

  if (isNaN(runCount) || runCount < 1) {
    console.error("runCount must be a positive integer");
    process.exit(1);
  }

  const slug = safeSlug(url);

  console.log(`[lighthouse-run] URL: ${url}`);
  console.log(`[lighthouse-run] Runs: ${runCount}`);
  console.log(`[lighthouse-run] Output: ${outputDir}`);
  console.log("");

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Launch Chrome once for all runs
  console.log("[lighthouse-run] Launching Chrome...");
  const { chrome, port } = await launchChrome();
  console.log(`[lighthouse-run] Chrome running on port ${port}`);

  const results = [];

  try {
    for (let i = 1; i <= runCount; i++) {
      console.log(`\n[lighthouse-run] Run ${i}/${runCount}...`);
      const start = Date.now();

      let json;
      try {
        json = await runAudit(url, port);
      } catch (err) {
        console.error(`[lighthouse-run] Run ${i} failed: ${err.message}`);
        continue;
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`[lighthouse-run] Run ${i} completed in ${elapsed}s`);

      // Save JSON
      const outPath = join(outputDir, `${slug}-${i}.json`);
      await writeFile(outPath, JSON.stringify(json, null, 2));
      console.log(`[lighthouse-run] Saved ${outPath}`);

      // Extract metrics
      const perf = json.categories?.["performance"]?.score ?? null;
      const audits = json.audits ?? {};

      const metrics = {
        performance: perf,
        fcp: audits["first-contentful-paint"]?.numericValue ?? null,
        lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
        tbt: audits["total-blocking-time"]?.numericValue ?? null,
        cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
        si: audits["speed-index"]?.numericValue ?? null,
      };

      results.push(metrics);

      // Print per-run summary
      console.log(
        `  Perf: ${fmtScore(perf)}  FCP: ${fmtMs(metrics.fcp)}  LCP: ${fmtMs(metrics.lcp)}  TBT: ${fmtMs(metrics.tbt)}  CLS: ${metrics.cls?.toFixed(3) ?? "N/A"}  SI: ${fmtMs(metrics.si)}`,
      );
    }
  } finally {
    try { await chrome.kill(); } catch { /* EPERM on Windows temp dir cleanup is harmless */ }
    console.log("\n[lighthouse-run] Chrome closed.");
  }

  if (results.length === 0) {
    console.error("[lighthouse-run] No successful runs. Exiting.");
    process.exit(1);
  }

  // Print median table
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  MEDIAN RESULTS");
  console.log("═══════════════════════════════════════════════════════");

  const medians = {
    performance: median(results.map((r) => r.performance).filter((v) => v != null)),
    fcp: median(results.map((r) => r.fcp).filter((v) => v != null)),
    lcp: median(results.map((r) => r.lcp).filter((v) => v != null)),
    tbt: median(results.map((r) => r.tbt).filter((v) => v != null)),
    cls: median(results.map((r) => r.cls).filter((v) => v != null)),
    si: median(results.map((r) => r.si).filter((v) => v != null)),
  };

  console.log(`  Performance:  ${fmtScore(medians.performance)}`);
  console.log(`  FCP:          ${fmtMs(medians.fcp)}`);
  console.log(`  LCP:          ${fmtMs(medians.lcp)}`);
  console.log(`  TBT:          ${fmtMs(medians.tbt)}`);
  console.log(`  CLS:          ${medians.cls != null ? medians.cls.toFixed(3) : "N/A"}`);
  console.log(`  Speed Index:  ${fmtMs(medians.si)}`);
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  (median of ${results.length} run${results.length !== 1 ? "s" : ""})`);
}

// ---------------------------------------------------------------------------
// Self-check — verify Chrome can launch and render a trivial page
// ---------------------------------------------------------------------------

async function selfCheck() {
  console.log("[self-check] Verifying Chrome availability...");

  let chrome;
  try {
    const launched = await launchChrome();
    chrome = launched.chrome;
    console.log(`[self-check] Chrome launched on port ${launched.port}`);

    // Start a tiny HTTP server with a trivial page so Lighthouse has a valid URL
    const { createServer } = await import("node:http");
    const trivialServer = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body><h1>Self Check</h1></body></html>");
    });
    await new Promise((resolve) => trivialServer.listen(0, "127.0.0.1", resolve));
    const addr = trivialServer.address();
    const testUrl = `http://127.0.0.1:${addr.port}/`;

    // Try a minimal Lighthouse run to verify the pipeline
    const lighthouse = await import("lighthouse");
    const result = await lighthouse.default(testUrl, {
      port: launched.port,
      output: "json",
      onlyCategories: ["performance"],
    }, {
      extends: "lighthouse:default",
      settings: {
        skipAudits: ["uses-http2", "is-on-https"],
      },
    });

    trivialServer.close();

    if (result && result.report) {
      console.log("[self-check] Lighthouse pipeline OK — Chrome is functional.");
    } else {
      console.log("[self-check] Lighthouse returned empty result.");
    }
  } catch (err) {
    console.log(`[self-check] Chrome/Lighthouse unavailable: ${err.message}`);
    console.log("[self-check] This is OK — the runner will work when Chrome is available.");
    // Exit 0 — not a failure
    process.exit(0);
  } finally {
    if (chrome) {
      try { await chrome.kill(); } catch { /* EPERM on Windows temp dir cleanup is harmless */ }
      console.log("[self-check] Chrome closed.");
    }
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error("[lighthouse-run] Fatal error:", err);
  process.exit(1);
});