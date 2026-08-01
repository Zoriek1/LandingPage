import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const inspectorPath = new URL("./inspect-ad-bundle.mjs", import.meta.url);
assert.ok(existsSync(inspectorPath), "bundle inspector module should exist");
const { inspectAdBundle } = await import(inspectorPath.href);

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
