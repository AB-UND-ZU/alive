const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const rows = [];
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const stage of process.argv.slice(2)) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });
      await page.goto("http://127.0.0.1:4186/?static&stage=" + stage);
      await page.waitForFunction(() => window.bench && !window.bench.paused);
      await page.evaluate(() => window.bench.step(180));
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.bench.begin());
      await page.waitForTimeout(3000);
      const samples = await page.evaluate(() => window.bench.end().samples);
      const bytes = (samples.uploadBytes || []).reduce((a, b) => a + b, 0);
      rows.push({
        stage,
        frames: samples.frame.length,
        calls: samples.uploadBytes?.length || 0,
        bytes,
        bytesPerFrame: bytes / samples.frame.length,
        samples,
      });
      await page.close();
    }
    fs.writeFileSync(
      "results/performance/transfers.json",
      JSON.stringify(rows, null, 2)
    );
    console.log(rows.map(({ samples, ...r }) => r));
  } finally {
    await browser.close();
  }
})();
