const { test, expect } = require("@playwright/test");

test("the type index keeps a destination for every declaration", async ({
  page,
}) => {
  await page.goto("/development/types/types.html");
  const rows = page.locator("main tbody tr:not(.GridRule)");
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(200);
  const missing = await rows.evaluateAll((rows) =>
    rows
      .filter((row) => !row.querySelector('[data-column="0"] a'))
      .map((row) => row.textContent)
  );
  expect(missing).toEqual([]);
  await expect(rows.first().locator('[data-column="1"] a')).toHaveAttribute(
    "href",
    /components\/castable\.html$/
  );
  await expect(
    page
      .locator("main a")
      .filter({ hasText: /^Melee$/ })
      .locator(".RichMention")
  ).toHaveCount(0);
});

test("source prose and filenames do not infer unrelated game objects", async ({
  page,
}) => {
  await page.goto("/development/engine/snapshot.html");
  await expect(page.locator('main p a[href*="harness.html"]')).toHaveCount(0);
  await expect(page.locator("main p .RichMention")).toHaveCount(0);
  await page.goto("/game-design/world/minimap.html");
  await expect(page.locator("main p")).toContainText(["Equip"]);
  await expect(
    page.locator("main p .RichMention").filter({ hasText: "Range" })
  ).toHaveCount(0);
});

test("code links belong to identifier uses rather than strings and comments", async ({
  page,
}) => {
  await page.goto("/development/engine/game/assets/commands.html");
  await expect(page.locator(".CodeSemantic")).not.toHaveCount(0);
  const links = await page.locator(".CodeSemantic a").allTextContents();
  expect(links).not.toContain("sword");
  expect(links).not.toContain("potion");
  expect(links).not.toContain("wood");
  await page.goto("/development/engine/wfc/wfc.html");
  await expect(
    page.locator('.CodeSemantic a[href$="/wfc/wfc.html"]')
  ).toHaveCount(0);
});

test("quest items keep their own catalog destination when a unit shares the key", async ({
  page,
}) => {
  await page.goto("/game-design/interactions/quests.html");
  const head = page.locator("main .Item").filter({ hasText: "Head" }).first();
  await expect(head.locator("..")).toHaveAttribute(
    "href",
    /items\/resources\.html#golem$/
  );
  await expect(head.locator(".TextPrefix > .Text")).toHaveText("3");
  await expect(head.locator(".LinkText")).toHaveText("Head");
});
