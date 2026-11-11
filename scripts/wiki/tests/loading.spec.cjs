const { test, expect } = require("./fixtures.cjs");

test("unavailable Markdown reports an error while navigation remains usable", async ({
  page,
}) => {
  await page.route("**/touch.*.md", (route) =>
    route.fulfill({ status: 404, body: "Missing" })
  );
  await page.goto("/game-design/controls/touch.html");
  await expect(page.getByRole("alert")).toContainText(
    "Could not load wiki/touch.md"
  );
  await page.locator('nav a[aria-label="Keyboard/Mouse"]').click();
  await expect(page.locator("h1")).toHaveAccessibleName("Keyboard/Mouse");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

for (const width of [1440, 390]) {
  test(`navigation keeps the current page and scroll until Markdown is ready at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/game-design/controls/interface.html");
    let release;
    const response = new Promise((resolve) => {
      release = resolve;
    });
    let requested = false;
    await page.route("**/touch.*.md", async (route) => {
      requested = true;
      await response;
      await route.continue();
    });
    try {
      const main = page.locator("main");
      await main.evaluate((node) => {
        node.dataset.navigationMarker = "current";
      });
      const controls = await main.locator(".PageControls").textContent();
      await page.evaluate(() => window.scrollTo(0, 300));
      const scroll = await page.evaluate(() => window.scrollY);
      await page.screenshot({
        path: testInfo.outputPath("before-navigation.png"),
      });
      await page
        .locator('nav a[aria-label="Touch"]')
        .evaluate((link) => link.click());
      await expect.poll(() => requested).toBe(true);
      await expect(main).toHaveAttribute("aria-busy", "true");
      await expect(page.locator("h1")).toHaveAccessibleName("Interface");
      await expect(main).toHaveAttribute("data-navigation-marker", "current");
      expect(await main.locator(".PageControls").textContent()).toBe(controls);
      await expect(main).not.toContainText("Loading...");
      expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
      await page.screenshot({
        path: testInfo.outputPath("pending-navigation.png"),
      });
      release();
      await expect(main).toHaveAttribute("aria-busy", "false");
      await expect(page.locator("h1")).toHaveAccessibleName("Touch");
      await expect(main).not.toHaveAttribute(
        "data-navigation-marker",
        "current"
      );
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath("after-navigation.png"),
      });
    } finally {
      release();
    }
  });
}

test("a superseded request cannot replace the latest page", async ({
  page,
}) => {
  await page.goto("/game-design/controls/interface.html");
  let release;
  const response = new Promise((resolve) => {
    release = resolve;
  });
  let requested = false;
  await page.route("**/touch.*.md", async (route) => {
    requested = true;
    await response;
    await route.continue();
  });
  try {
    await page.locator('nav a[aria-label="Touch"]').click();
    await expect.poll(() => requested).toBe(true);
    await page.locator('nav a[aria-label="Keyboard/Mouse"]').click();
    await expect(page.locator("h1")).toHaveAccessibleName("Keyboard/Mouse");
    release();
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("h1")).toHaveAccessibleName("Keyboard/Mouse");
    await expect(page).toHaveURL(/game-design\/controls\/keyboard-mouse.html$/);
  } finally {
    release();
  }
});

test("a failed navigation keeps the current content and can recover", async ({
  page,
}) => {
  await page.goto("/game-design/controls/interface.html");
  await page.route("**/touch.*.md", (route) =>
    route.fulfill({ status: 404, body: "Missing" })
  );
  await page.locator('nav a[aria-label="Touch"]').click();
  await expect(page.getByRole("alert")).toContainText(
    "Could not load wiki/touch.md"
  );
  await expect(page.locator("h1")).toHaveAccessibleName("Interface");
  await page.locator('nav a[aria-label="Keyboard/Mouse"]').click();
  await expect(page.locator("h1")).toHaveAccessibleName("Keyboard/Mouse");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
