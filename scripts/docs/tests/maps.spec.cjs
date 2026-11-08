const { test, expect } = require("@playwright/test");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.EventSource = class {
      close() {}
    };
  });
});

test("Levels composes native green frames with sizes and onward connections", async ({
  page,
}) => {
  await page.goto("/game-design/world/levels.html");
  const map = page.locator(
    '.WarpMap [aria-label="Native portal world map with all level frames"]'
  );
  await expect(map).toBeVisible();
  const table = page.locator(".WarpMap table");
  await expect(table.locator("thead")).toContainText("Size");
  await expect(table.locator("thead")).not.toContainText("Vision");
  await expect(table.locator("tbody")).toContainText("No onward portal");
  expect(
    (await page.locator(".WarpMap .TableScroll").boundingBox()).width
  ).toBeGreaterThan(400);
  const mapBox = await map.boundingBox(),
    tableBox = await table.boundingBox();
  expect(tableBox.x).toBeGreaterThan(mapBox.x + mapBox.width);
  for (const [level, offset] of [
    ["LEVEL_MENU", 2],
    ["LEVEL_TUTORIAL", 8],
    ["LEVEL_ISLAND", 14],
  ]) {
    const row = await table
      .locator(`[data-warp-level="${level}"]`)
      .first()
      .boundingBox();
    expect(row.y - mapBox.y).toBe(offset * 32);
    expect(row.height).toBe(5 * 32);
  }
  await expect(page.locator(".DungeonMap .DungeonLegendEntry")).toHaveCount(7);
  const dungeon = page.locator(".DungeonMap .WorldMapContent > .Pixels");
  expect((await dungeon.boundingBox()).height).toBeLessThanOrEqual(416);
  await expect(
    page.locator(
      '.WorldMap [aria-label="Island schematic: ocean and glacier; jungle with the start, Earth Town and Ilex; central mountains and Oak; desert with Fire Haven and the Nomad"]'
    )
  ).toHaveCount(1);
});

test("legacy Map links open Minimap with four native static zooms", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/game-design/world/map.html");
  await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
    "href",
    /\/world\/minimap\.html$/
  );
  await expect(
    page.locator('[data-widget="minimap"] .DialogSnapshot')
  ).toHaveCount(4, { timeout: 30000 });
  for (const index of [1, 2, 3, 4])
    await expect(
      page.getByLabel(`Native minimap zoom ${index}`, { exact: true })
    ).toBeVisible();
  await expect(page.locator(".WarpMap")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  );
  expect(errors).toEqual([]);
});

test("Sounds lists native effects and starts playback from a play button", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/game-design/world/sounds.html");
  const sounds = page.locator('[data-widget="sounds"]');
  expect(
    await sounds.getByRole("button", { name: "Play", exact: true }).count()
  ).toBeGreaterThan(40);
  await sounds
    .getByRole("button", { name: "Play", exact: true })
    .first()
    .click();
  await expect(sounds).toHaveAttribute("data-last-sound", "move");
  expect(errors).toEqual([]);
});
