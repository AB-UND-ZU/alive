const { chromium } = require("@playwright/test"),
  fs = require("fs"),
  assert = require("assert/strict");
(async () => {
  const browser = await chromium.launch();
  const rows = [];
  try {
    for (const disabled of [false, true]) {
      const page = await browser.newPage({
        viewport: { width: disabled ? 390 : 1280, height: 800 },
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript((disabled) => {
        window.audioCheck = {
          created: 0,
          messages: 0,
          terminated: 0,
          errors: [],
          starts: 0,
          urls: [],
        };
        const Native = window.Worker;
        if (disabled) window.Worker = undefined;
        else
          window.Worker = class extends Native {
            constructor(...args) {
              super(...args);
              window.audioCheck.created++;
              window.audioCheck.urls.push(String(args[0]));
              this.addEventListener(
                "message",
                () => window.audioCheck.messages++
              );
              this.addEventListener("error", (e) =>
                window.audioCheck.errors.push(e.message)
              );
            }
            terminate() {
              window.audioCheck.terminated++;
              return super.terminate();
            }
          };
        const start = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (...args) {
          window.audioCheck.starts++;
          return start.apply(this, args);
        };
      }, disabled);
      await page.goto("http://127.0.0.1:4187/alive/");
      await page.locator("#resume").click();
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(600);
      await page.keyboard.up("ArrowRight");
      if (!disabled)
        await page.waitForFunction(
          () => window.audioCheck.terminated > 0,
          {},
          { timeout: 60000 }
        );
      else await page.waitForTimeout(3000);
      await page.locator("#menu").click();
      assert.ok(await page.locator("#pause-resume").isVisible());
      await page.locator("#pause-resume").click();
      await page.waitForTimeout(1000);
      await page.keyboard.press("Enter", { delay: 80 });
      await page.waitForTimeout(500);
      const result = await page.evaluate(() => window.audioCheck);
      assert.deepEqual(result.errors, []);
      assert.deepEqual(errors, []);
      console.log("audio result", result);
      assert.ok(result.starts > 0);
      if (!disabled) {
        assert.equal(result.created, 1);
        assert.equal(result.terminated, 1);
        assert.ok(result.messages > 100);
      }
      await page.screenshot({
        path: `results/performance/live/production-audio-${
          disabled ? "fallback" : "worker"
        }.png`,
      });
      rows.push({ disabled, ...result });
      await page.close();
    }
    fs.writeFileSync(
      "results/performance/live/production-audio.json",
      JSON.stringify(rows, null, 2)
    );
    console.log(rows);
  } finally {
    await browser.close();
  }
})();
