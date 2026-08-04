// @vitest-environment node
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { resolveRequest } from "../../scripts/perf/static-server.mjs";
import { AD_LP_SLUGS } from "@/routes/routeManifest";

const distDir = path.resolve(process.cwd(), "dist");
const hasDist = existsSync(distDir);

describe.skipIf(!hasDist)("ad landing route matrix (faithful .htaccess mirror)", () => {
  type Case = {
    path: string;
    status: number;
    fileSuffix?: string;
    cacheControl?: string;
    desc: string;
  };

  const cases: Case[] = [
    // Slug rewrite — no slash
    { path: "/lirios-apt", status: 200, fileSuffix: "lirios-apt.html", cacheControl: "no-cache", desc: "slug no slash → lirios-apt.html" },
    // Slug rewrite — with slash
    { path: "/lirios-apt/", status: 200, fileSuffix: "lirios-apt.html", cacheControl: "no-cache", desc: "slug with slash → lirios-apt.html" },
    // Query string preserved (UTMs)
    { path: "/lirios-apt?utm_source=meta", status: 200, fileSuffix: "lirios-apt.html", desc: "UTM preserved" },
    { path: "/urgencia?gclid=teste", status: 200, fileSuffix: "urgencia.html", desc: "gclid preserved" },
    // Other conversion slugs
    { path: "/presente-hoje", status: 200, fileSuffix: "presente-hoje.html", desc: "presente-hoje" },
    { path: "/aniversario", status: 200, fileSuffix: "aniversario.html", desc: "aniversario" },
    { path: "/rosas-apt", status: 200, fileSuffix: "rosas-apt.html", desc: "rosas-apt" },
    { path: "/carro-low", status: 200, fileSuffix: "carro-low.html", desc: "carro-low" },
    { path: "/carro-high", status: 200, fileSuffix: "carro-high.html", desc: "carro-high" },
    { path: "/sem-erro", status: 200, fileSuffix: "sem-erro.html", desc: "sem-erro" },
    { path: "/tradicao-comprovacao", status: 200, fileSuffix: "tradicao-comprovacao.html", desc: "tradicao-comprovacao" },
    { path: "/qual-b", status: 200, fileSuffix: "qual-b.html", desc: "qual-b" },
    // Directory entries — must NOT be rewritten to .html
    { path: "/dia-das-maes/", status: 200, fileSuffix: "dia-das-maes/index.html", cacheControl: "no-cache", desc: "dia-das-maes directory entry" },
    { path: "/dia-dos-namorados/", status: 200, fileSuffix: "dia-dos-namorados/index.html", cacheControl: "no-cache", desc: "dia-dos-namorados directory entry" },
    // SPA fallback
    { path: "/rota-inexistente", status: 200, fileSuffix: "index.html", cacheControl: "no-cache", desc: "SPA fallback root" },
    { path: "/rota/inexistente/profunda", status: 200, fileSuffix: "index.html", cacheControl: "no-cache", desc: "SPA fallback deep" },
    // Static files
    { path: "/favicon.ico", status: 200, fileSuffix: "favicon.ico", desc: "favicon" },
    { path: "/lpb/google-reviews.json", status: 200, fileSuffix: "google-reviews.json", desc: "google reviews json" },
    { path: "/index.html", status: 200, fileSuffix: "index.html", desc: "index.html short-circuit" },
    // Path traversal blocked
    { path: "/../../../etc/passwd", status: 403, desc: "path traversal blocked (raw)" },
    { path: "/%2e%2e/etc/passwd", status: 403, desc: "path traversal blocked (encoded)" },
  ];

  for (const c of cases) {
    it(c.desc, async () => {
      const result = await resolveRequest(distDir, c.path);
      expect(result.status, `${c.desc}: status`).toBe(c.status);
      const normalizedPath = result.filePath.replace(/\\/g, "/");
      if (c.fileSuffix) {
        expect(
          normalizedPath.endsWith(c.fileSuffix),
          `${c.desc}: filePath ends with ${c.fileSuffix} (got ${normalizedPath})`,
        ).toBe(true);
      }
      if (c.cacheControl) {
        expect(
          result.headers["Cache-Control"],
          `${c.desc}: Cache-Control`,
        ).toBe(c.cacheControl);
      }
    });
  }

  // Hashed asset — immutable
  it("hashed asset gets immutable cache", async () => {
    const cssPath = path.join(distDir, "assets");
    const cssFiles = existsSync(cssPath)
      ? readdirSync(cssPath).filter((f: string) => f.endsWith(".css"))
      : [];
    if (!cssFiles.length) {
      return; // skip silently if no hashed CSS in this build
    }
    const hashed = cssFiles[0];
    const r = await resolveRequest(distDir, `/assets/${hashed}`);
    expect(r.status).toBe(200);
    expect(r.headers["Cache-Control"]).toBe("public, max-age=31536000, immutable");
  });

  // Full AD_LP_SLUGS sweep — every slug in the manifest is served correctly.
  it("every AD_LP_SLUGS manifest entry resolves (directory entries are directories, others are .html)", async () => {
    const ownEntries = new Set(["dia-das-maes", "dia-dos-namorados"]);
    for (const slug of AD_LP_SLUGS) {
      const r = await resolveRequest(distDir, `/${slug}`);
      const normalizedPath = r.filePath.replace(/\\/g, "/");
      expect(r.status, `/${slug}: status`).toBe(200);
      if (ownEntries.has(slug)) {
        expect(
          normalizedPath.endsWith(`${slug}/index.html`),
          `/${slug}: must resolve to directory index, not ${slug}.html (got ${normalizedPath})`,
        ).toBe(true);
      } else {
        expect(
          normalizedPath.endsWith(`${slug}.html`),
          `/${slug}: must resolve to ${slug}.html (got ${normalizedPath})`,
        ).toBe(true);
      }
    }
  });
});

describe.skipIf(!hasDist)("smoke: resolveRequest is callable from Node test runner", () => {
  it("imports and is a function", () => {
    expect(typeof resolveRequest).toBe("function");
  });
});
