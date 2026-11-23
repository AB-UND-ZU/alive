const { test, expect } = require("./fixtures.cjs");

test("game startup restores the same sound samples from browser storage after reload", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.soundStub = { played: [], loadCatalog: true };
    const NativeWorker = window.Worker;
    window.soundWorkers = [];
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        this.catalog = { valid: false, terminated: false, error: false };
        window.soundWorkers.push(this.catalog);
        this.addEventListener("message", async ({ data }) => {
          this.catalog.valid =
            Array.isArray(data) &&
            data.length > 0 &&
            data.every((samples) => samples instanceof Float32Array) &&
            data.some((samples) => samples.length > 0);
          if (this.catalog.valid) {
            const lengths = Uint32Array.from(data, (sound) => sound.length);
            const bytes = await new Blob([lengths, ...data]).arrayBuffer();
            const digest = await crypto.subtle.digest("SHA-256", bytes);
            this.catalog.digest = Array.from(new Uint8Array(digest)).join(".");
          }
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
  const loadedDigest = async () => {
    const digest = () =>
      page.evaluate(
        () =>
          window.soundWorkers.find(
            (worker) => worker.terminated && worker.digest
          )?.digest
      );
    await expect.poll(digest, { timeout: 30000 }).toBeTruthy();
    expect(
      await page.evaluate(() =>
        window.soundWorkers.some((worker) => worker.error)
      )
    ).toBe(false);
    return digest();
  };
  const first = await loadedDigest();
  await page.reload();
  expect(await loadedDigest()).toBe(first);
  await expect(page.locator("canvas")).toBeVisible();
});
