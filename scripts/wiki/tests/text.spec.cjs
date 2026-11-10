const { test, expect } = require("./fixtures.cjs");

test("technical inline code keeps constants and wraps without changing copied source", async ({
  page,
}) => {
  await page.goto("/development/engine/snapshot.html");
  const constant = page
    .locator("main code")
    .filter({ hasText: /^Infinity\.?$/ })
    .locator(".NativeText")
    .first();
  await expect(constant).toHaveText("Infinity");
  await expect(constant.locator('[aria-label="99+"]')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, source] of [
    ["/development/wiki/app.html", "development/<group>/<source>.html"],
    ["/development/wiki/scenes.html", "Dimensions.topHudRows"],
    ["/development/wiki/equippedpreview.html", "createItemInInventory"],
  ]) {
    await page.goto(route);
    const code = page
      .locator("main code")
      .filter({ hasText: source })
      .first()
      .locator(".NativeText")
      .first();
    await code.scrollIntoViewIfNeeded();
    expect(
      await code.evaluate((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        return selection.toString();
      })
    ).toBe(source);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      )
    ).toBe(false);
  }
  await page.goto("/development/engine/game/assets/descriptions.html");
  await expect(
    page.getByRole("heading", {
      name: "PartialDescriptionTemplate",
      exact: true,
    })
  ).toHaveText("PartialDescriptionTemplate");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false);
});
const copyKey = process.platform === "darwin" ? "Meta+C" : "Control+C";
test.beforeEach(async ({ context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});
async function copy(page, locator) {
  await locator.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.keyboard.press(copyKey);
  return page.evaluate(() => navigator.clipboard.readText());
}
test("prose uses continuous text and copies without letter breaks", async ({
  page,
}) => {
  await page.goto("/index.html");
  const prose = page.locator("main > p").first();
  const expected =
    "ASCII-based 2D adventure game. Using React and Three.js (with react-three-fiber).";
  await expect(prose).toHaveText(expected);
  expect(await prose.locator("*").count()).toBeLessThan(12);
  await expect(prose.locator(".Row, .Cell, svg")).toHaveCount(0);
  expect(await copy(page, prose)).toBe(expected);
});
test("double clicking selects a complete word in the font run", async ({
  page,
}) => {
  await page.goto("/index.html");
  await page.evaluate(() => document.fonts.ready);
  const point = await page
    .locator("main > p")
    .first()
    .evaluate((node) => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walker.nextNode())) {
        const index = text.textContent.indexOf("adventure");
        if (index >= 0) {
          const range = document.createRange();
          range.setStart(text, index);
          range.setEnd(text, index + 9);
          const box = range.getBoundingClientRect();
          return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        }
      }
    });
  await page.mouse.dblclick(point.x, point.y);
  expect(await page.evaluate(() => getSelection().toString())).toBe(
    "adventure"
  );
});
test("copying an item retains its name and normalizes cell spacing", async ({
  page,
}) => {
  await page.goto("/game-design/interactions/crafting.html");
  const item = page.locator("main .Item").first();
  const expected = await item.textContent();
  expect(expected.length).toBeGreaterThan(0);
  expect(await copy(page, item)).toBe(expected.replaceAll("\u00a0", " "));
  expect(await item.locator("svg").allTextContents()).toEqual(
    Array(await item.locator("svg").count()).fill("")
  );
});

test("readable Unicode uses existing sprites and copies unchanged", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/development/wiki/codepage.html");
  await page.evaluate(() => document.fonts.ready);
  const glyph = page
    .locator("main .ReadableGlyph")
    .filter({ hasText: "↑" })
    .first();
  await expect(glyph.locator(".ReadableGlyphSprite .Layer")).toHaveText("ė");
  await expect(glyph.locator(".ReadableGlyphSprite .Layer")).toBeVisible();
  const source = page.locator("main").getByText("↑", { exact: true });
  const expected = await source.textContent();
  expect(expected).toBe("↑");
  expect(await copy(page, source)).toBe(expected);
  expect(await copy(page, glyph)).toBe(expected);
  expect(errors).toEqual([]);
});

test("glyph underlines stay behind wrapped links and never enter copied prose", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/index.html");
    const link = page.locator(
      'main a[href="https://en.wikipedia.org/wiki/Code_page_437"]'
    );
    const paragraph = link.locator("xpath=ancestor::p");
    const expected = await paragraph.textContent();
    await link.scrollIntoViewIfNeeded();
    const text = link.locator(".LinkText");
    await expect(text).toHaveCSS("text-decoration-line", "none");
    await expect(text).not.toHaveCSS("background-image", "none");
    const normal = await text.evaluate(
      (node) => getComputedStyle(node).backgroundImage
    );
    expect(decodeURIComponent(normal)).toContain("<rect");
    expect(await copy(page, paragraph)).toBe(expected);
    await page.evaluate(() => getSelection().removeAllRanges());
    await link.hover();
    await expect(text).toHaveCSS("color", "rgb(0, 255, 255)");
    expect(
      await text.evaluate((node) => getComputedStyle(node).backgroundImage)
    ).not.toBe(normal);
    expect(await copy(page, paragraph)).toBe(expected);
    expect(expected).not.toMatch(/[_\n]/);
  }
});
