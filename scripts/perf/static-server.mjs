/**
 * static-server.mjs — Node HTTP server that faithfully mirrors public/.htaccess
 * rewrite semantics for local Lighthouse measurement.
 *
 * Exports:
 *   resolveRequest(distDir, urlPath) → { status, filePath, headers }
 *   startStaticServer({ distDir, port }) → http.Server
 *
 * Self-test: run `node scripts/perf/static-server.mjs` directly.
 */

import { createServer } from "node:http";
import { createGzip } from "node:zlib";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve as pathResolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// MIME types — includes avif/webp/ico that Node may not know
// ---------------------------------------------------------------------------
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

// Content types eligible for gzip (mirrors mod_deflate AddOutputFilterByType)
const GZIP_TYPES = new Set([
  "text/html",
  "text/css",
  "application/javascript",
  "application/json",
  "image/svg+xml",
  "text/plain",
]);

// Regex for hashed assets → immutable cache (mirrors .htaccess FilesMatch)
const HASHED_ASSET_RE =
  /-[A-Za-z0-9_-]{8,}\.(?:avif|webp|jpe?g|png|svg|css|m?js|woff2)$/;

// ---------------------------------------------------------------------------
// resolveRequest — pure decision tree (testable without a server)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ResolveResult
 * @property {number} status        HTTP status code
 * @property {string} filePath      Absolute path to the file on disk
 * @property {Record<string,string>} headers  Response headers
 */

/**
 * Resolve a URL path to a file on disk, mirroring public/.htaccess semantics.
 *
 * Decision tree (order matters — matches Apache rewrite evaluation):
 * 1. Path traversal blocked → 403
 * 2. /index.html → short-circuit (serve as-is, no rewrite)
 * 3. Exact file match in distDir → serve it
 * 4. Exact directory match in distDir → serve dir/index.html
 * 5. /<slug> or /<slug>/? → <slug>.html if it exists AND <slug> is NOT a
 *    directory in distDir (preserves dia-das-maes/, dia-dos-namorados/)
 * 6. SPA fallback → distDir/index.html
 *
 * @param {string} distDir  Absolute path to the build output directory
 * @param {string} urlPath  URL pathname (e.g. "/lirios-apt", "/lirios-apt/")
 * @returns {Promise<ResolveResult>}
 */
export async function resolveRequest(distDir, urlPath) {
  // Normalise: strip query/hash, decode, collapse ".."
  let raw = urlPath;
  const qIdx = raw.indexOf("?");
  if (qIdx !== -1) raw = raw.slice(0, qIdx);
  const hIdx = raw.indexOf("#");
  if (hIdx !== -1) raw = raw.slice(0, hIdx);

  raw = decodeURIComponent(raw);

  // Block path traversal — check raw decoded path BEFORE normalize(),
  // because normalize() on Windows collapses leading ../ that go above root.
  if (raw.includes("..")) {
    return { status: 403, filePath: "", headers: {} };
  }

  // Normalise path separators
  const normalized = normalize(raw).replace(/\\/g, "/");

  // Ensure leading slash
  const pathname = normalized.startsWith("/") ? normalized : `/${normalized}`;

  // Helper: absolute path inside distDir
  const distPath = (rel) => join(distDir, rel);

  // Helper: check if a relative path exists as a file
  const fileExists = async (rel) => {
    try {
      const s = await stat(distPath(rel));
      return s.isFile();
    } catch {
      return false;
    }
  };

  // Helper: check if a relative path exists as a directory
  const dirExists = async (rel) => {
    try {
      const s = await stat(distPath(rel));
      return s.isDirectory();
    } catch {
      return false;
    }
  };

  // Helper: build cache header for a resolved file path
  const cacheHeader = (fileRel) => {
    if (/\.html?$/.test(fileRel)) {
      return "no-cache";
    }
    if (HASHED_ASSET_RE.test(fileRel)) {
      return "public, max-age=31536000, immutable";
    }
    return undefined;
  };

  // --- Rule 1: /index.html short-circuit (RewriteRule ^index\.html$ - [L]) ---
  if (pathname === "/index.html") {
    if (await fileExists("index.html")) {
      return {
        status: 200,
        filePath: distPath("index.html"),
        headers: { "Cache-Control": "no-cache" },
      };
    }
    return { status: 404, filePath: "", headers: {} };
  }

  // --- Rule 2: Exact file match (RewriteCond %{REQUEST_FILENAME} -f) ---
  const fileRel = pathname.replace(/^\//, "");
  if (fileRel && (await fileExists(fileRel))) {
    const cc = cacheHeader(fileRel);
    const headers = {};
    if (cc) headers["Cache-Control"] = cc;
    return { status: 200, filePath: distPath(fileRel), headers };
  }

  // --- Rule 3: Exact directory match (RewriteCond %{REQUEST_FILENAME} -d) ---
  // e.g. /dia-das-maes/ → dist/dia-das-maes/index.html
  if (fileRel && (await dirExists(fileRel))) {
    const indexPath = `${fileRel.replace(/\/$/, "")}/index.html`;
    if (await fileExists(indexPath)) {
      return {
        status: 200,
        filePath: distPath(indexPath),
        headers: { "Cache-Control": "no-cache" },
      };
    }
  }

  // --- Rule 4: Slug → slug.html rewrite ---
  // ^([^/]+)/?$ → $1.html  (with !-f, !-d, and %{DOCUMENT_ROOT}/$1.html -f)
  const slugMatch = pathname.match(/^\/([^/]+)\/?$/);
  if (slugMatch) {
    const slug = slugMatch[1];
    // Only rewrite if slug is NOT a directory in dist (preserves dia-das-maes/ etc.)
    const slugIsDir = await dirExists(slug);
    if (!slugIsDir) {
      const slugHtml = `${slug}.html`;
      if (await fileExists(slugHtml)) {
        return {
          status: 200,
          filePath: distPath(slugHtml),
          headers: { "Cache-Control": "no-cache" },
        };
      }
    }
  }

  // --- Rule 5: SPA fallback (RewriteRule . /index.html [L]) ---
  if (await fileExists("index.html")) {
    return {
      status: 200,
      filePath: distPath("index.html"),
      headers: { "Cache-Control": "no-cache" },
    };
  }

  return { status: 404, filePath: "", headers: {} };
}

// ---------------------------------------------------------------------------
// startStaticServer — HTTP server wrapping resolveRequest
// ---------------------------------------------------------------------------

/**
 * Start a static file server that mirrors .htaccess rewrite semantics.
 *
 * @param {{ distDir: string, port: number }} opts
 * @returns {Promise<import("node:http").Server>}
 */
export function startStaticServer({ distDir, port }) {
  const absDist = pathResolve(distDir);

  const server = createServer(async (req, res) => {
    try {
      const { status, filePath, headers } = await resolveRequest(absDist, req.url ?? "/");

      if (status === 403) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (status === 404 || !filePath) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      // Determine MIME type
      const ext = extname(filePath).toLowerCase();
      const contentType = MIME[ext] ?? "application/octet-stream";

      // Read file
      const data = await readFile(filePath);

      // Decide whether to gzip
      const acceptEncoding = req.headers["accept-encoding"] ?? "";
      const shouldGzip =
        GZIP_TYPES.has(contentType) && acceptEncoding.includes("gzip");

      // Merge headers
      const responseHeaders = {
        "Content-Type": contentType,
        ...headers,
      };

      if (shouldGzip) {
        responseHeaders["Content-Encoding"] = "gzip";
        responseHeaders["Vary"] = "Accept-Encoding";
        res.writeHead(status, responseHeaders);

        const gzip = createGzip();
        gzip.pipe(res);
        gzip.end(data);
      } else {
        responseHeaders["Content-Length"] = String(data.length);
        res.writeHead(status, responseHeaders);
        res.end(data);
      }
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
      console.error("[static-server] error:", err);
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      console.log(`[static-server] serving ${absDist} on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// ---------------------------------------------------------------------------
// Self-test — run directly: node scripts/perf/static-server.mjs
// ---------------------------------------------------------------------------

async function selfTest() {
  const distDir = pathResolve(
    fileURLToPath(import.meta.url),
    "../../../dist",
  );

  // Verify dist/ exists
  try {
    await stat(distDir);
  } catch {
    console.error("[self-test] dist/ not found. Run `npm run build` first.");
    process.exit(1);
  }

  console.log("[self-test] resolveRequest matrix:\n");

  const cases = [
    // [urlPath, expectedStatus, description]
    ["/lirios-apt", 200, "slug without trailing slash → lirios-apt.html"],
    ["/lirios-apt/", 200, "slug with trailing slash → lirios-apt.html"],
    ["/lirios-apt?utm_source=meta", 200, "slug with query string preserved"],
    ["/urgencia", 200, "another slug → urgencia.html"],
    ["/presente-hoje", 200, "another slug → presente-hoje.html"],
    ["/rota-inexistente", 200, "unknown route → SPA fallback (index.html)"],
    ["/dia-das-maes/", 200, "directory entry → dia-das-maes/index.html (NOT slug rewrite)"],
    ["/dia-dos-namorados/", 200, "directory entry → dia-dos-namorados/index.html"],
    ["/favicon.ico", 200, "static file → favicon.ico"],
    ["/lpb/google-reviews.json", 200, "nested static file → google-reviews.json"],
    ["/index.html", 200, "index.html short-circuit"],
    ["/../../../etc/passwd", 403, "path traversal blocked"],
  ];

  let passed = 0;
  let failed = 0;

  for (const [urlPath, expectedStatus, desc] of cases) {
    const { status, filePath } = await resolveRequest(distDir, urlPath);
    const ok = status === expectedStatus;
    const marker = ok ? "✓" : "✗";
    console.log(`  ${marker} ${desc}`);
    console.log(`    GET ${urlPath} → ${status} ${filePath ? filePath.replace(distDir, "dist") : "(none)"}`);
    if (!ok) {
      console.error(`    EXPECTED ${expectedStatus}, got ${status}`);
      failed++;
    } else {
      passed++;
    }
  }

  // Additional: verify cache headers
  console.log("\n[self-test] cache header checks:\n");

  const cacheCases = [
    ["/lirios-apt", "no-cache", "HTML → no-cache"],
    ["/assets/AdLandingPage-BTLMTZ9m.js", "public, max-age=31536000, immutable", "hashed JS → immutable"],
    ["/assets/AdLandingPage-d5emvcEP.css", "public, max-age=31536000, immutable", "hashed CSS → immutable"],
    ["/assets/playfair-display-latin-700-normal-CuDiGg7c.woff2", "public, max-age=31536000, immutable", "hashed woff2 → immutable"],
    ["/assets/fachada-480-C2B8plS-.avif", "public, max-age=31536000, immutable", "hashed avif → immutable"],
  ];

  for (const [urlPath, expectedCC, desc] of cacheCases) {
    const { headers } = await resolveRequest(distDir, urlPath);
    const actualCC = headers["Cache-Control"] ?? "(none)";
    const ok = actualCC === expectedCC;
    const marker = ok ? "✓" : "✗";
    console.log(`  ${marker} ${desc}`);
    console.log(`    Cache-Control: ${actualCC}`);
    if (!ok) {
      console.error(`    EXPECTED "${expectedCC}", got "${actualCC}"`);
      failed++;
    } else {
      passed++;
    }
  }

  // Start server briefly and make real HTTP requests
  console.log("\n[self-test] live server checks:\n");

  const server = await startStaticServer({ distDir, port: 4179 });

  const httpCases = [
    { path: "/lirios-apt", expectStatus: 200, expectCC: "no-cache", desc: "GET /lirios-apt → 200, no-cache" },
    { path: "/lirios-apt/", expectStatus: 200, expectCC: "no-cache", desc: "GET /lirios-apt/ → 200, no-cache" },
    { path: "/rota-inexistente", expectStatus: 200, expectCC: "no-cache", desc: "GET /rota-inexistente → 200 (SPA fallback)" },
    { path: "/dia-das-maes/", expectStatus: 200, expectCC: "no-cache", desc: "GET /dia-das-maes/ → 200 (directory index)" },
    { path: "/assets/AdLandingPage-BTLMTZ9m.js", expectStatus: 200, expectCC: "public, max-age=31536000, immutable", desc: "GET /assets/hashed.js → 200, immutable" },
    { path: "/assets/AdLandingPage-d5emvcEP.css", expectStatus: 200, expectCC: "public, max-age=31536000, immutable", desc: "GET /assets/hashed.css → 200, immutable" },
    { path: "/favicon.ico", expectStatus: 200, desc: "GET /favicon.ico → 200" },
  ];

  for (const { path, expectStatus, expectCC, desc } of httpCases) {
    try {
      const res = await fetch(`http://127.0.0.1:4179${path}`, { redirect: "manual" });
      const cc = res.headers.get("cache-control") ?? "(none)";
      const ce = res.headers.get("content-encoding") ?? "(none)";
      const statusOk = res.status === expectStatus;
      const ccOk = !expectCC || cc === expectCC;
      const ok = statusOk && ccOk;
      const marker = ok ? "✓" : "✗";
      console.log(`  ${marker} ${desc}`);
      console.log(`    status=${res.status} cc=${cc} ce=${ce}`);
      if (!statusOk) {
        console.error(`    EXPECTED status ${expectStatus}, got ${res.status}`);
        failed++;
      } else if (!ccOk) {
        console.error(`    EXPECTED cc "${expectCC}", got "${cc}"`);
        failed++;
      } else {
        passed++;
      }
    } catch (err) {
      console.error(`  ✗ ${desc} — fetch error: ${err.message}`);
      failed++;
    }
  }

  // Verify gzip on HTML
  try {
    const res = await fetch("http://127.0.0.1:4179/lirios-apt", {
      headers: { "Accept-Encoding": "gzip" },
    });
    const ce = res.headers.get("content-encoding") ?? "(none)";
    const ok = ce === "gzip";
    const marker = ok ? "✓" : "✗";
    console.log(`  ${marker} HTML served with gzip (Content-Encoding: ${ce})`);
    if (ok) passed++;
    else { console.error("    EXPECTED gzip encoding"); failed++; }
  } catch (err) {
    console.error(`  ✗ gzip check — fetch error: ${err.message}`);
    failed++;
  }

  // Close server and wait for it to fully shut down
  server.close();
  // Give pending connections a moment to drain on Windows
  await new Promise((r) => setTimeout(r, 100));

  console.log(`\n[self-test] ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// Run self-test when invoked directly with no arguments
const currentFile = fileURLToPath(import.meta.url);
const invokedFile = fileURLToPath(`file://${process.argv[1]?.replace(/\\/g, "/") ?? ""}`);
const isDirectInvocation = currentFile === invokedFile
  || process.argv[1]?.replace(/\\/g, "/").endsWith("static-server.mjs");
const hasNoArgs = process.argv.length <= 2;

if (isDirectInvocation && hasNoArgs) {
  selfTest();
} else if (isDirectInvocation && process.argv.length >= 4) {
  // CLI mode: node scripts/perf/static-server.mjs <distDir> <port>
  const distDir = process.argv[2];
  const port = parseInt(process.argv[3], 10);
  if (isNaN(port)) {
    console.error("Usage: node static-server.mjs <distDir> <port>");
    process.exit(1);
  }
  startStaticServer({ distDir, port });
}