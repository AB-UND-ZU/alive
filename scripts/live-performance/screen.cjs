const { chromium } = require("@playwright/test"),
  fs = require("fs"),
  assert = require("assert/strict");
const stages = process.argv.slice(2);
if (!stages.length)
  stages.push(
    "baseline",
    "fog-allocation",
    "action-cell",
    "trace-arguments",
    "trace-angles"
  );
(async () => {
  const browser = await chromium.launch();
  const rows = [];
  try {
    for (const scene of ["kernel-menu", "kernel"])
      for (let round = 0; round < 3; round++)
        for (const stage of round % 2 ? stages.slice().reverse() : stages) {
          const page = await browser.newPage({
            viewport: { width: 1280, height: 800 },
          });
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("dialog", async (d) => {
            errors.push(d.message());
            await d.dismiss();
          });
          await page.goto(
            `http://127.0.0.1:4196/?stage=${stage}&scene=${scene}`
          );
          await page.waitForFunction(
            () =>
              window.live &&
              window.liveThree &&
              window.live.ecs.getEntities(["PLAYER", "POSITION"]).length
          );
          await page.waitForTimeout(300);
          const r = await page.evaluate(() => window.live.kernel());
          assert.deepEqual(errors, []);
          const first = rows.find((x) => x.scene === scene);
          if (first)
            assert.equal(r.hash, first.hash, stage + " state mismatch");
          const sums = Object.fromEntries(
            Object.entries(r.records).map(([k, a]) => [
              k,
              a.reduce((s, v) => s + v, 0) / a.length,
            ])
          );
          const row = {
            stage,
            scene,
            round,
            hash: r.hash,
            entities: r.entities,
            ...sums,
          };
          rows.push(row);
          console.log(JSON.stringify(row));
          fs.writeFileSync(
            "results/performance/live/screen.json",
            JSON.stringify(rows, null, 2)
          );
          await page.close();
        }
  } finally {
    await browser.close();
  }
})();
