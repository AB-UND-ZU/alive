const { test, expect } = require("./fixtures.cjs");
for (const [route, count] of [
  ["intro/play", 10],
  ["game-design/world/menu", 1],
  ["game-design/world/dungeon", 2],
  ["game-design/world/island", 7],
  ["game-design/characters/bosses", 4],
]) {
  test(`${route} uses the shared scenario load table with native hero supplies`, async ({
    page,
  }) => {
    await page.goto("/" + route + ".html");
    await expect(
      page.getByRole("tablist", { name: "Scenario", exact: true })
    ).toHaveCount(0);
    const table = page.getByRole("region", { name: "Scenarios", exact: true });
    await expect(table.getByRole("columnheader")).toHaveText([
      "Scenario",
      "Description",
      "Hero",
      "Load",
    ]);
    await expect(
      table.getByRole("button", { name: "Load", exact: true })
    ).toHaveCount(count);
    for (const row of await table.locator("tbody tr:not(.GridRule)").all()) {
      const scenario = row.locator('[data-column="0"]');
      await expect(scenario).toContainText(/\((level|area|boss)\)/);
      await expect(scenario.locator("a .Pixels")).toHaveCount(1);
    }
    if (route.endsWith("play") || route.endsWith("dungeon")) {
      const dungeon = table.locator("tbody tr:not(.GridRule)").filter({
        has: page.getByRole("link", { name: "Dungeon", exact: true }),
      });
      await expect(dungeon.locator(".ScenarioEquipment")).toContainText(
        "Level 1"
      );
      await expect(dungeon.locator(".ScenarioEquipment")).toContainText(
        "Empty-handed"
      );
      await dungeon.getByRole("button", { name: "Load", exact: true }).click();
      await expect(page.locator('[data-scene="game"] iframe')).toHaveAttribute(
        "src",
        /#game\/dungeon$/
      );
    }
  });
}

test("Dungeon legend follows its map from room seven down to one without overlapping room labels", async ({
  page,
}) => {
  await page.goto("/game-design/world/dungeon.html");
  const names = await page
    .locator(".DungeonLegendEntry")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
  expect(names.map((name) => Number(name.match(/\d+/)[0]))).toEqual([
    7, 6, 5, 4, 3, 2, 1,
  ]);
  const overlap = await page
    .locator(".DungeonLegendEntry")
    .evaluateAll((nodes) =>
      nodes.some(
        (node) =>
          node.getBoundingClientRect().right >
          node.closest(".GridValue").getBoundingClientRect().right
      )
    );
  expect(overlap).toBe(false);
});

test("Minimap key instructions are separate key-first paragraphs and stay on one line", async ({
  page,
}) => {
  await page.goto("/game-design/world/minimap.html");
  await expect(page.locator("table .Key")).toHaveCount(0);
  await expect(page.locator(".ControlParagraph")).toHaveCount(3);
  for (const paragraph of await page.locator(".ControlParagraph").all()) {
    expect(
      await paragraph.evaluate((node) =>
        node.firstElementChild.classList.contains("Key")
      )
    ).toBe(true);
    await expect(paragraph).toHaveCSS("flex-wrap", "nowrap");
  }
});

test("character comparisons use Name and full entity names, including the Worm catch", async ({
  page,
}) => {
  await page.goto("/game-design/characters/npcs.html");
  for (const [key, name] of [
    ["fireGateGuard", "Fire Gate Guard"],
    ["fireSmith", "Fire Smith"],
    ["earthSmith", "Earth Smith"],
  ]) {
    const table = page
      .locator(
        `[data-catalog-unit="${key}"], [data-catalog-unit]:has(a[href*="#${key.toLowerCase()}"])`
      )
      .first();
    await expect(table.locator("thead th").first()).toHaveText("Name");
    await expect(
      page.getByRole("columnheader", { name: new RegExp(name) }).first()
    ).toBeVisible();
  }
  for (const route of ["animals", "enemies"]) {
    await page.goto(`/game-design/characters/${route}.html`);
    for (const header of await page
      .locator(".CatalogEntry thead th:first-child")
      .all())
      await expect(header).toHaveText("Name");
    if (route === "animals") {
      const worm = page.locator('[data-catalog-item="worm"]');
      await expect(
        worm.getByRole("columnheader", { name: /Worm/ })
      ).toBeVisible();
      await expect(
        worm.getByRole("columnheader", { name: /Worm/ }).locator(".Pixels")
      ).toHaveCount(1);
    }
  }
});

test("every sound has a matching native sprite and a linked label", async ({
  page,
}) => {
  await page.goto("/game-design/world/sounds.html");
  const rows = page.locator('[data-widget="sounds"] tbody tr:not(.GridRule)');
  expect(await rows.count()).toBeGreaterThan(50);
  for (const row of await rows.all())
    await expect(row.locator('[data-column="0"] a .Pixels')).toHaveCount(1);
});

test("Touch loads its emitted Markdown asset instead of the HTML fallback", async ({
  page,
}) => {
  const pending = page.waitForResponse((response) =>
    /\/touch\.[^/]+\.md$/.test(new URL(response.url()).pathname)
  );
  await page.goto("/game-design/controls/touch.html");
  await expect(page.locator("main h1")).toHaveAccessibleName("Touch");
  const response = await pending;
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).not.toContain("text/html");
  expect(await response.text()).toContain("# Touch");
});
