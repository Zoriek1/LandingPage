async (page) => {
  const errors = [];
  let leads = 0;
  let distanceRequests = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*googletagmanager.com/**", (route) => route.abort());
  await page.route("**/*facebook.net/**", (route) => route.abort());
  await page.route("**/api/leads/**", (route) => { leads++; return route.abort(); });
  await page.route("**/api/landing/distancia-loja", (route) => {
    distanceRequests++;
    return route.fulfill({ json: { success: true, distancia_km: 4.2, duracao_min: 12, provider: "google_routes" } });
  });
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: -16.7, longitude: -49.2 });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:4179/loja-fisica/");
  await page.evaluate(() => document.fonts.ready);
  if (distanceRequests) throw new Error("Location requested before click");
  await page.locator("#locate-me").click();
  await page.waitForFunction(() => document.querySelector("#location-result").textContent.includes("4,2 km"));
  if (distanceRequests !== 1) throw new Error("Wrong distance request count");
  const href = await page.locator('[data-location="hero"][data-provider="google_maps"]').getAttribute("href");
  if (href.includes("origin=")) throw new Error("Coordinates exposed to generic outbound analytics");
  const opened = await page.evaluate(() => {
    const urls = [];
    window.open = (url) => { urls.push(String(url)); return null; };
    const link = document.querySelector('[data-location="hero"][data-provider="google_maps"]');
    link.addEventListener("click", (e) => e.preventDefault(), { capture: true });
    link.click();
    return urls;
  });
  if (!opened[0]?.includes("origin=-16.7%2C-49.2")) throw new Error("Authorized navigation origin missing");
  const conversion = await page.evaluate(() => window.dataLayer.find((item) => item.event === "store_directions_click"));
  if (!conversion || JSON.stringify(conversion).includes("-16.7")) throw new Error("Missing/private conversion payload");
  await page.unroute("**/api/landing/distancia-loja");
  await page.route("**/api/landing/distancia-loja", (route) => route.fulfill({ status: 503, json: { success: false } }));
  await page.locator("#locate-me").click();
  await page.waitForFunction(() => document.querySelector("#location-result").textContent.includes("Não foi possível"));
  if (await page.locator("#locate-me").isDisabled()) throw new Error("Retry blocked");
  await page.context().clearPermissions();
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (_success, error) => error({ code: 1 });
  });
  await page.locator("#locate-me").click();
  await page.waitForFunction(() => document.querySelector("#location-result").textContent.includes("não autorizou"));

  // Reload for clean visual evidence, without success/error fixture copy.
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  const layouts = [];
  for (const [width, height, name] of [[1280, 900, "desktop"], [375, 812, "mobile"], [768, 1024, "tablet"]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      smallTargets: Array.from(document.querySelectorAll("a,button")).filter((el) => el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().height < 48).map((el) => el.textContent.trim()),
      stickyVisible: getComputedStyle(document.querySelector(".mobile-actions")).display !== "none",
      imageLoaded: document.querySelector("picture img").complete && document.querySelector("picture img").naturalWidth > 0,
    }));
    if (layout.scrollWidth > width || layout.smallTargets.length || !layout.imageLoaded || layout.stickyVisible !== (width < 768)) throw new Error(JSON.stringify(layout));
    layouts.push(layout);
    await page.screenshot({ path: `.impeccable/review/${name}.png`, fullPage: true });
  }
  if (errors.length || leads) throw new Error(JSON.stringify({ errors, leads }));
  return { layouts, errors, leads, conversion, distance: "success, failure and permission denial verified" };
}
