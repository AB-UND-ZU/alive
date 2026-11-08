const { test, expect } = require("@playwright/test");

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
test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    window.EventSource = class {
      close() {}
    };
  });
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
test("copying an item omits both font icons and composed sprites", async ({
  page,
}) => {
  await page.goto("/game-design/interactions/crafting.html");
  const item = page.locator("main .Item").first();
  const expected = await item.textContent();
  expect(expected.length).toBeGreaterThan(0);
  expect(await copy(page, item)).toBe(expected);
  expect(await item.locator("svg").allTextContents()).toEqual(
    Array(await item.locator("svg").count()).fill("")
  );
});

test("readable Unicode uses the native glyph and copies unchanged", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/development/wiki/codepage.html");
  await page.evaluate(() => document.fonts.ready);
  const sameGlyph = await page.evaluate(async () => {
    await document.fonts.load('32px "Alive Wiki DOS"', "↑");
    await document.fonts.load('32px "Perfect DOS VGA 437 Win"', "ė");
    const pixels = (font, text) => {
      const canvas = document.createElement("canvas");
      canvas.width = 40;
      canvas.height = 40;
      const context = canvas.getContext("2d");
      context.font = `32px "${font}"`;
      context.fillText(text, 0, 32);
      return [...context.getImageData(0, 0, 40, 40).data];
    };
    const readable = pixels("Alive Wiki DOS", "↑");
    const original = pixels("Perfect DOS VGA 437 Win", "ė");
    return {
      loaded: document.fonts.check('32px "Alive Wiki DOS"', "↑"),
      visible: readable.some((value) => value !== 0),
      equal: readable.every((value, index) => value === original[index]),
    };
  });
  expect(sameGlyph).toEqual({ loaded: true, visible: true, equal: true });
  const source = page.locator("main").getByText("↑", { exact: true });
  const expected = await source.textContent();
  expect(expected).toBe("↑");
  expect(await copy(page, source)).toBe(expected);
  expect(errors).toEqual([]);
});
