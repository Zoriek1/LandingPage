import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const inspectorPath = new URL("./inspect-ad-bundle.mjs", import.meta.url);
assert.ok(existsSync(inspectorPath), "bundle inspector module should exist");
const { inspectAdBundle, inspectAdPreload, inspectPrerenderedContent } = await import(
  inspectorPath.href
);

function makeDist(manifest) {
  const distDir = mkdtempSync(join(tmpdir(), "ad-bundle-inspector-"));
  mkdirSync(join(distDir, ".vite"), { recursive: true });
  mkdirSync(join(distDir, "assets"), { recursive: true });
  writeFileSync(join(distDir, ".vite", "manifest.json"), JSON.stringify(manifest));
  for (const chunk of Object.values(manifest)) {
    writeFileSync(join(distDir, chunk.file), "export{};");
  }
  return distDir;
}

const validManifest = {
  "src/features/ad-lps/AdLandingPage.tsx": {
    file: "assets/AdLandingPage-good.js",
    name: "AdLandingPage",
    src: "src/features/ad-lps/AdLandingPage.tsx",
    isDynamicEntry: true,
    imports: ["_react-vendor.js", "_radix-dialog.js"],
  },
  "_react-vendor.js": {
    file: "assets/react-vendor-good.js",
    name: "react-vendor",
  },
  "_radix-dialog.js": {
    file: "assets/radix-dialog-good.js",
    name: "radix-dialog",
    imports: ["_react-vendor.js"],
  },
};

test("accepts an isolated ad chunk graph", () => {
  const distDir = makeDist(validManifest);
  try {
    const result = inspectAdBundle({ distDir });
    assert.deepEqual(result.files.sort(), [
      "assets/AdLandingPage-good.js",
      "assets/radix-dialog-good.js",
      "assets/react-vendor-good.js",
    ]);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("accepts an index.html that preloads the ad chunk", () => {
  const distDir = makeDist(validManifest);
  try {
    writeFileSync(
      join(distDir, "index.html"),
      '<link rel="modulepreload" crossorigin href="/assets/AdLandingPage-good.js">',
    );
    const result = inspectAdPreload({ distDir, adChunkFile: "assets/AdLandingPage-good.js" });
    assert.equal(result.adChunkFile, "assets/AdLandingPage-good.js");
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("rejects an index.html that leaves the ad chunk to a second round trip", () => {
  const distDir = makeDist(validManifest);
  try {
    writeFileSync(join(distDir, "index.html"), "<head></head>");
    assert.throws(
      () => inspectAdPreload({ distDir, adChunkFile: "assets/AdLandingPage-good.js" }),
      /não pré-carrega o chunk/,
    );
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("rejects Framer Motion in the emitted ad dependency graph", () => {
  const manifest = structuredClone(validManifest);
  manifest["src/features/ad-lps/AdLandingPage.tsx"].imports.push("_motion.js");
  manifest["_motion.js"] = { file: "assets/motion-bad.js", name: "motion" };
  const distDir = makeDist(manifest);
  try {
    assert.throws(() => inspectAdBundle({ distDir }), /Framer Motion/);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("rejects home providers in the emitted ad dependency graph", () => {
  const manifest = structuredClone(validManifest);
  manifest["src/features/ad-lps/AdLandingPage.tsx"].imports.push("_query.js");
  manifest["_query.js"] = { file: "assets/query-bad.js", name: "query" };
  const distDir = makeDist(manifest);
  try {
    assert.throws(() => inspectAdBundle({ distDir }), /home provider/);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("rejects home content in the emitted ad dependency graph", () => {
  const manifest = structuredClone(validManifest);
  manifest["src/features/ad-lps/AdLandingPage.tsx"].dynamicImports = [
    "src/routes/HomeRoute.tsx",
  ];
  manifest["src/routes/HomeRoute.tsx"] = {
    file: "assets/HomeRoute-bad.js",
    name: "HomeRoute",
    src: "src/routes/HomeRoute.tsx",
  };
  const distDir = makeDist(manifest);
  try {
    assert.throws(() => inspectAdBundle({ distDir }), /home content/);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

const validEntryClientManifest = {
  "src/features/ad-lps/entry-client.tsx": {
    file: "assets/entryClient-good.js",
    name: "entryClient",
    src: "src/features/ad-lps/entry-client.tsx",
    isEntry: true,
    imports: ["_react-vendor.js", "_radix-dialog.js"],
  },
  "_react-vendor.js": {
    file: "assets/react-vendor-good.js",
    name: "react-vendor",
  },
  "_radix-dialog.js": {
    file: "assets/radix-dialog-good.js",
    name: "radix-dialog",
    imports: ["_react-vendor.js"],
  },
};

test("accepts an isolated entry-client chunk graph", () => {
  const distDir = makeDist(validEntryClientManifest);
  try {
    const result = inspectAdBundle({
      distDir,
      entrySource: "src/features/ad-lps/entry-client.tsx",
    });
    assert.deepEqual(result.files.sort(), [
      "assets/entryClient-good.js",
      "assets/radix-dialog-good.js",
      "assets/react-vendor-good.js",
    ]);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("rejects Framer Motion reachable from the entry-client chunk", () => {
  const manifest = structuredClone(validEntryClientManifest);
  manifest["src/features/ad-lps/entry-client.tsx"].imports.push("_motion.js");
  manifest["_motion.js"] = { file: "assets/motion-bad.js", name: "motion" };
  const distDir = makeDist(manifest);
  try {
    assert.throws(
      () => inspectAdBundle({ distDir, entrySource: "src/features/ad-lps/entry-client.tsx" }),
      /Framer Motion/,
    );
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

function writeSlugHtml(distDir, fileName, { rootInner = "", hasHeadline = true, hasHero = true } = {}) {
  const h1 = hasHeadline ? "<h1>Lírios a partir de R$ 159,90.</h1>" : "";
  const hero = hasHero ? '<img data-testid="ad-lp-hero-image" src="/assets/hero.avif" />' : "";
  writeFileSync(
    join(distDir, fileName),
    `<!doctype html><html><body><div id="root">${rootInner || `${h1}${hero}`}</div></body></html>`,
  );
}

test("accepts prerendered HTML with hero content in the root div", () => {
  const distDir = mkdtempSync(join(tmpdir(), "ad-bundle-inspector-"));
  try {
    writeSlugHtml(distDir, "lirios-apt.html");
    writeFileSync(join(distDir, "index.html"), "<html><body><div id=\"root\"></div></body></html>");
    const result = inspectPrerenderedContent({ distDir });
    assert.deepEqual(result.files, ["lirios-apt.html"]);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("rejects a slug HTML whose root div is still empty", () => {
  const distDir = mkdtempSync(join(tmpdir(), "ad-bundle-inspector-"));
  try {
    writeSlugHtml(distDir, "lirios-apt.html", { rootInner: "" });
    writeFileSync(join(distDir, "lirios-apt.html"), '<div id="root"></div>');
    assert.throws(() => inspectPrerenderedContent({ distDir }), /está vazia/);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("rejects a slug HTML missing the H1", () => {
  const distDir = mkdtempSync(join(tmpdir(), "ad-bundle-inspector-"));
  try {
    writeSlugHtml(distDir, "lirios-apt.html", { hasHeadline: false });
    assert.throws(() => inspectPrerenderedContent({ distDir }), /<h1>/);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test("rejects a slug HTML missing the hero image", () => {
  const distDir = mkdtempSync(join(tmpdir(), "ad-bundle-inspector-"));
  try {
    writeSlugHtml(distDir, "lirios-apt.html", { hasHero: false });
    assert.throws(() => inspectPrerenderedContent({ distDir }), /hero image ausente/);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});
