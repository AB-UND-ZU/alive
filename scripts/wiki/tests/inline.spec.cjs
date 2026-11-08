const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.EventSource = class {
      close() {}
    };
  });
});

test("ordinary gameplay prose preserves words and punctuation as selectable text", async ({
  page,
}) => {
  await page.goto("/game-design/items/gear.html");
  const paragraph = page.locator("main p").first();
  await expect(paragraph).toContainText("Gear holds equipped weapons,");
  await expect(paragraph).toContainText("and tools.");
  await expect(
    paragraph.getByRole("link", { name: "tools.", exact: true })
  ).toBeVisible();
  await expect(
    paragraph.locator(".RichMention").filter({ hasText: /^item$/i })
  ).toHaveCount(0);
  expect(
    await paragraph.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    })
  ).toContain("and tools.");
});

test("a linked name and its trailing punctuation stay together without recoloring punctuation", async ({
  page,
}) => {
  await page.goto("/development/ui/paused.html");
  const link = page.locator('main p a[href$="savegames.html"]');
  await expect(link).toBeVisible();
  const word = link.locator(".RichText");
  await expect(word).toHaveText("Savegames.");
  for (const width of [270, 306, 342]) {
    await link.evaluate(
      (node, width) => (node.closest("p").style.width = `${width}px`),
      width
    );
    const boxes = await word.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()]
        .filter((rect) => rect.width > 0)
        .map((rect) => rect.top);
    });
    expect(new Set(boxes).size).toBe(1);
  }
  await link.hover();
  await expect(word.locator(".LinkText")).toHaveCSS(
    "color",
    "rgb(0, 255, 255)"
  );
  await expect(word.locator(".TextSuffix .Text")).toHaveCSS(
    "color",
    "rgb(192, 192, 192)"
  );
});
