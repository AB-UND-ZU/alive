const { test, expect } = require("./fixtures.cjs");
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
    /island\.html$/
  );
});
test("timers list each native haste interval and the multiline assignment", async ({
  page,
}) => {
  await page.goto("/game-design/world/timers.html");
  const rows = page.locator(
    'main table tbody tr:not(.GridRule) th[scope="row"]'
  );
  const labels = await rows.evaluateAll((nodes) =>
    nodes.map((node) => {
      const copy = node.cloneNode(true);
      copy.querySelectorAll(".Pixels").forEach((sprite) => {
        const value = Array.from(sprite.querySelectorAll(".Cell"))
          .map(
            (cell) =>
              cell.getAttribute("data-glyph") ||
              Array.from(cell.querySelectorAll(".Layer")).pop()?.textContent ||
              " "
          )
          .join("")
          .replace(/[^0-9-]/g, "");
        sprite.replaceWith(value);
      });
      return copy.textContent.replace(/\s+/g, "");
    })
  );
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
test("Dungeon legend follows the map from top to bottom and labels Waves", async ({
  page,
}) => {
  await page.goto("/game-design/world/dungeon.html");
  const labels = await page
    .locator('.DungeonMap tbody tr:not(.GridRule) th[scope="row"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const copy = node.cloneNode(true);
        copy.querySelectorAll(".Pixels").forEach((sprite) => sprite.remove());
        return copy.textContent.replace(/\s+/g, " ").trim();
      })
    );
  expect(labels).toEqual([
    "7 Exit",
    "6 Boss",
    "5 Waves",
    "4 Pond",
    "3 Fruit",
    "2 Guide",
    "1 Start",
  ]);
});
