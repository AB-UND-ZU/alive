const { test, expect } = require("./fixtures.cjs");

test("game startup loads sound buffers through the bundled worker and releases it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.soundWorkers = [];
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        this.catalog = { valid: false, terminated: false, error: false };
        window.soundWorkers.push(this.catalog);
        this.addEventListener("message", ({ data }) => {
          this.catalog.valid =
            Array.isArray(data) &&
            data.length > 0 &&
            data.every((samples) => samples instanceof Float32Array) &&
            data.some((samples) => samples.length > 0);
        });
        this.addEventListener("error", () => {
          this.catalog.error = true;
        });
      }
      terminate() {
        this.catalog.terminated = true;
        super.terminate();
      }
    };
  });
  await page.goto("/preview.html?test#game");
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.soundWorkers.some(
            (worker) => worker.valid && worker.terminated
          )
        ),
      { timeout: 30000 }
    )
    .toBe(true);
  expect(
    await page.evaluate(() =>
      window.soundWorkers.some((worker) => worker.error)
    )
  ).toBe(false);
  await expect(page.locator("canvas")).toBeVisible();
});
