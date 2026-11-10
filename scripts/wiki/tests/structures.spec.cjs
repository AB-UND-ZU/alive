const { test, expect } = require("./fixtures.cjs");
test("Structures compares native exterior and interior buildings and nonattackable devices", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/game-design/cells/structures.html");
    for (const name of [
      "Wood House exterior",
      "Desert Fort exterior",
      "Wood House interior",
      "Desert Fort interior",
    ]) {
      await expect(page.getByLabel(name, { exact: true })).toHaveCount(1);
    }
    await expect(page.locator("main")).toContainText("Wood House");
    await expect(page.locator("main")).toContainText("Desert Fort");
    await expect(page.locator("main")).toContainText(
      "Portals cannot be attacked"
    );
    await expect(page.locator("main")).toContainText(
      "Levers cannot be attacked"
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      )
    ).toBe(false);
  }
});
