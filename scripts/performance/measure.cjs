const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const stages = process.argv.slice(2);
const mode = process.env.MODE || "paths";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const rows = [];
  try {
    for (const stage of stages) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("http://127.0.0.1:4186/?static&stage=" + stage);
      await page.waitForFunction(() => window.bench && !window.bench.paused);
      await page.evaluate(() => window.bench.step(180));
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.bench.state.setFrameloop("never"));
      if (mode === "paths") {
        for (const [size, kind] of [
          [144, "short"],
          [480, "short"],
          [480, "wrapped"],
          [96, "long"],
          [96, "blocked"],
        ]) {
          const result = await page.evaluate(
            ({ size, kind }) => window.bench.paths(size, kind),
            { size, kind }
          );
          const reference = rows.find(
            (r) => r.size === size && r.kind === kind
          );
          if (reference) assert.deepEqual(result.routes, reference.routes);
          rows.push({ stage, size, kind, ...result });
        }
      } else {
        for (const kind of ["matrix", "sync", "moving"])
          rows.push({
            stage,
            kind,
            times: await page.evaluate((kind) => window.bench.cpu(kind), kind),
          });
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    fs.writeFileSync(
      "results/performance/" + mode + "-" + stages.join("-") + ".json",
      JSON.stringify(rows, null, 2)
    );
    console.log(
      rows.map(({ routes, times, ...r }) => ({
        ...r,
        median: times.slice().sort((a, b) => a - b)[
          Math.floor(times.length / 2)
        ],
        p95: times.slice().sort((a, b) => a - b)[
          Math.floor(times.length * 0.95)
        ],
      }))
    );
  } finally {
    await browser.close();
  }
})();
