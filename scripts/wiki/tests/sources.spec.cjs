const { test, expect } = require("@playwright/test");
test.beforeEach(async ({ page }) =>
  page.addInitScript(
    () =>
      (window.EventSource = class {
        close() {}
      })
  )
);
test("acquisition sources use compact titled native frames with complete drops and prices", async ({
  page,
}) => {
  await page.goto("/game-design/items/resources.html");
  const frames = page.locator(".CatalogSources .FrameScroll");
  expect(await frames.count()).toBeGreaterThan(10);
  for (const frame of await frames.all())
    await expect(frame).toHaveClass(/CompactFrame/);
  const drop = page.locator('.CatalogSources [aria-label="Drop"]').first();
  await expect(drop).not.toContainText("Most enemies");
  await expect(drop).not.toContainText("%");
  const shops = page.locator('.CatalogSources [aria-label="Shops"]').first();
  await expect(shops).toContainText("(Buy)");
  await expect(shops).toContainText("(Sell)");
  const levels = page.locator('.CatalogSources [aria-label="Levels"]').first();
  await expect(levels).toContainText("Island");
  await expect(levels.locator("a").first()).toHaveAttribute(
    "href",
    /levels\.html#island$/
  );
});
test("timers list each native haste interval and the multiline assignment", async ({
  page,
}) => {
  await page.goto("/game-design/world/timers.html");
  const rows = page.locator(
    'main table tbody tr:not(.GridRule) th[scope="row"]'
  );
  const labels = await rows.evaluateAll(nodes => nodes.map(node => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".Pixels").forEach(sprite => {
      const value = Array.from(sprite.querySelectorAll(".Cell")).map(cell =>
        Array.from(cell.querySelectorAll(".Layer")).pop()?.textContent || " "
      ).join("").replace(/[^0-9-]/g, "");
      sprite.replaceWith(value);
    });
    return copy.textContent.replace(/\s+/g, "");
  }));
  expect(labels).toEqual([
    "Worldreference",
    "-1Haste",
    "0Haste",
    "1Haste",
    "2Haste",
    "3Haste",
    "4Haste",
    "5Haste",
    "Systemsupdate",
    "Sequence",
  ]);
  await expect(page.locator(".CodeSemantic")).toContainText(
    "const tickMs = Math.floor(\n"
  );
});
test("Dungeon table follows numbered room order and labels Waves", async ({
  page,
}) => {
  await page.goto("/game-design/world/levels.html");
  const labels = (
    await page
      .locator('.DungeonMap tbody tr:not(.GridRule) th[scope="row"]')
      .allTextContents()
  ).map((x) => x.trim());
  expect(labels).toEqual([
    "1 Start",
    "2 Guide",
    "3 Fruit",
    "4 Pond",
    "5 Waves",
    "6 Boss",
    "7 Exit",
  ]);
});
