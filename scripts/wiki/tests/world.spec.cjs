const { test, expect } = require("./fixtures.cjs");

async function observeAudio(page) {
  await page.addInitScript(() => {
    window.__audioGains = [];
    window.__audioStarts = 0;
    const gain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function (...args) {
      const node = gain.apply(this, args);
      window.__audioGains.push(node);
      return node;
    };
    const connect = GainNode.prototype.connect;
    GainNode.prototype.connect = function (target, ...args) {
      if (target === this.context.destination) window.__audioOutput = this;
      return connect.call(this, target, ...args);
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__audioStarts++;
      return start.apply(this, args);
    };
  });
}

test("desktop navigation stays sticky while the document and chapter tree scroll", async ({
  page,
}) => {
  await page.goto("/game-design/world/portals.html");
  await page.evaluate(() => scrollTo(0, 700));
  await expect
    .poll(async () => Math.round((await page.locator("nav").boundingBox()).y))
    .toBe(80);
  const viewport = page.locator(".NavViewport");
  const before = await viewport.evaluate((node) => node.scrollTop);
  await page.getByRole("button", { name: "Scroll navigation down" }).click();
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(before);
});

for (const [level, preset] of [
  ["menu", "menu"],
  ["dungeon", "dungeon"],
  ["island", "island"],
]) {
  test(`${level} has its own playable level and map`, async ({ page }) => {
    await page.goto(`/game-design/world/${level}.html`);
    const preview = page.locator('main > [data-scene="game"]');
    await expect(preview).toHaveCount(1);
    await expect(preview.locator("iframe")).toHaveAttribute(
      "src",
      new RegExp(`preview.html#game/${preset}$`)
    );
    await expect(preview.locator("iframe")).toHaveAttribute("data-x", /\d+/, {
      timeout: 30000,
    });
    await expect(
      page.locator(
        `[aria-label="${
          level === "dungeon"
            ? "Dungeon"
            : level[0].toUpperCase() + level.slice(1)
        } portal map"]`
      )
    ).toHaveCount(1);
    if (level === "menu") {
      for (const item of [
        "Tutorial",
        "New Game",
        "Continue",
        "Sound FX",
        "Controls",
        "Credits",
      ])
        await expect(page.locator("main table")).toContainText(item);
    }
  });
}

test("Island town cutouts show interiors and their actual interaction legends underneath", async ({
  page,
}, info) => {
  await page.goto("/game-design/world/island.html");
  await expect(
    page.getByLabel("Generated Island map, seed 2026, fully revealed", {
      exact: true,
    })
  ).toBeVisible();
  for (const town of ["earth", "fire"]) {
    const section = page.locator(`[data-town="${town}"]`);
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator(".WorldDiagram > .Pixels")).toHaveAttribute(
      "aria-label",
      /all buildings shown from inside/
    );
    await expect(section.locator(".TownLegend")).toContainText("Chief");
    await expect(section.locator(".TownLegend")).toContainText("Smith");
    await expect(section.locator(".TownLegend")).toContainText("Druid");
    const map = await section.locator(".WorldDiagram").boundingBox();
    const table = await section.locator(".TownLegend").boundingBox();
    expect(table.y).toBeGreaterThanOrEqual(map.y + map.height);
  }
  await page.screenshot({
    path: info.outputPath("island-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-town="earth"]').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  );
  await page.screenshot({ path: info.outputPath("town-phone.png") });
});

test("old level and level-section links open Portals or the dedicated level", async ({
  page,
}) => {
  await page.goto("/game-design/world/levels.html");
  await expect(page).toHaveURL(/world\/portals.html$/);
  await page.goto("/levels.html#island");
  await expect(page).toHaveURL(/world\/island.html#island$/);
  await expect(page.locator("h1")).toHaveAccessibleName("Island");
});

test("sound samples cannot enable audio in static wiki pages", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/game-design/world/sounds.html");
  await page.evaluate(() => (window.navigationMarker = 42));
  await page
    .locator('[data-widget="sounds"]')
    .getByRole("button", { name: "Play", exact: true })
    .first()
    .click();
  await expect
    .poll(() => page.evaluate(() => window.__audioStarts))
    .toBeGreaterThan(0);
  const played = await page.evaluate(() => window.__audioStarts);
  for (const title of ["Portals", "Savegames"]) {
    await page.locator(`nav a[aria-label="${title}"]`).click();
    await expect(page.locator("h1")).toHaveAccessibleName(title);
    expect(await page.evaluate(() => window.__audioOutput.gain.value)).toBe(0);
    expect(await page.evaluate(() => window.__audioStarts)).toBe(played);
    expect(await page.evaluate(() => window.navigationMarker)).toBe(42);
  }
});

test("game-frame sound is silent for autoplay, audible during interaction and silent after blur", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/game-design/controls/keyboard-mouse.html");
  const preview = page.locator('[data-scene="movement"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  expect(await frame.evaluate(() => window.__audioOutput.gain.value)).toBe(0);
  expect(await frame.evaluate(() => window.__audioStarts)).toBe(0);
  await iframe.click();
  await page.keyboard.down("ArrowRight");
  try {
    await expect
      .poll(() => frame.evaluate(() => window.__audioStarts))
      .toBeGreaterThan(0);
  } finally {
    await page.keyboard.up("ArrowRight");
  }
  await page.locator("main h1").click();
  await expect
    .poll(() => frame.evaluate(() => window.__audioOutput.gain.value))
    .toBe(0);
});

test("a sound sample replayed during a pending navigation cannot leak into the next page", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/game-design/world/sounds.html");
  let release;
  const response = new Promise((resolve) => {
    release = resolve;
  });
  let requested = false;
  await page.route("**/savegames.*.md", async (route) => {
    requested = true;
    await response;
    await route.continue();
  });
  try {
    await page.locator('nav a[aria-label="Savegames"]').click();
    await expect.poll(() => requested).toBe(true);
    await page
      .locator('[data-widget="sounds"]')
      .getByRole("button", { name: "Play", exact: true })
      .first()
      .click();
    await expect
      .poll(() => page.evaluate(() => window.__audioStarts))
      .toBeGreaterThan(0);
    const samples = await page.evaluate(() => window.__audioStarts);
    release();
    await expect(page.locator("h1")).toHaveAccessibleName("Savegames");
    expect(await page.evaluate(() => window.__audioOutput.gain.value)).toBe(0);
    expect(await page.evaluate(() => window.__audioStarts)).toBe(samples);
  } finally {
    release();
  }
});
