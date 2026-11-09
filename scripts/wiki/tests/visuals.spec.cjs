const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.EventSource = class {
      close() {}
    };
  });
});

const fills = (locator) =>
  locator.evaluateAll((roots) => {
    const nodes = roots
      .flatMap((root) => [
        root,
        ...root.querySelectorAll("svg rect, .Layer, .NativeText"),
      ])
      .filter((node) => node.matches("svg rect, .Layer, .NativeText"));
    return [
      ...new Set(
        nodes.map(
          (node) =>
            getComputedStyle(node)[
              node.matches("rect") ? "fill" : "color"
            ]
        )
      ),
    ];
  });

test("item links underline and recolor only the name", async ({ page }) => {
  await page.goto("/crafting.html");
  const item = page
    .locator("main .Item")
    .filter({ has: page.locator(".Text:not(.LinkText)") })
    .first();
  const count = item.locator(".TextPrefix > .Text");
  const name = item.locator(".LinkText");
  await expect(name.first()).toBeVisible();
  expect(await fills(count)).toEqual(["rgb(128, 128, 128)"]);
  expect(await fills(name)).toEqual(["rgb(128, 128, 128)"]);
  await expect(name.first()).toHaveCSS("text-decoration-line", "none");
  await expect(name.first()).toHaveCSS("background-image", "none");

  const icon = item.locator(".TextPrefix > .Pixels");
  const iconColors = await fills(icon);
  await item.hover();
  expect(await fills(name)).toEqual(["rgb(0, 255, 255)"]);
  await expect(name.first()).toHaveCSS("text-decoration-line", "none");
  await expect(name.first()).not.toHaveCSS("background-image", "none");
  expect(await fills(count)).toEqual(["rgb(128, 128, 128)"]);
  expect(await fills(icon)).toEqual(iconColors);
  await page.goto("/npcs.html");
  const friendlyName = page
    .locator(".CatalogIndex .LinkText")
    .first()
    .locator(":scope");
  await expect(friendlyName.first()).toBeVisible();
  expect(await fills(friendlyName)).toEqual(["rgb(0, 128, 0)"]);
});

test("game buttons show one native idle, hover or pressed face", async ({
  page,
}) => {
  await page.goto("/crafting.html");
  const button = page.getByRole("button", { name: "< Back", exact: true });
  await button.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(button.locator(".StateIdle")).toBeVisible();
  await expect(button.locator(".StateHover")).toBeHidden();
  await button.hover();
  await expect(button.locator(".StateIdle")).toBeHidden();
  await expect(button.locator(".StateHover")).toBeVisible();
  await page.mouse.down();
  await expect(button.locator(".StateHover")).toBeHidden();
  await expect(button.locator(".StatePressed")).toBeVisible();
  await page.mouse.move(0, 0);
  await page.mouse.up();
});

test("catalog overview frame stays on the character grid", async ({ page }) => {
  for (const width of [1440, 600]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/resources.html");
    const frame = page
      .locator(".FrameScroll")
      .filter({ has: page.locator(".CatalogIndex") })
      .first();
    await expect(frame).toBeVisible();
    const geometry = await frame.locator(".TextFrame").evaluate((element) => {
      const edges = [...element.querySelectorAll(":scope > .FrameEdge")];
      return {
        width: element.getBoundingClientRect().width,
        edges: edges.map((edge) => ({
          width: edge.getBoundingClientRect().width,
        })),
      };
    });
    expect(geometry.width % 18).toBe(0);
    expect(geometry.edges).toHaveLength(2);
    for (const edge of geometry.edges) expect(edge.width).toBe(geometry.width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width);
  }
});

test("catalog comparisons show supported variants with their real stats", async ({
  page,
}) => {
  await page.goto("/game-design/items/gear.html#sword");
  const sword = page.locator('[data-catalog-item="sword"]');
  const headers = await sword.locator("thead th.GridValue").allTextContents();
  const earth = headers.indexOf("Ruby Earth");
  expect(earth).toBeGreaterThan(0);
  const melee = sword
    .locator('th[scope="row"]')
    .filter({ hasText: /Melee$/ })
    .locator("..")
    .locator(`[data-column="${earth}"]`);
  await expect(melee).toHaveText(/1\s*0.*Melee/);
  await expect(melee.locator('a[href$="stats.html#stat-melee"]')).toHaveCount(
    1
  );
  await expect(
    sword
      .locator("tr")
      .filter({ hasText: "Info" })
      .locator(`[data-column="${earth}"] .Pixels[aria-label="Ruby"]`)
  ).toHaveCount(1);
  await expect(
    sword.locator("tr").filter({ hasText: "Sprite" }).locator(".LargePreview")
  ).toHaveCount(headers.length - 1);
  await expect(page.locator('.CatalogIndex a[href="#sword"]')).toHaveCount(1);
  await page.goto("/game-design/characters/classes.html");
  const classes = page.locator("main table");
  expect(await classes.locator("thead th.GridValue").allTextContents()).toEqual(
    ["Class", "Rogue", "Knight", "Mage", "???"]
  );
  await expect(classes.locator(".ClassLevel")).toHaveCount(40);
  const progression = classes
    .locator('th[scope="row"]')
    .filter({ hasText: /^Level#1/ })
    .locator("..");
  for (const [column, firstHp, firstMp, capHp, capMp] of [
    [1, 25, 10, 50, 25],
    [2, 30, 5, 60, 15],
    [3, 20, 15, 40, 35],
    [4, 15, 0, 15, 0],
  ]) {
    const levels = progression.locator(`[data-column="${column}"] .ClassLevel`);
    await expect(levels).toHaveCount(10);
    for (const [index, hp, mp] of [
      [0, firstHp, firstMp],
      [9, capHp, capMp],
    ]) {
      await expect(
        levels.nth(index).locator('a[href$="stats.html#stat-hp"]')
      ).toContainText(new RegExp(String(hp).split("").join("\\s*")));
      await expect(
        levels.nth(index).locator('a[href$="stats.html#stat-mp"]')
      ).toContainText(new RegExp(String(mp).split("").join("\\s*")));
    }
  }
  const extra = classes
    .locator('th[scope="row"]')
    .filter({ hasText: /^Extra.*stats$/i })
    .locator("..");
  await expect(extra.locator('[data-column="1"]')).toContainText(/\+\s*1.*Power/);
  await expect(extra.locator('[data-column="1"]')).toContainText(/\+\s*1.*Haste/);
  await expect(page.locator("main .CatalogVariant")).toHaveCount(0);
  await page.goto("/game-design/characters/enemies.html#prism");
  await expect(
    page.locator('[data-catalog-family="prism"] [data-unit]')
  ).toHaveCount(2);
});

test("category indexes link to canonical plant and element entries without duplicate catalogs", async ({
  page,
}) => {
  await page.goto("/game-design/cells/units.html");
  await expect(page.locator('[data-unit="cactus1"]')).toHaveCount(0);
  await expect(
    page.locator('.CatalogIndex a[href$="plants.html#cactus1"]')
  ).toHaveCount(0);
  await page.goto("/game-design/cells/plants.html#cactus1");
  await expect(page.locator('[data-unit="cactus1"]')).toBeVisible();
  await page.goto("/game-design/items/resources.html");
  await expect(page.locator('[data-catalog-item="fire"]')).toHaveCount(0);
  await expect(
    page.locator('.CatalogIndex a[href$="elements.html#water"]')
  ).toHaveCount(1);
  await page.goto("/game-design/items/elements.html#fire");
  await expect(page.locator('[data-catalog-item="fire"]')).toBeVisible();
});

test("long commands keep a whole input frame inside the phone viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game-design/interactions/chat.html");
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  await input.fill("/give sword 1 diamond earth");
  const target = input.locator("..");
  await expect
    .poll(async () => (await target.boundingBox()).width)
    .toBeLessThanOrEqual(390);
  const rows = await target
    .locator(".Pixels > .Row")
    .evaluateAll((rows) =>
      rows.map((row) => row.getBoundingClientRect().width)
    );
  expect(rows).toHaveLength(3);
  expect(new Set(rows).size).toBe(1);
  expect(rows[0] % 18).toBe(0);
  expect(rows[0]).toBe((await target.boundingBox()).width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  );
});

test("large tables scroll sideways with fixed row labels and natural height", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto("/index.html");
  const scroll = page.locator("#font-characters .TableScroll");
  await scroll.scrollIntoViewIfNeeded();
  await scroll.evaluate((element) => {
    element.scrollLeft = 108;
    element.scrollTop = 160;
  });
  const geometry = await scroll.evaluate((element) => ({
    left: element.getBoundingClientRect().left,
    first: element
      .querySelector('tbody [data-column="0"]')
      .getBoundingClientRect().left,
    edge: element.querySelector("tbody .GridFrozenEdge").getBoundingClientRect()
      .left,
    join: element
      .querySelector("tbody .GridRule .GridFrozenEdge")
      .getBoundingClientRect().left,
    firstWidth: element
      .querySelector('tbody [data-column="0"]')
      .getBoundingClientRect().width,
    height: element.clientHeight,
    contentHeight: element.scrollHeight,
    x: element.scrollLeft,
    y: element.scrollTop,
    headerPosition: getComputedStyle(element.querySelector("thead")).position,
    framed: !!element.querySelector(".FramedGrid"),
  }));
  expect(geometry.x).toBeGreaterThan(0);
  expect(geometry.y).toBe(0);
  expect(geometry.first).toBe(geometry.left);
  expect(geometry.edge).toBe(geometry.first + geometry.firstWidth);
  expect(geometry.join).toBe(geometry.edge);
  expect(geometry.height).toBe(geometry.contentHeight);
  expect(geometry.headerPosition).toBe("static");
  expect(geometry.framed).toBe(false);
});

test("phone table dividers stay between their columns while scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/development/engine/hooks.html");
  const table = page.locator("main .TableScroll").first();
  await table.scrollIntoViewIfNeeded();
  for (const x of [0, 90]) {
    await table.evaluate((node, offset) => (node.scrollLeft = offset), x);
    const geometry = await table.evaluate((node) => {
      const row = node.querySelector("tbody tr:not(.GridRule)");
      const first = row.querySelector('[data-column="0"]');
      const edge = row.querySelector(".GridFrozenEdge");
      return {
        firstRight: first.getBoundingClientRect().right,
        edgeLeft: edge.getBoundingClientRect().left,
        ruleLeft: edge.querySelector(".NativeRule").getBoundingClientRect()
          .left,
      };
    });
    expect(geometry.edgeLeft).toBe(geometry.firstRight);
    expect(geometry.ruleLeft).toBe(geometry.edgeLeft);
  }
});

test("three-row headings keep complete words with one empty row between wrapped words", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/development/wiki/visuals.html");
  const heading = page.locator("h1");
  await heading.scrollIntoViewIfNeeded();
  const geometry = await heading.evaluate((element) => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
    words: [...element.querySelectorAll(".HeadingWord")].map((word) => ({
      top: word.getBoundingClientRect().top,
      height: word.getBoundingClientRect().height,
      letters: [...word.querySelectorAll(".HeadingLetter")].map(
        (letter) => letter.getBoundingClientRect().top
      ),
    })),
  }));
  for (const word of geometry.words) {
    expect(word.height).toBe(96);
    expect(new Set(word.letters).size).toBe(1);
  }
  expect(geometry.words[1].top - geometry.words[0].top).toBe(128);
  expect(geometry.scrollWidth).toBeGreaterThan(geometry.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  );
});

test("a compact code dialog copies and selects only its source", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/development/wiki/codeblock.html");
  const dialog = page.locator(".CodeBlock").first();
  await expect(dialog).toHaveAttribute("title", "example.ts");
  expect(await dialog.locator(".CodeSemantic").textContent()).toBe(
    "const ready = 1;"
  );
  const selected = await dialog.locator(".CodeSemantic").evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return selection.toString();
  });
  expect(selected).toBe("const ready = 1;");
  await dialog.getByRole("button", { name: "Copy", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    selected
  );
  expect((await dialog.locator(".CodeBody").boundingBox()).width).toBeLessThan(
    500
  );
});

test("body glyphs use the font while callout lines and native keys keep their geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/index.html");
  const callout = page.locator(".Callout").first();
  await expect(callout).toBeVisible();
  await expect(callout.locator(".Text").first()).toHaveCSS(
    "color",
    "rgb(255, 255, 255)"
  );
  const note = await callout.evaluate((element) => ({
    markers: element.querySelectorAll(":scope > .Pixels > .Row").length,
    lines: element.querySelector(":scope > div").clientHeight / 32,
    text: element.textContent,
    svg: element.querySelectorAll("svg").length,
  }));
  await expect(
    callout.locator(":scope > .Pixels .Layer").first()
  ).toHaveCSS("color", "rgb(0, 255, 0)");
  expect(note.markers).toBe(note.lines);
  expect(note.markers).toBeGreaterThan(1);
  expect(note.text).toContain(
    "THE ENTIRE GAME IS ONLY MADE OF TEXT CHARACTERS!"
  );
  expect(note.svg).toBe(0);
  await page.goto("/gear.html");
  const key = page.locator("main .Key").first();
  await expect(key).toBeVisible();
  expect((await key.boundingBox()).height).toBe(48);
  await expect(key.locator(":scope > .Row")).toHaveCount(2);
});
