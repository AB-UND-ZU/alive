const { test, expect } = require("./fixtures.cjs");

for (const width of [1214, 390]) {
  test(`sprite editor uses native tabs, character clicks and draft cancellation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/game-design/rendering/sprites.html");
    const preview = page.locator('[data-scene="sprites"]');
    await preview.scrollIntoViewIfNeeded();
    const code = preview.locator(".CodeSemantic");
    const iframe = preview.locator("iframe");
    await expect(iframe).toHaveAttribute("data-dialog", "pack");
    await expect(code).toContainText('name: "Sprite #1"');
    await expect(code).toContainText("colors.maroon");
    const frame = await (await iframe.elementHandle()).contentFrame();
    await expect(frame.locator("#content")).toHaveAttribute("data-rows", "9");
    await frame.locator("#right").click();
    await expect(iframe).toHaveAttribute("data-dialog", "sprite");
    await frame.locator("#right").click();
    await frame.locator("#right").click({ delay: 250 });
    await expect(iframe).toHaveAttribute("data-dialog", "layer");
    await frame.locator(".Terminal").click({ position: { x: 4, y: 4 } });
    await page.keyboard.press("Escape");
    await expect(iframe).toHaveAttribute("data-dialog", "sprite");
    await frame.locator("#right").click();
    await frame.locator("#right").click({ delay: 250 });
    await expect(iframe).toHaveAttribute("data-dialog", "layer");
    const content = await frame.locator("#content").boundingBox();
    await frame.locator("#content").click({
      position: {
        x: (content.width / 17) * 1.5,
        y: (content.height / 9) * 4.5,
      },
    });
    await expect(iframe).toHaveAttribute("data-dialog", "sprite");
    await expect(code).toContainText('char: "a"');
    const bounds = await iframe.boundingBox();
    expect(bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.height).toBe(576);
    await frame.locator("#close").click();
    await expect(iframe).toHaveAttribute("data-dialog", "");
    await expect(preview.locator(".CodeBlock")).toBeVisible();
    await expect(code).toHaveText("");
    await frame.evaluate(() => window.location.reload());
    await expect(iframe).toHaveAttribute("data-dialog", "pack");
    await expect(code).toContainText('char: "a"');
  });
}
