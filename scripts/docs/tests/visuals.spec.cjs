const { test, expect } = require("@playwright/test");

const fills = (locator) =>
  locator
    .locator("svg rect")
    .evaluateAll((nodes) => [
      ...new Set(nodes.map((node) => getComputedStyle(node).fill)),
    ]);

test("item links underline and recolor only the name", async ({ page }) => {
  await page.goto("/crafting.html");
  const item = page
    .locator("main .Item")
    .filter({ has: page.locator(".Text:not(.LinkText)") })
    .first();
  const count = item.locator(".Text:not(.LinkText)");
  const name = item.locator(".LinkText");
  await expect(name).toBeVisible();
  expect(await fills(count)).toEqual(["rgb(128, 128, 128)"]);
  expect(await fills(name)).toEqual(
    expect.arrayContaining(["rgb(128, 128, 128)", "rgb(192, 192, 192)"])
  );
  const icon = item.locator(":scope > .Pixels");
  const iconColors = await fills(icon);
  await item.hover();
  expect(await fills(name)).toEqual(["rgb(0, 255, 255)"]);
  expect(await fills(count)).toEqual(["rgb(128, 128, 128)"]);
  expect(await fills(icon)).toEqual(iconColors);
  await page.goto("/npcs.html");
  const friendlyName = page.locator(".CatalogIndex .LinkText").first();
  await expect(friendlyName).toBeVisible();
  expect(await fills(friendlyName)).toEqual(["rgb(0, 128, 0)"]);
});

test("game buttons show one native idle, hover or pressed face", async ({
  page,
}) => {
  await page.goto("/crafting.html");
  const button = page.getByRole("button", { name: "< Back", exact: true });
  await button.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(button.locator(".StateIdle")).toBeVisible();
  await expect(button.locator(".StateHover")).toBeHidden();
  await button.hover();
  await expect(button.locator(".StateIdle")).toBeHidden();
  await expect(button.locator(".StateHover")).toBeVisible();
  await page.mouse.down();
  await expect(button.locator(".StateHover")).toBeHidden();
  await expect(button.locator(".StatePressed")).toBeVisible();
  await page.mouse.move(0, 0);
  await page.mouse.up();
});

test("catalog overview frame stays on the character grid", async ({ page }) => {
  for (const width of [1440, 600]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/resources.html");
    const frame = page
      .locator(".FrameScroll")
      .filter({ has: page.locator(".CatalogIndex") })
      .first();
    await expect(frame).toBeVisible();
    const geometry = await frame.locator(".TextFrame").evaluate((element) => {
      const edges = [...element.querySelectorAll(":scope > .FrameEdge")];
      return {
        width: element.getBoundingClientRect().width,
        edges: edges.map((edge) => ({
          width: edge.getBoundingClientRect().width,
          cells: edge.querySelectorAll(".Cell").length,
        })),
      };
    });
    expect(geometry.width % 18).toBe(0);
    expect(geometry.edges).toHaveLength(2);
    for (const edge of geometry.edges)
      expect(edge.cells * 18).toBe(geometry.width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width);
  }
});

test("catalog comparisons show supported variants with their real stats", async ({
  page,
}) => {
  await page.goto("/game-design/items/gear.html#sword");
  const sword = page.locator('[data-catalog-item="sword"]');
  await expect(sword.locator(".CatalogVariant")).toHaveCount(0);
  const headers = await sword.locator("thead th.GridValue").allTextContents();
  const earth = headers.indexOf("Ruby Earth");
  expect(earth).toBeGreaterThan(0);
  await expect(
    sword
      .locator('th[scope="row"]')
      .filter({ hasText: /Melee$/ })
      .locator("..")
      .locator(`[data-column="${earth}"]`)
  ).toHaveText("10");
  await expect(
    sword
      .locator("tr")
      .filter({ hasText: "Info" })
      .locator(`[data-column="${earth}"] .Pixels[aria-label="Ruby"]`)
  ).toHaveCount(1);
  await expect(
    sword.locator("tr").filter({ hasText: "Sprite" }).locator(".LargePreview")
  ).toHaveCount(headers.length - 1);
  await expect(page.locator('.CatalogIndex a[href="#sword"]')).toHaveCount(1);
  await page.goto("/game-design/characters/classes.html");
  const classes = page.locator("main table");
  await expect(classes.locator("thead th.GridValue")).toHaveCount(6);
  for (let level = 1; level <= 11; level++) {
    const row = classes
      .locator('th[scope="row"]')
      .filter({ hasText: new RegExp(`Level\\s*${level}$`) })
      .locator("..");
    await expect(row).toHaveCount(1);
    await expect(row.locator("td.GridValue")).toHaveCount(5);
  }
  const levelOne = classes
    .locator('th[scope="row"]')
    .filter({ hasText: /Level\s*1$/ })
    .locator("..");
  await expect(levelOne.locator('[data-column="2"]')).toContainText(
    /HP 25.*MP 10/
  );
  const cap = classes
    .locator('th[scope="row"]')
    .filter({ hasText: /Level\s*11$/ })
    .locator("..");
  await expect(cap.locator('[data-column="2"]')).toContainText(/HP 50.*MP 25/);
  await expect(page.locator("main .CatalogVariant")).toHaveCount(0);
  await page.goto("/game-design/characters/enemies.html#prism");
  await expect(
    page.locator('[data-catalog-family="prism"] [data-unit]')
  ).toHaveCount(2);
});

test("category indexes link to canonical plant and element entries without duplicate catalogs", async ({
  page,
}) => {
  await page.goto("/game-design/cells/units.html");
  await expect(page.locator('[data-unit="cactus1"]')).toHaveCount(0);
  const cactus = page.locator('.CatalogIndex a[href$="plants.html#cactus1"]');
  await expect(cactus).toHaveCount(1);
  await cactus.click();
  await expect(page).toHaveURL(/plants.html#cactus1$/);
  await expect(page.locator('[data-unit="cactus1"]')).toBeVisible();
  await page.goto("/game-design/items/resources.html");
  await expect(page.locator('[data-catalog-item="fire"]')).toHaveCount(0);
  await expect(
    page.locator('.CatalogIndex a[href$="elements.html#water"]')
  ).toHaveCount(1);
  await page.locator('.CatalogIndex a[href$="elements.html#fire"]').click();
  await expect(page).toHaveURL(/elements.html#fire$/);
  await expect(page.locator('[data-catalog-item="fire"]')).toBeVisible();
});

test("long commands keep a whole input frame inside the phone viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game-design/interactions/chat.html");
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  const materials = page.locator("tr").filter({ hasText: /^Materialwood/ });
  await expect(materials.locator("br")).toHaveCount(4);
  await input.fill("/give sword 1 diamond earth");
  const target = page.locator('[data-widget="commands"] .InputTarget');
  await expect
    .poll(async () => (await target.boundingBox()).width)
    .toBeLessThanOrEqual(390);
  const rows = await target
    .locator(".Pixels > .Row")
    .evaluateAll((rows) =>
      rows.map((row) => row.getBoundingClientRect().width)
    );
  expect(rows).toHaveLength(3);
  expect(new Set(rows).size).toBe(1);
  expect(rows[0] % 18).toBe(0);
  expect(rows[0]).toBe((await target.boundingBox()).width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  );
});

test("large tables keep their header and row labels visible while scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto("/index.html");
  const scroll = page.locator("#font-characters .TableScroll");
  await scroll.scrollIntoViewIfNeeded();
  await scroll.evaluate((element) => {
    element.scrollLeft = 108;
    element.scrollTop = 160;
  });
  const geometry = await scroll.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const first = element
      .querySelector('tbody [data-column="0"]')
      .getBoundingClientRect();
    const header = element.querySelector("thead").getBoundingClientRect();
    return {
      left: box.left,
      top: box.top,
      first: first.left,
      header: header.top,
      x: element.scrollLeft,
      y: element.scrollTop,
    };
  });
  expect(geometry.x).toBeGreaterThan(0);
  expect(geometry.y).toBeGreaterThan(0);
  expect(geometry.first).toBe(geometry.left + 18);
  expect(geometry.header).toBe(geometry.top);
});
