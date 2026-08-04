import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SHOTS = join("tests", "e2e", "__screenshots__");

test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

test.describe("ad landing first paint", () => {
  test("hero paints with no JS (CTA is a real anchor)", async ({ browser }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 360, height: 640 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto("/lirios-apt", { waitUntil: "domcontentloaded" });
    await page.screenshot({
      path: join(SHOTS, "no-js-mobile.png"),
      fullPage: false,
    });

    // CTA is a real <a> anchor even with JS disabled
    const cta = page.locator('[data-testid="ad-lp-cta-hero"]');
    await expect(cta).toBeVisible();
    const tagName = await cta.evaluate((el) => el.tagName);
    const href = await cta.getAttribute("href");
    expect(tagName).toBe("A");
    expect(href).toContain("wa.me/5562996503403");

    // CTA label is in the SSR HTML even with JS off
    await expect(cta).toContainText(/Comprar no WhatsApp|Falar no WhatsApp/i);

    // The brand bar (logo area) is present
    await expect(page.locator(".ad-lp-brand-bar")).toBeVisible();

    await ctx.close();
  });

  test("hydration filmstrip (JS enabled)", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 360, height: 640 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    const navStart = Date.now();
    await page.goto("/lirios-apt", { waitUntil: "domcontentloaded" });
    const t0 = Date.now() - navStart;
    console.log("domcontentloaded at", t0, "ms");

    // Filmstrip: capture viewport at key hydration milestones
    for (const t of [100, 250, 500, 1000]) {
      await page.waitForTimeout(Math.max(0, t - (Date.now() - navStart)));
      await page.screenshot({
        path: join(SHOTS, `filmstrip-${t}ms.png`),
        fullPage: false,
      });
    }

    // Wait for hydration to settle
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: join(SHOTS, "js-mobile.png"),
      fullPage: false,
    });

    // Post-hydration: brand bar still visible
    await expect(page.locator(".ad-lp-brand-bar")).toBeVisible();

    // Post-hydration: the Suspense placeholder should be gone
    // (replaced by the loaded PriceRangeSelector which renders nothing when closed)
    await expect(page.locator(".ad-lp-price-selector-placeholder")).toHaveCount(0);

    // Post-hydration: click CTA → opens the price-range dialog (lazy chunk loaded)
    const cta = page.locator('[data-testid="ad-lp-cta-hero"]');
    await cta.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });

    await ctx.close();
  });
});
