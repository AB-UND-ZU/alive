const { test, expect } = require("@playwright/test");

test("walking stops at a mountain and reset restores the starting cell", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto("/controls.html");
  const scene = page.locator('[data-scene="movement"]');
  const screen = scene.locator(".scene-screen");
  await expect(screen).toHaveAttribute("data-x", "1");
  for (let i = 0; i < 8; i++)
    await scene.getByRole("button", { name: "Play", exact: true }).click();
  await expect(screen).toHaveAttribute("data-x", "5");
  await scene.getByRole("button", { name: "Up", exact: true }).click();
  await expect(screen).toHaveAttribute("data-y", "1");
  await scene.getByRole("button", { name: "Reset" }).click();
  await expect(screen).toHaveAttribute("data-x", "1");
  await expect(screen).toHaveAttribute("data-y", "2");
});

test("the hero wades near shore and cannot walk into deep water", async ({
  page,
}) => {
  await page.goto("/world.html");
  const scene = page.locator('[data-scene="water"]');
  for (let i = 0; i < 9; i++)
    await scene.getByRole("button", { name: "Play", exact: true }).click();
  await expect(scene.locator(".scene-screen")).toHaveAttribute("data-x", "3");
});

test("a crate moves into free space and stops against a mountain", async ({
  page,
}) => {
  await page.goto("/world.html");
  const scene = page.locator('[data-scene="pushing"]');
  for (let i = 0; i < 10; i++)
    await scene.getByRole("button", { name: "Play", exact: true }).click();
  await expect(scene.locator(".scene-screen")).toHaveAttribute("data-x", "5");
});

test("recipe references use current ingredients and pause and reset their cycle", async ({
  page,
}) => {
  await page.goto("/making.html");
  const scene = page.locator('[data-scene="crafting"]');
  await expect(scene).toContainText("3 × Leaf");
  await scene.getByRole("button", { name: "Play", exact: true }).click();
  await expect(scene).toContainText("10 × Stick");
  const screen = scene.locator(".scene-screen");
  await scene.getByRole("button", { name: "Auto", exact: true }).click();
  await expect(screen).toHaveAttribute("data-index", "2");
  await scene.getByRole("button", { name: "Pause", exact: true }).click();
  const index = await screen.getAttribute("data-index");
  await page.waitForTimeout(1000);
  await expect(screen).toHaveAttribute("data-index", index);
  await scene.getByRole("button", { name: "Reset" }).click();
  await expect(screen).toHaveAttribute("data-index", "0");
  await expect(
    scene.getByRole("button", { name: "Auto", exact: true })
  ).toHaveAttribute("aria-pressed", "false");
});

test("every Markdown page and scene loads without broken local links or page errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/index.html");
  const links = await page
    .locator('nav a[href$=".html"]')
    .evaluateAll((items) => items.map((item) => item.getAttribute("href")));
  for (const link of links) {
    await page.goto("/" + link);
    await expect(page.locator("h1")).toHaveCount(1);
    for (const scene of await page.locator("[data-scene]").all()) {
      await expect(
        scene.getByRole("button", { name: "Play", exact: true })
      ).toBeVisible();
      await scene.getByRole("button", { name: "Play", exact: true }).click();
      await scene.getByRole("button", { name: "Reset" }).click();
    }
    for (const href of await page
      .locator("main a")
      .evaluateAll((items) => items.map((item) => item.getAttribute("href")))) {
      if (/^(https?:|#)/.test(href)) continue;
      const response = await page.request.get(new URL(href, page.url()).href);
      expect(response.status(), href).toBe(200);
    }
  }
  expect(errors).toEqual([]);
});

test("chapters work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/index.html");
  await page
    .getByRole("link", { name: "Controls", exact: true })
    .first()
    .click();
  await expect(page.locator("h1")).toHaveText("Controls");
  await context.close();
});

test("desktop and phone layouts keep text and controls within the page", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["/index.html", "/world.html", "/making.html"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    }
  }
});

test("automatic examples pause offscreen and reset cancels playback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto("/controls.html");
  const scene = page.locator('[data-scene="movement"]');
  await scene.getByRole("button", { name: "Auto", exact: true }).click();
  await expect(
    scene.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(
    scene.getByRole("button", { name: "Auto", exact: true })
  ).toHaveAttribute("aria-pressed", "false");
  await scene.getByRole("button", { name: "Auto", exact: true }).click();
  await scene.getByRole("button", { name: "Reset", exact: true }).click();
  await page.waitForTimeout(1000);
  await expect(scene.locator(".scene-screen")).toHaveAttribute("data-x", "1");
  await scene.getByRole("button", { name: "Play", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(scene.locator(".scene-screen")).toHaveAttribute("data-x", "2");
});
