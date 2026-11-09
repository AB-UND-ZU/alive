const { test, expect } = require("@playwright/test");

async function expectSolid(page, clip, color, label) {
  const screenshot = await page.screenshot({ clip });
  const differences = await page.evaluate(
    async ({ base64, color }) => {
      const image = new Image();
      image.src = "data:image/png;base64," + base64;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      const rgb = [1, 3, 5].map((start) =>
        parseInt(color.slice(start, start + 2), 16)
      );
      let differences = 0;
      for (let i = 0; i < data.length; i += 4)
        for (let channel = 0; channel < 3; channel++)
          if (data[i + channel] !== rgb[channel]) differences++;
      return differences;
    },
    { base64: screenshot.toString("base64"), color }
  );
  expect(differences, label).toBe(0);
}

test("the bottom terminal edge stays inside the centered game frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1214, height: 774 });
  await page.goto("/preview.html?test#game");
  await expect(page.locator(".ControlsEdge")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const terminal = await page.locator(".Terminal").boundingBox();
  const edge = await page.locator(".ControlsEdge").boundingBox();
  const lineWidth = await page
    .locator(".ControlsEdge")
    .evaluate((row) =>
      Array.from(row.children).reduce(
        (width, cell) => width + cell.getBoundingClientRect().width,
        0
      )
    );
  expect(lineWidth).toBeGreaterThanOrEqual(edge.width);
  await expectSolid(
    page,
    {
      x: 20,
      y: Math.ceil(edge.y + 1),
      width: Math.floor(terminal.x - 40),
      height: Math.floor(edge.height - 2),
    },
    "#000000"
  );
  await expectSolid(
    page,
    {
      x: Math.ceil(terminal.x + terminal.width + 20),
      y: Math.ceil(edge.y + 1),
      width: Math.floor(1214 - terminal.x - terminal.width - 40),
      height: Math.floor(edge.height - 2),
    },
    "#000000"
  );
});
