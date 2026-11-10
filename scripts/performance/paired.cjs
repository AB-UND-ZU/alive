const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const stages = process.argv.slice(2);
const level = process.env.LEVEL || "tutorial";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const pages = [],
    rows = [];
  try {
    for (const stage of stages) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });
      await page.goto(
        "http://127.0.0.1:4186/?static&stage=" + stage + "&level=" + level
      );
      await page.waitForFunction(() => window.bench && !window.bench.paused);
      await page.evaluate(() => window.bench.step(180));
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.bench.state.setFrameloop("never"));
      console.log(
        stage,
        level,
        await page.evaluate(() => {
          const { objects, entities } = window.bench.end();
          return { objects, entities };
        })
      );
      pages.push(page);
    }
    for (const kind of ["matrix", "sync", "moving"])
      for (let round = 0; round < 30; round++)
        for (const index of round % 2
          ? [...stages.keys()].reverse()
          : [...stages.keys()]) {
          const [ms] = await pages[index].evaluate(
            (kind) => window.bench.cpu(kind, 500, 1),
            kind
          );
          if (round >= 5) rows.push({ kind, stage: stages[index], round, ms });
        }
    fs.writeFileSync(
      "results/performance/paired-" +
        stages.join("-") +
        (level === "tutorial" ? "" : "-" + level) +
        ".json",
      JSON.stringify(rows, null, 2)
    );
    for (const kind of ["matrix", "sync", "moving"])
      for (const stage of stages) {
        const a = rows
          .filter((r) => r.kind === kind && r.stage === stage)
          .map((r) => r.ms)
          .sort((a, b) => a - b);
        console.log(kind, stage, "median", a[Math.floor(a.length / 2)]);
      }
  } finally {
    await browser.close();
  }
})();
