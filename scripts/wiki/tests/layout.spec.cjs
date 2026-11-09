const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.EventSource = class {
      close() {}
    };
  });
});

test("Contents groups start together and only stacked group rows have a gap", async ({
  page,
}) => {
  await page.goto("/game-design/items/resources.html");
  const overview = page.locator(".CatalogOverview").first();
  expect(await overview.locator(".FrameEdge .Row").first().evaluate(row =>
    Array.from(row.querySelectorAll(".Cell")).map(cell =>
      cell.getAttribute("data-glyph") || Array.from(cell.querySelectorAll(".Layer")).pop()?.textContent || " "
    ).join("")
  )).toContain("CONTENTS");
  expect(
    await overview
      .locator(".FrameEdge .Layer, .FrameEdge svg rect")
      .evaluateAll((cells) =>
        cells.some(
          (cell) => getComputedStyle(cell)[cell.matches("rect") ? "fill" : "color"] === "rgb(0, 128, 0)"
        )
      )
  ).toBe(true);
  expect(
    await overview
      .locator(".FrameEdge .Layer, .FrameEdge svg rect")
      .evaluateAll((nodes) =>
        nodes.some(
          (node) =>
            getComputedStyle(node)[
              node.tagName.toLowerCase() === "rect" ? "fill" : "color"
            ] === "rgb(0, 128, 0)"
        )
      )
  ).toBe(true);
  const grid = overview.locator(".CatalogGrouped");
  const geometry = await grid.evaluate((node) => ({
    columns: getComputedStyle(node).gridTemplateColumns.split(" ").length,
    gap: parseFloat(getComputedStyle(node).rowGap),
    groups: [...node.children].map((group) => ({
      top: group.getBoundingClientRect().top,
      bottom: group.getBoundingClientRect().bottom,
      margin: getComputedStyle(group).marginTop,
    })),
  }));
  expect(geometry.groups.length).toBeGreaterThan(geometry.columns);
  expect(geometry.gap).toBe(32);
  for (const group of geometry.groups.slice(0, geometry.columns)) {
    expect(group.top).toBe(geometry.groups[0].top);
    expect(group.margin).toBe("0px");
  }
  expect(
    geometry.groups[geometry.columns].top -
      Math.max(
        ...geometry.groups
          .slice(0, geometry.columns)
          .map((group) => group.bottom)
      )
  ).toBe(32);
});

test("unit drop frames fit their longest unbroken line", async ({ page }) => {
  await page.goto("/game-design/characters/enemies.html");
  const frames = page.locator(".CatalogDrops .CompactFrame");
  await expect(frames.first()).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
  const geometry = await frames.evaluateAll((nodes) =>
    nodes.map((node) => ({
      title: node.getAttribute("aria-label"),
      width: node.querySelector(".TextFrame").getBoundingClientRect().width,
      content: node.querySelector(".FrameInner").scrollWidth,
      lines: [...node.querySelectorAll(".Parts > span")].map(
        (line) => line.getBoundingClientRect().height
      ),
    }))
  );
  expect(geometry.length).toBeGreaterThan(2);
  for (const frame of geometry) {
    expect(frame.width).toBe(
      Math.max(3, Math.ceil(frame.content / 18) + 2, frame.title.length + 4) *
        18
    );
    expect(frame.lines.every((height) => height === 32)).toBe(true);
  }
});

test("damage uses a TypeScript source fence and native one-pixel tab gaps", async ({
  page,
}) => {
  await page.goto("/game-design/combat/damage.html");
  const code = page.locator('.CodeBlock[title="src/engine/systems/damage.ts"]');
  await expect(code.locator(".CodeSemantic")).toContainText(
    "const damage = attack <= 0"
  );
  const tabs = page.getByRole("tablist", { name: "Damage", exact: true });
  const boxes = await tabs
    .getByRole("tab")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().toJSON())
    );
  expect(boxes).toHaveLength(3);
  expect(boxes[1].left - boxes[0].right).toBe(2);
  expect(boxes[2].left - boxes[1].right).toBe(2);
});
