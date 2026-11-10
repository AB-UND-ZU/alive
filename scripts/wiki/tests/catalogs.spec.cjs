const { test, expect } = require("./fixtures.cjs");

test("class choices match the game selector and show compact progression", async ({
  page,
}) => {
  await page.goto("/game-design/characters/classes.html");
  const table = page.locator("main table").first();
  expect(await table.locator("thead th").allTextContents()).toEqual([
    "Class",
    "Rogue",
    "Knight",
    "Mage",
    "???",
  ]);
  const labels = await table.locator('tbody th[scope="row"]').evaluateAll(nodes => nodes.map(node => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".Pixels").forEach(sprite => sprite.remove());
    return copy.textContent;
  }));
  expect(labels.map((label) => label.toLowerCase())).toContain("extra stats");
  expect(labels.find((label) => label.startsWith("Level"))).toBe(
    "Level" + Array.from({ length: 10 }, (_, i) => "#" + (i + 1)).join("")
  );
  await expect(table.locator(".ClassLevel")).toHaveCount(40);
  await expect(table.locator(".ClassExtraStat")).toHaveCount(9);
  const progression = table.locator(".ClassLevel").first();
  await expect(progression).toContainText(/2\s*5/);
  await expect(progression.locator(".Pixels")).toHaveCount(2);
  const gaps = await table.locator(".ClassLevel").evaluateAll((rows) =>
    rows.map((row) => {
      const hp = row
        .querySelector('a[href$="stats.html#stat-hp"]')
        .getBoundingClientRect();
      const mp = row
        .querySelector('a[href$="stats.html#stat-mp"]')
        .getBoundingClientRect();
      return {
        gap: mp.left - hp.right,
        hpWidth: hp.width,
        mpWidth: mp.width,
        aligned: hp.top === mp.top,
      };
    })
  );
  expect(gaps).toHaveLength(40);
  for (const row of gaps)
    expect(row).toEqual({ gap: 18, hpWidth: 54, mpWidth: 54, aligned: true });

  await expect(
    table.locator('a[href$="stats.html#stat-power"]')
  ).not.toHaveCount(0);
});

test("faction matrix follows the directional native friendly-fire rules", async ({
  page,
}) => {
  await page.goto("/game-design/characters/factions.html");
  const table = page.locator("main table").first();
  await expect(
    table.locator('.Pixels[aria-label="Wild to Unit: No hit"]')
  ).toHaveCount(0);
  await expect(
    table.locator('.Pixels[aria-label="Unit to Wild: Hit"]')
  ).toHaveCount(1);
  await expect(
    table.locator('.Pixels[aria-label="Settler to Fire: No hit"]')
  ).toHaveCount(0);
  await expect(
    table.locator('.Pixels[aria-label="Hostile to Hostile: No hit"]')
  ).toHaveCount(0);
});

test("container drops remain in a single family comparison with native dialogs", async ({
  page,
}) => {
  await page.goto("/game-design/cells/containers.html");
  const chest = page.locator('[data-catalog-family="chest"]');
  await expect(chest.locator("table")).toHaveCount(1);
  await expect(chest.locator(".DropDialog")).not.toHaveCount(0);
  await expect(page.locator('[data-unit="chestBoss"]')).toHaveCount(0);
  const portraits = await chest.locator(".LargePreview").evaluateAll((nodes) =>
    nodes.map((node) => ({
      width: node.firstElementChild.offsetWidth,
      height: node.offsetHeight,
    }))
  );
  expect(
    new Set(portraits.map((portrait) => JSON.stringify(portrait))).size
  ).toBe(1);
});

test("equipment parameters each have a documented stat anchor", async ({
  page,
}) => {
  await page.goto("/game-design/combat/stats.html");
  for (const name of [
    "duration",
    "range",
    "drain",
    "absorb",
    "retrigger",
    "fishing",
    "mining",
    "build",
    "addPower",
  ])
    await expect(page.locator(`#stat-${name.toLowerCase()}`)).toHaveCount(1);
  await page.goto("/game-design/items/resources.html");
  const overview = page.locator(".CatalogOverview");
  await expect(
    overview.locator('a[href$="resources.html#golem"], a[href="#golem"]')
  ).toHaveCount(1);
  await expect(overview.locator('a[href*="enemies.html#golem"]')).toHaveCount(
    0
  );
});

test("item comparisons show native consumption, aura and elemental bonuses", async ({
  page,
}) => {
  const row = (entry, label) =>
    entry
      .locator('th[scope="row"]')
      .filter({ hasText: new RegExp(label.split(" ").join("[\\s\\S]*") + "$", "i") })
      .locator("..");
  await page.goto("/game-design/characters/animals.html#fish");
  const fish = page.locator('[data-catalog-item="fish"]');
  await expect(row(fish, "Consume")).toHaveCount(1);
  await expect(row(fish, "Sell for").locator(".Item")).not.toHaveCount(0);
  await expect(row(fish, "Obtained from")).toContainText("Fishing");
  await page.goto("/game-design/items/consumables.html#potion");
  const potion = page.locator('[data-catalog-item="potion"]');
  await expect(
    row(potion, "Consume").locator('a[href*="stats.html#stat-"]')
  ).not.toHaveCount(0);
  await page.goto("/game-design/items/skills.html#totem");
  const totem = page.locator('[data-catalog-item="totem"]');
  const aura = totem
    .locator('th[scope="row"]')
    .filter({ hasText: /Aura$/ })
    .locator("..");
  await expect(aura).toHaveCount(1);
  for (const stat of ["power", "wisdom", "armor", "resist"])
    await expect(
      aura.locator(`[data-column="1"] a[href$="stats.html#stat-${stat}"]`)
    ).toHaveCount(1);
  await page.goto("/game-design/items/skills.html#slash");
  const slash = page.locator('[data-catalog-item="slash"]');
  const knock = slash
    .locator('th[scope="row"]')
    .filter({ hasText: /Knock$/ })
    .locator("..");
  await expect(knock.locator('[data-column="1"]')).toContainText("2");
  await page.goto("/game-design/items/gear.html#sword");
  const sword = page.locator('[data-catalog-item="sword"]');
  await expect(row(sword, "Extra stats")).toHaveCount(1);
  await expect(row(sword, "Obtained from")).not.toContainText("Test Mode");
  await expect(
    row(sword, "Obtained from").locator(".RecipeSource")
  ).not.toHaveCount(0);
  await expect(
    row(sword, "Equipped").locator('.Pixels[aria-label="Equipped Scout"]')
  ).not.toHaveCount(0);
});

test("catalogs show native adds, complete accessory upgrades and multi-cell plant portraits", async ({
  page,
}) => {
  await page.goto("/game-design/characters/enemies.html");
  const golem = page.locator('[data-catalog-unit="golem"]');
  const limb = golem.locator('[data-unit="golemLimb"]');
  await expect(golem).toHaveCount(1);
  await expect(limb).toHaveCount(1);
  await expect(page.locator('[data-catalog-unit="golemLimb"]')).toHaveCount(0);
  const portraitColumns = await golem
    .locator("[data-unit]")
    .evaluateAll((nodes) => nodes.map((node) => node.dataset.unit));
  expect(portraitColumns).toEqual(["golem", "golemLimb"]);
  await expect(
    page.locator(
      '.CatalogOverview a[href$="#oakhedge1"], .CatalogOverview a[href$="#oakhedge2"]'
    )
  ).toHaveCount(0);
  await expect(page.locator('[data-unit="oakHedge1"]')).toHaveCount(1);

  const damage = golem.getByRole("row", { name: /^Damage/ });
  await expect(damage).toHaveCount(1);
  await page.goto("/game-design/cells/plants.html");
  await expect(page.locator("#world-tree thead")).toContainText("Tree 1");
  await expect(page.locator("#world-tree thead")).toContainText("Tree 2");
  await expect(page.locator("#world-tree thead")).toContainText("Apple");
  const rotten = page.locator('[data-catalog-unit="rotten"] .LargePreview');
  await expect(rotten).toHaveCount(1);
  expect(await rotten.evaluate((e) => e.scrollWidth)).toBeGreaterThan(9 * 18);
  await page.goto("/game-design/cells/units.html");
  await expect(page.locator('[data-catalog-unit="sign"]')).toHaveCount(1);
  await page.goto("/game-design/items/gear.html");
  for (const name of ["torch", "boots"]) {
    const entry = page.locator(`[data-catalog-item="${name}"]`);
    await expect(entry.locator("thead th.GridValue")).toHaveText([
      new RegExp(name, "i"),
      "Wood",
      "Iron",
      "Gold",
    ]);
  }
});
