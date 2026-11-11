const { test, expect } = require("./fixtures.cjs");

test("touch frame edge keeps its appearance when the footer changes orientation", async ({
  page,
}) => {
  await page.goto("/game-design/controls/touch.html");
  const preview = page.locator('[data-scene="touch"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  await iframe.click({ position: { x: 300, y: 250 } });
  const edge = frame.locator(".DemoFrame > .Row").last();
  const before = await edge.innerHTML();
  const bounds = await edge.boundingBox();
  const box = await iframe.boundingBox();
  await page.mouse.move(box.x + 180, box.y + 445);
  await page.mouse.down();
  try {
    await page.mouse.move(box.x + 200, box.y + 455);
    await expect(frame.locator(".ControlsEdge")).toBeHidden();
    expect(await edge.innerHTML()).toEqual(before);
    expect(await edge.boundingBox()).toEqual(bounds);
  } finally {
    await page.mouse.up();
  }
});

test("light lever preserves the running frame while removing circular shadows", async ({
  page,
}) => {
  await page.goto("/game-design/rendering/light.html");
  const preview = page.locator('[data-scene="light"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  const original = await iframe.getAttribute("src");
  const frame = await (await iframe.elementHandle()).contentFrame();
  const lever = page.getByRole("button", { name: "Shadows", exact: true });
  await lever.click();
  await expect(frame.locator("body")).toHaveAttribute("data-shadows", "false");
  await expect(iframe).toHaveAttribute("src", original);
  await lever.click();
  await expect(frame.locator("body")).toHaveAttribute("data-shadows", "true");
});

test("bosses have one playable scenario preview and native preview and sprite rows", async ({
  page,
}) => {
  await page.goto("/game-design/characters/bosses.html");
  await expect(page.locator('[data-scene="game"]')).toHaveCount(1);
  const choices = page.getByRole("region", { name: "Scenarios", exact: true });
  await expect(
    choices.getByRole("button", { name: "Load", exact: true })
  ).toHaveCount(4);
  for (const unit of ["tutorialBoss", "ilexElite", "oakBoss", "wormBoss"]) {
    const table = page.locator(`[data-catalog-unit="${unit}"] table`);
    await expect(table.locator("thead")).toContainText("Name");
    await expect(
      table.getByRole("rowheader", { name: "Preview", exact: true })
    ).toBeVisible();
    await expect(
      table.getByRole("rowheader", { name: "Sprite", exact: true })
    ).toBeVisible();
  }
  await expect(
    page.locator('[data-catalog-unit="wormBoss"] .WorldDiagram')
  ).toHaveAttribute("class", /WorldDiagram/);
  await expect(page.locator("main")).not.toContainText("three-percent");
  await choices
    .locator("tr")
    .filter({ hasText: "Oak" })
    .getByRole("button", { name: "Load", exact: true })
    .click();
  await expect(page.locator('[data-scene="game"] iframe')).toHaveAttribute(
    "src",
    /#game\/oak$/
  );
});

test("container comparison keeps default chests and puts quest chests in reward frames", async ({
  page,
}) => {
  await page.goto("/game-design/cells/containers.html");
  const chests = page.locator('[data-catalog-family="chest"]');
  await expect(
    chests.locator('thead th:not(:first-child) a[href*="#woodchest"]')
  ).toHaveCount(1);
  await expect(
    chests.locator('thead th:not(:first-child) a[href*="#ironchest"]')
  ).toHaveCount(1);
  await expect(
    chests.locator('thead th:not(:first-child) a[href*="#oakchest"]')
  ).toHaveCount(0);
  await expect(page.locator("#oakchest .FrameScroll")).toHaveCount(1);
  await page.goto("/game-design/characters/bosses.html");
  const oak = page.locator('[data-catalog-unit="oakBoss"]');
  await expect(
    oak.getByRole("rowheader", { name: "Spawns", exact: true })
  ).toHaveCount(0);
  await expect(
    oak.locator('.CatalogDrops .FrameScroll a[href*="#oakchest"]')
  ).toHaveCount(1);
});

test("structure contents and all factory door colors have valid keys and station links", async ({
  page,
}) => {
  await page.goto("/game-design/cells/structures.html");
  await expect(
    page.getByLabel("Structures contents", { exact: true })
  ).toBeVisible();
  for (const id of [
    "doors",
    "boat",
    "jetty",
    "furniture",
    "bonfire",
    "workstations",
  ])
    await expect(page.locator("#" + id)).toBeAttached();
  for (const name of ["wood door", "iron door", "gold door", "earth door"])
    await expect(
      page.getByRole("columnheader").filter({ hasText: new RegExp(name, "i") })
    ).toHaveCount(1);
  for (const target of ["crafting", "forging", "brewing"])
    expect(
      await page.locator(`main a[href*="/${target}.html"]`).count()
    ).toBeGreaterThan(0);
});

test("plant contents group forest and desert and Rotten has a real stump icon", async ({
  page,
}) => {
  await page.goto("/game-design/cells/plants.html");
  const contents = page.locator(".CatalogOverview");
  await expect(contents).toContainText("Forest");
  await expect(contents).toContainText("Desert");
  await expect(contents.locator('a[href*="#rotten"] .Pixels svg')).toHaveCount(
    1
  );
});

test("sprite catalog searches native NPC and facing variants with page links", async ({
  page,
}) => {
  await page.goto("/game-design/rendering/sprites.html");
  const gallery = page.getByRole("region", {
    name: "Existing sprites and variations",
  });
  await gallery.scrollIntoViewIfNeeded();
  await gallery
    .getByRole("textbox", { name: "Find sprite" })
    .fill("units.earthTrader");
  await expect(gallery.locator("tbody")).toContainText("units.earthTrader");
  expect(
    await gallery.locator('a[href*="#earthtrader"]').count()
  ).toBeGreaterThan(0);
  await gallery
    .getByRole("textbox", { name: "Find sprite" })
    .fill("woodStickAir2.facing");
  await expect(gallery.locator("tbody")).toContainText("facing.up");
});

test("Welcome atlas retains zero and uses gray headers", async ({ page }) => {
  await page.goto("/index.html");
  const zero = page
    .locator(".GlyphAtlas")
    .getByRole("columnheader", { name: "0", exact: true });
  await expect(zero).toBeAttached();
  await expect(zero.locator(".Text")).toHaveCSS("color", "rgb(128, 128, 128)");
});

test("scenario destinations update the top preview for same-page hashes and SPA navigation", async ({
  page,
}) => {
  await page.goto("/game-design/world/island.html#scenario-earth");
  await expect(page.locator('[data-scene="game"] iframe')).toHaveAttribute(
    "src",
    /#game\/earth$/
  );
  await page.goto("/game-design/world/island.html#scenario-haven");
  await expect(page.locator('[data-scene="game"] iframe')).toHaveAttribute(
    "src",
    /#game\/haven$/
  );
  await page.goto("/intro/play.html");
  await page.locator('main table a[href$="#scenario-oak"]').click();
  await expect(page.locator('main[aria-busy="false"]')).toBeVisible();
  await expect(page.locator('[data-scene="game"] iframe')).toHaveAttribute(
    "src",
    /#game\/oak$/
  );
  await page.locator('main table a[href$="#scenario-worm"]').first().click();
  await expect(page.locator('[data-scene="game"] iframe')).toHaveAttribute(
    "src",
    /#game\/worm$/
  );
});
