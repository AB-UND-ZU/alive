const { test, expect } = require("./fixtures.cjs");

test("harvesting identifies native targets and construction remains with sprites", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/game-design/interactions/harvesting.html");
  const table = page.locator("main table").first();
  const targets = table.locator('tbody [data-column="0"]');
  for (const name of [
    "Desert Palm Husk",
    "Burnt Fence Door",
    "Broken Palisade Door",
    "Mountain",
    "Plot",
    "Hedge One",
    "Hedge Two",
    "Cactus One",
    "Cactus Two",
  ])
    await expect(targets.locator(`.Pixels[aria-label="${name}"]`)).toHaveCount(
      1
    );
  expect(await targets.allTextContents()).not.toEqual(
    expect.arrayContaining(["desert_husk", "hinge", "footing", "plot"])
  );
  await expect(
    targets.locator('a[href$="building.html"] .Pixels[aria-label="Plot"]')
  ).toHaveCount(1);
  await expect(
    targets.locator('a[href$="terrain.html"] .Pixels[aria-label="Sand"]')
  ).toHaveCount(1);
  await expect(
    targets.locator(
      'a[href$="plants.html#hedge1"] .Pixels[aria-label="Hedge One"]'
    )
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("farming shows grown cells and native plant variants", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/game-design/interactions/farming.html");
  const results = page.locator('main table tbody [data-column="1"]');
  for (const name of [
    "Hedge One",
    "Hedge Two",
    "Cactus One",
    "Cactus Two",
    "Apple Tree",
    "Banana Palm",
    "Coconut Palm",
  ])
    await expect(results.locator(`.Pixels[aria-label="${name}"]`)).toHaveCount(
      1
    );
  await expect(results.locator('a[href*="/development/"]')).toHaveCount(0);
  expect(await results.allTextContents()).not.toEqual(
    expect.arrayContaining(["hedge", "cactus", "apple", "banana", "coconut"])
  );
  expect(errors).toEqual([]);
});
