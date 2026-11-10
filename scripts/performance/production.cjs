const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({
        viewport,
        deviceScaleFactor: viewport.width < 800 ? 2 : 1,
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("http://127.0.0.1:4187/alive/");
      await page.locator("#resume").click();
      await page.waitForTimeout(6000);
      const canvas = await page.locator("canvas").boundingBox();
      assert.ok(canvas.width > 0 && canvas.height > 0);
      await page.screenshot({
        path: `results/performance/production-${viewport.width}.png`,
      });
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(500);
      await page.keyboard.up("ArrowRight");
      await page.locator("#menu").click();
      assert.ok(await page.locator("#pause-resume").isVisible());
      await page.screenshot({
        path: `results/performance/production-${viewport.width}-paused.png`,
      });
      await page.locator("#pause-resume").click();
      await page.waitForTimeout(500);
      assert.equal(await page.locator("#pause-resume").count(), 0);
      await page.reload();
      await page.locator("#resume").click();
      await page.waitForTimeout(3000);
      assert.deepEqual(errors, []);
      results.push({ viewport, canvas, errors, browser: browser.version() });
      await page.close();
    }
    fs.writeFileSync(
      "results/performance/production.json",
      JSON.stringify(results, null, 2)
    );
    console.log(results);
  } finally {
    await browser.close();
  }
})();
