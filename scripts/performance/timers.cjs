const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const rows = [];
  try {
    for (const stage of ["uploads", "hud"]) {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        const set = window.setInterval,
          clear = window.clearInterval;
        window.intervals = new Set();
        window.setInterval = (...args) => {
          const id = set(...args);
          window.intervals.add(id);
          return id;
        };
        window.clearInterval = (id) => {
          window.intervals.delete(id);
          return clear(id);
        };
      });
      await page.goto("http://127.0.0.1:4186/?static&stage=" + stage);
      await page.waitForFunction(() => window.bench && !window.bench.paused);
      await page.waitForTimeout(500);
      const result = await page.evaluate(() => {
        const before = window.intervals.size;
        window.bench.timerBenchmark();
        return {
          before,
          after: window.intervals.size,
          leaked: window.intervals.size - before,
          remounts: 20,
        };
      });
      assert.equal(result.leaked, stage === "uploads" ? 20 : 0);
      rows.push({ stage, ...result });
      await page.close();
    }
    fs.writeFileSync(
      "results/performance/timers.json",
      JSON.stringify(rows, null, 2)
    );
    console.log(rows);
  } finally {
    await browser.close();
  }
})();
