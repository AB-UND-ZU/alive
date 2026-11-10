const { chromium } = require("@playwright/test"),
  fs = require("fs");
const stage = process.argv[2] || "baseline",
  scene = process.argv[3] || "menu",
  run = process.argv[4] || "1";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: Number(process.env.WIDTH) || 1280, height: 800 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", async (d) => {
    errors.push(d.message());
    await d.dismiss();
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  if (process.env.CPU)
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: Number(process.env.CPU),
    });
  try {
    await page.goto(`http://127.0.0.1:4196/?stage=${stage}&scene=${scene}`);
    await page.waitForFunction(
      () =>
        window.live &&
        window.liveThree &&
        window.live.ecs.getEntities(["PLAYER", "POSITION"]).length
    );
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 1000 });
    if (scene === "long") {
      await page
        .locator(
          (await page.locator("#pause-resume").isVisible())
            ? "#pause-resume"
            : "#resume"
        )
        .click();
      await page.evaluate(() => window.live.boss());
      await page.waitForTimeout(1000);
    } else if (scene === "boss") {
      await page
        .locator(
          (await page.locator("#pause-resume").isVisible())
            ? "#pause-resume"
            : "#resume"
        )
        .click();
      await page.evaluate(() => window.live.boss());
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: `results/performance/live/${stage}-${scene}-${run}-start.png`,
    });
    const before = await cdp.send("Performance.getMetrics");
    await page.evaluate(() => window.live.begin());
    await cdp.send("Profiler.start");
    if (scene === "menu" || scene === "tutorial" || scene === "island")
      await page
        .locator(
          (await page.locator("#pause-resume").isVisible())
            ? "#pause-resume"
            : "#resume"
        )
        .click();
    if (scene === "boss" || scene === "long")
      await page.evaluate(() => window.live.startBoss());
    await page.waitForTimeout(4000);
    for (let i = 0; i < 12; i++) {
      const key = ["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown"][i % 4];
      await page.keyboard.down(key);
      await page.waitForTimeout(650);
      await page.keyboard.up(key);
      if (scene !== "menu") await page.keyboard.press("Space");
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(4000);
    const { profile } = await cdp.send("Profiler.stop");
    const after = await cdp.send("Performance.getMetrics");
    const result = await page.evaluate(() => window.live.end());
    await page.screenshot({
      path: `results/performance/live/${stage}-${scene}-${run}-end.png`,
    });
    const metrics = (m) =>
      Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
    result.metrics = { before: metrics(before), after: metrics(after) };
    result.errors = errors;
    fs.writeFileSync(
      `results/performance/live/${stage}-${scene}-${run}.json`,
      JSON.stringify(result)
    );
    fs.writeFileSync(
      `results/performance/live/${stage}-${scene}-${run}.cpuprofile`,
      JSON.stringify(profile)
    );
    const quant = (a) => {
      a = a.slice().sort((a, b) => a - b);
      return {
        n: a.length,
        mean: a.reduce((a, b) => a + b, 0) / a.length,
        p50: a[Math.floor(a.length * 0.5)],
        p95: a[Math.floor(a.length * 0.95)],
        p99: a[Math.floor(a.length * 0.99)],
        max: a.at(-1),
      };
    };
    console.log(scene, result.entities, result.hero, result.errors);
    console.log(
      Object.fromEntries(
        Object.entries(result.records)
          .filter(([k]) =>
            ["ecs", "frame", "render", "longtask", "draws"].includes(k)
          )
          .map(([k, v]) => [k, quant(v)])
      )
    );
    const totals = {};
    profile.samples.forEach(
      (id, i) => (totals[id] = (totals[id] || 0) + profile.timeDeltas[i])
    );
    console.log(
      "CPU",
      profile.nodes
        .map((n) => ({
          fn: n.callFrame.functionName,
          line: n.callFrame.lineNumber,
          ms: (totals[n.id] || 0) / 1000,
        }))
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 22)
    );
    console.log(
      "Systems",
      Object.entries(result.records)
        .filter(([k]) => k.startsWith("setup"))
        .map(([k, v]) => ({ name: k, ...quant(v) }))
        .sort((a, b) => b.mean - a.mean)
        .slice(0, 8)
    );
  } finally {
    await browser.close();
  }
})();
