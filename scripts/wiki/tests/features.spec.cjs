const { test, expect } = require("./fixtures.cjs");
const fs = require("node:fs");
const path = require("node:path");
const logicalText = (element) => {
  const copy = element.cloneNode(true);
  copy.querySelectorAll(".Cell").forEach(cell => cell.replaceWith(
    cell.getAttribute("data-glyph") || Array.from(cell.querySelectorAll(".Layer")).pop()?.textContent || " "
  ));
  return copy.textContent;
};
async function expectColor(locator, color) {
  await expect
    .poll(() =>
      locator.evaluateAll(
        (roots, color) =>
          roots
            .flatMap((root) => [
              root,
              ...root.querySelectorAll("*"),
            ])
            .some(
              (node) =>
                getComputedStyle(node)[
                  node.tagName.toLowerCase() === "rect" ? "fill" : "color"
                ] === color
            ),
        color
      )
    )
    .toBe(true);
}

test("navigation follows the design and implementation groups with Welcome and Play under Intro", async ({
  page,
}) => {
  await page.goto("/game-design/controls/interface.html");
  await expect(page.locator("nav .NavTree")).toHaveCount(2);
  await expect(page.locator('nav a[aria-label="Play"]')).toHaveCount(1);
  await expect(page.locator('nav a[aria-label="Game"]')).toHaveCount(0);
  expect(await page.locator(".NavGroupTitle").allTextContents()).toEqual([
    "[INTRO]",
    "[CONTROLS]",
    "[WORLD]",
    "[CHARACTERS]",
    "[COMBAT]",
    "[CELLS]",
    "[ITEMS]",
    "[INTERACTIONS]",
    "[RENDERING]",
    "[ENGINE]",
    "[ENTITIES]",
    "[SYSTEMS]",
    "[COMPONENTS]",
    "[TYPES]",
    "[UI]",
    "[WIKI]",
  ]);
  for (const title of ["Harvesting", "Fishing", "Farming", "Building"])
    await expect(
      page
        .locator("nav .NavTree")
        .nth(0)
        .getByRole("link", { name: title, exact: true })
    ).toHaveCount(1);
  await page.evaluate(() => (window.shellMarker = 42));
  await page
    .locator("nav .NavTree")
    .nth(0)
    .getByRole("link", { name: "Classes", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveAccessibleName("Classes");
  await expect(page).toHaveURL(/game-design\/characters\/classes.html$/);
  expect(await page.evaluate(() => window.shellMarker)).toBe(42);
  await page.goBack();
  await expect(page.locator("h1")).toHaveAccessibleName("Interface");
});

test("Welcome is the index page and links use the credits underline", async ({
  page,
}) => {
  await page.goto("/index.html");
  await expect(page.locator("h1")).toHaveAccessibleName("ALIVE");
  await expectColor(page.locator("h1"), "rgb(128, 0, 0)");
  await expect(page.locator("main > p").first()).toHaveText(
    "ASCII-based 2D adventure game. Using React and Three.js (with react-three-fiber)."
  );
  await expect(page.locator("main")).toContainText(
    "Only the [256] characters in code page 437"
  );
  await expect(
    page.locator('main a[href="https://en.wikipedia.org/wiki/Code_page_437"]')
  ).toHaveText("code page 437");
  await expect(page.locator('main a[href$="characters.html"]')).toHaveCount(0);
  const positions = await page
    .locator(".NavGroup, .NavTitle")
    .evaluateAll((elements) =>
      elements.map((el) => {
        const copy = el.cloneNode(true);
        copy.querySelectorAll(".Cell").forEach(cell => cell.replaceWith(
          cell.getAttribute("data-glyph") || Array.from(cell.querySelectorAll(".Layer")).pop()?.textContent || " "
        ));
        return { text: copy.textContent, y: el.getBoundingClientRect().y };
      })
    );
  expect(positions.find((p) => p.text.includes("[INTRO]")).y).toBeLessThan(
    positions.find(
      (p) => p.text.includes("GAME DESIGN") && !p.text.includes("[CONTROLS]")
    ).y
  );
  await page.locator('nav a[aria-label="Play"]').click();
  await expect(page).toHaveURL(/play.html$/);
  await page.goto("/game-design/world/map.html");
  const lightLink = page.locator('main .WikiLink[href$="light.html"]');
  await expectColor(lightLink, "rgb(0, 0, 255)");
  expect(
    await lightLink
      .locator(".LinkText")
      .first()
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--underline-color").trim()
      )
  ).not.toBe("transparent");
  const header = page.locator(".WikiHeader");
  expect((await header.boundingBox()).height).toBe(80);
  expect((await header.locator(".HeaderText").boundingBox()).y).toBe(32);
  expect((await header.locator(".HeaderRule").boundingBox()).height).toBe(16);
});

test("Savegames documents local saves and Play is an Intro menu item", async ({
  page,
}) => {
  await page.goto("/game-design/controls/interface.html");
  const save = page
    .locator("nav")
    .getByRole("link", { name: "Savegames", exact: true });
  await save.click();
  await expect(page).toHaveURL(/savegames.html$/);
  await expect(page.locator("h1")).toHaveAccessibleName("Savegames");
  await expect(page.locator("main")).toContainText("Pausing saves");
  await page
    .locator("nav")
    .getByRole("link", { name: "Play", exact: true })
    .click();
  await expect(page.locator("main h1")).toHaveCount(0);
  await page.locator("[data-scene=game]").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-scene=game] iframe")).toHaveAttribute(
    "src",
    /preview.html#game\/menu$/
  );
});

test("scrolling remains native and only the page heading uses three rows", async ({
  page,
}) => {
  await page.goto("/game-design/items/gear.html");
  await page.evaluate(() => window.scrollTo(0, 117));
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBe(117);
  await expect(page.locator(".LineMask")).toHaveCount(0);
  expect((await page.locator(".WikiHeader").boundingBox()).y).toBe(0);
  await expect(page.locator(".WikiHeader")).toContainText(/ALIVE V\d+x\d+/);
  expect((await page.locator("h1").boundingBox()).height).toBe(96);
  expect(
    await page
      .locator("h1 .HeadingLetter")
      .evaluateAll((letters) =>
        letters.every((letter) => letter.getBoundingClientRect().height === 96)
      )
  ).toBe(true);
  expect(
    await page
      .locator("h2 .Row")
      .evaluateAll((es) =>
        es.every((e) => Math.round(e.getBoundingClientRect().height) === 32)
      )
  ).toBe(true);
  await page.goto("/game-design/items/spells.html");
  const direct = page.getByRole("heading", {
    name: "Direct Casts",
    exact: true,
  });
  await expect(direct).toBeVisible();
  expect((await direct.boundingBox()).height).toBe(32);
});

test("CSS navigation hover keeps the current solid highlight and moves only the pointer", async ({
  page,
}) => {
  await page.goto("/game-design/controls/interface.html");
  const current = page.locator("nav .NavCurrentPointer");
  await expect(current).toBeVisible();
  const active = page.locator("nav a[aria-current=page]");
  const solid = active.locator(".NavNormalLabel .ShadedText");
  await expect(solid).toHaveAttribute("data-shade", "▄".repeat(16));
  await active.hover();
  await expect(solid).toBeVisible();
  const touch = page.locator('nav a[aria-label="Touch"]');
  await touch.hover();
  await expect(current).toBeHidden();
  await expect(touch.locator(".NavHoverPointer")).toBeVisible();
  expect(
    await touch.locator(".ShadedText").evaluate((node) =>
      getComputedStyle(node, "::before").clipPath
    )
  ).toBe("inset(50% 0px 0px)");
  await expect(solid).toBeVisible();
  expect(
    await solid.evaluate((node) => getComputedStyle(node, "::before").color)
  ).toBe("rgb(0, 128, 0)");
  expect((await touch.locator(".NavText").boundingBox()).width).toBe(288);
  await page.locator(".WikiHeader").hover();
  await expect(current).toBeVisible();
  await expect(touch.locator(".NavHoverPointer")).toBeHidden();
});

test("scene choices are all shown and selecting a spell reloads the actual engine", async ({
  page,
}) => {
  await page.goto("/game-design/items/spells.html");
  const scene = page.locator("[data-scene=abilities]");
  await expect(scene.getByRole("tab")).toHaveCount(6);
  await scene.getByRole("tab", { name: "beam", exact: true }).click();
  await expect(scene.locator("iframe")).toHaveAttribute(
    "src",
    /abilities\/beam$/
  );
  const frame = await (
    await scene.locator("iframe").elementHandle()
  ).contentFrame();
  await expect(
    frame.getByRole("button", { name: "Auto", exact: true })
  ).toHaveCount(0);
  await expect(
    scene.getByRole("button", { name: "Play", exact: true })
  ).toHaveCount(0);
});

test("previews load on arrival, autoplay and pause the world offscreen", async ({
  page,
}) => {
  await page.goto("/game-design/controls/keyboard-mouse.html");
  const preview = page.locator("[data-scene=movement]");
  await expect(preview.locator("iframe")).toHaveCount(0);
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator("iframe")).toHaveCount(1);
  const frame = await (
    await preview.locator("iframe").elementHandle()
  ).contentFrame();
  await expect(frame.locator("canvas")).toBeVisible();
  await expect(frame.locator(".Paused")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(frame.locator(".Paused")).toHaveCount(1);
});

test("focused previews capture keys, release focus on Escape and reset", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/game-design/controls/keyboard-mouse.html");
  const scene = page.locator("[data-scene=movement]"),
    iframe = scene.locator("iframe");
  await scene.scrollIntoViewIfNeeded();
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  await frame.locator("canvas").click();
  await expect(scene).toHaveClass(/active/);
  await expect(iframe).toHaveAttribute("data-auto", "false");
  const scroll = await page.evaluate(() => scrollY);
  const start = [
    await iframe.getAttribute("data-x"),
    await iframe.getAttribute("data-y"),
  ];
  let position = start;
  for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
    await page.keyboard.press(key, { delay: 350 });
    await page.waitForTimeout(250);
    position = [
      await iframe.getAttribute("data-x"),
      await iframe.getAttribute("data-y"),
    ];
    if (position.join() !== start.join()) break;
  }
  expect(position).not.toEqual(start);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await expectColor(frame.locator(".DemoFrame"), "rgb(0, 255, 0)");
  await page.keyboard.press("Escape");
  await expect(scene).not.toHaveClass(/active/);
  await expect(page.locator("main")).toBeFocused();
  await expect(page.locator("main")).toHaveCSS("outline-style", "none");
  await expect(frame.locator(".Paused")).toHaveCount(0);
  await expect(iframe).toHaveAttribute("data-auto", "true");
  await expect(iframe).toHaveAttribute("data-auto", "false", {
    timeout: 20000,
  });
  await expect(iframe).toHaveAttribute("data-x", "14");
  await expect(iframe).toHaveAttribute("data-y", "1");
  const boundary = await frame.locator(".DemoFrame").boundingBox();
  const reset = await frame
    .getByRole("button", { name: "Reset", exact: true })
    .boundingBox();
  const viewport = await iframe.boundingBox();
  expect(reset.y).toBeGreaterThanOrEqual(boundary.y + boundary.height);
  expect(reset.y + reset.height).toBeLessThanOrEqual(viewport.y + viewport.height);
  const previousFrame = await iframe.elementHandle();
  await frame.getByRole("button", { name: "Reset", exact: true }).click();
  await expect
    .poll(() => previousFrame.evaluate((node) => node.isConnected))
    .toBe(false);
  await expect(iframe).toHaveAttribute("data-y", "7");
  await expect(iframe).toHaveAttribute("data-auto", "true");
  await expect(iframe).toHaveAttribute("data-auto", "false", {
    timeout: 20000,
  });
  await expect(iframe).toHaveAttribute("data-x", "14");
  await expect(iframe).toHaveAttribute("data-y", /^[12]$/);
  await expect(scene).not.toHaveClass(/active/);
});

test("Escape closes a real dialog before releasing demo focus", async ({
  page,
}) => {
  await page.goto("/game-design/interactions/crafting.html");
  const scene = page.locator("[data-scene=crafting]"),
    iframe = scene.locator("iframe");
  await scene.scrollIntoViewIfNeeded();
  await expect(iframe).toHaveAttribute("data-dialog", "craft", {
    timeout: 10000,
  });
  await iframe.focus();
  await expect(scene).toHaveClass(/active/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  for (
    let attempt = 0;
    attempt < 3 && (await frame.locator(".PopupClose").count());
    attempt++
  ) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
  await expect(frame.locator(".PopupClose")).toHaveCount(0);
  await expect(scene).toHaveClass(/active/);
  await page.keyboard.press("Escape");
  await expect(scene).not.toHaveClass(/active/);
});

test("feature previews do not write game saves when paused", async ({
  page,
}) => {
  await page.goto("/game-design/controls/keyboard-mouse.html");
  const preview = page.locator("[data-scene=movement]");
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  await expect(frame.locator(".Paused")).toHaveCount(0);
  await frame.evaluate(() =>
    window.postMessage({ type: "pause" }, location.origin)
  );
  await expect(frame.locator(".Paused")).toHaveCount(1);
  // Feature scenes hide the pause overlay, but its callbacks stay isolated too.
  await frame.locator("#pause-save").evaluate((button) => button.click());
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(async () =>
      (await indexedDB.databases()).map((database) => database.name)
    )
  ).not.toContain("alive");
});

test("large item and unit previews pack two source pixels into each cell", async ({
  page,
}) => {
  await page.goto("/game-design/items/resources.html#wood");
  const preview = page.locator("#wood .LargePreview");
  expect(await preview.locator(".Row").count()).toBeLessThanOrEqual(8);
  expect(await preview.locator(".Cell").count()).toBeGreaterThan(0);
  expect(await preview.locator(".Cell").count()).toBeLessThanOrEqual(72);
  expect(
    await preview
      .locator(".Cell")
      .first()
      .evaluate((e) => e.getBoundingClientRect().width)
  ).toBe(18);
  await page.goto("/game-design/characters/enemies.html#prism");
  expect(
    await page.locator('#prism [data-unit="prism"] .LargePreview .Cell').count()
  ).toBeGreaterThan(0);
  expect(
    await page.locator('#prism [data-unit="prism"] .LargePreview .Cell').count()
  ).toBeLessThanOrEqual(72);
});

test("item, unit, class and type links resolve to their own anchors", async ({
  page,
}) => {
  await page.goto("/game-design/combat/damage.html");
  await page.locator('main a[href$="gear.html#sword"]').first().click();
  await expect(page.locator("#sword")).toBeVisible();
  await page.goto("/game-design/characters/enemies.html");
  await expect(page.locator('main a[href$="enemies.html#prism"]')).toHaveCount(
    0
  );
  await page.goto("/game-design/characters/enemies.html#prism");
  await expect(page.locator("#prism")).toBeVisible();
  await page.goto("/game-design/characters/classes.html");
  await expect(page.locator("#rogue")).toBeAttached();
  await page.goto("/development/components/item.html#type-item");
  await expect(page.locator("#type-item")).toBeVisible();
  await expect(
    page.locator('.CodeBlock a[href*="#type-"]').first()
  ).toHaveAttribute("href", /#type-/);
});

test("code dialogs have filename tabs, syntax colors and copy only source", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/development/components/item.html#type-item");
  const block = page.locator("#type-item + .CodeBlock");
  await expect(block).toHaveAttribute(
    "aria-label",
    "src/engine/components/item.ts"
  );
  await expect(block.locator(".CodeNumbers")).toBeVisible();
  await expect(block.locator("pre .CodeNumbers")).toHaveCount(0);
  await expectColor(block.locator(".CodeSemantic"), "rgb(0, 255, 255)");
  await expectColor(
    block.getByRole("button", { name: "Copy", exact: true }),
    "rgb(0, 255, 0)"
  );
  expect(
    await block
      .locator(".CodeChrome .Cell")
      .first()
      .evaluate((el) => getComputedStyle(el).userSelect)
  ).toBe("none");
  const source = await block.locator("pre").textContent();
  const selected = await block.locator("pre").evaluate((el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
    return s.toString();
  });
  expect(selected).toContain("export type Item");
  expect(selected).not.toContain("src/engine");
  expect(selected).not.toContain("║");
  await block.getByRole("button", { name: "Copy", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    source
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await block.scrollIntoViewIfNeeded();
  const frameBefore = await block.locator(".CodeFooter").boundingBox();
  const numbers = await block.locator(".CodeNumbers").boundingBox();
  const wall = await block
    .locator(".CodeBody > .CodeChrome")
    .first()
    .boundingBox();
  expect(numbers.x + numbers.width).toBe(wall.x);
  const right = await block
    .locator(".CodeBody > .CodeChrome")
    .last()
    .boundingBox();
  expect(right.x + right.width).toBe(frameBefore.x + frameBefore.width);
  const scroll = block.locator(".CodeScroll");
  await scroll.evaluate((el) => (el.scrollLeft = 180));
  expect(await scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  expect(await block.locator(".CodeFooter").boundingBox()).toEqual(frameBefore);
});

test("tables share white headings, double header rules and single row rules", async ({
  page,
}) => {
  await page.goto("/game-design/combat/stats.html");
  const table = page.locator("main table").first();
  await expectColor(table.locator("th"), "rgb(255, 255, 255)");
  const rules = await table.locator(".GridRule").allTextContents();
  expect(rules[0]).toContain("═");
  expect(rules[1]).toContain("─");
  expect(rules.join("")).not.toMatch(/[┌┐└┘├┤╞╡]/);
  await expect(
    table.locator("thead tr:first-child th:first-child")
  ).toBeAttached();
  await expect(
    table.locator("tbody tr:last-child td.GridValue:last-child")
  ).toBeAttached();
  await expect(table.locator(".GridEdge")).not.toHaveCount(0);
  expect(
    await table.evaluate((el) =>
      Array.from(el.querySelectorAll(".GridEdge")).every(
        (cell) => cell.offsetWidth === 18
      )
    )
  ).toBe(true);
});

test("the damage tool keeps fractional health with distinct attacker and defender previews", async ({
  page,
}) => {
  await page.goto("/game-design/combat/damage.html");
  const trueRow = page.getByRole("row", {
    name: "True Ignored Ignored", exact: true,
  });
  await expect(trueRow).toHaveCount(1);
  const tool = page.locator("[data-widget=damage]");
  await expect(tool.locator(".LargePreview")).toHaveCount(2);
  await tool
    .getByRole("spinbutton", { name: "Weapon damage", exact: true })
    .fill("1");
  await tool
    .getByRole("spinbutton", { name: "Attacker Power", exact: true })
    .fill("0");
  await tool
    .getByRole("spinbutton", { name: "Defender Armor", exact: true })
    .fill("1");
  await expect(tool.locator("output")).toHaveAttribute(
    "aria-label",
    /0.5 damage/
  );
  await tool.getByRole("button", { name: "Hit", exact: true }).click();
  await expect(tool.locator("output")).toHaveAttribute(
    "aria-label",
    /HP 29.5\/30/
  );
});

test("command reference and chat preview use native game commands", async ({
  page,
}) => {
  await page.goto("/game-design/interactions/chat.html");
  const reference = page.locator("main table").filter({
    has: page.locator("thead th").filter({ hasText: /^Command$/ }),
  });
  const rows = reference.locator("tbody tr:not(.GridRule)");
  await expect(rows).toHaveCount(10);
  const examples = await rows.locator('[data-column="2"]').allTextContents();
  expect(
    examples.map((example) => example.match(/^\/(\w+)/)?.[1]).sort()
  ).toEqual([
    "cast",
    "focus",
    "give",
    "help",
    "list",
    "mod",
    "new",
    "pin",
    "stat",
    "tp",
  ]);
  const usages = await rows.locator('[data-column="0"]').allTextContents();
  expect(usages).toContain("/list│/help [cmd]/h");
  expect(usages).toContain("/give <item> [num] [mat] [ele]/g");
  const preview = page.locator('[data-scene="chat"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("src", /preview\.html\?test#chat$/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  await expect(frame.locator("canvas")).toBeVisible();
  await frame.locator(".Terminal").click({ position: { x: 4, y: 4 } });
  await expect(preview).toHaveClass(/active/);
  await expect(frame.locator("#keyboard")).toBeVisible();
  const initialHp = await iframe.getAttribute("data-hp");
  await page.keyboard.type("/st");
  await page.keyboard.press("Tab");
  await page.keyboard.type("hp 12");
  await page.keyboard.press("Enter");
  await expect(iframe).toHaveAttribute("data-hp", "12");
  await expect(frame.locator("#keyboard")).toHaveCount(0);
  await frame.evaluate(() => window.location.reload());
  await expect(iframe).toHaveAttribute("data-hp", initialHp);
  await expect(frame.locator("#keyboard")).toBeVisible();
  await frame.locator(".Terminal").click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(iframe).toHaveAttribute("data-hp", "12");

  await expect(page.getByRole("textbox", { name: "Search items" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run", exact: true })).toHaveCount(0);
});

test("the Interface diagram is static, labels controls and places text underneath", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game-design/controls/interface.html");
  const diagram = page.locator(".InterfaceDiagram");
  await expect(diagram).toHaveAttribute("src", /interface-preview.html$/);
  expect(
    await diagram.evaluate((el) => getComputedStyle(el).pointerEvents)
  ).toBe("none");
  const frame = await (await diagram.elementHandle()).contentFrame();
  await expect(frame.locator("canvas")).toBeVisible();
  expect(await frame.locator(".InterfaceLabels").evaluate(logicalText)).toContain("(auto-save)");
  for (const title of [
    "Pause",
    "Stats",
    "Quick",
    "actions",
    "HP",
    "MP",
    "XP",
    "Skill",
    "Spell",
    "Gear",
  ])
    expect(await frame.locator(".InterfaceLabels").evaluate(logicalText)).toContain(title);
  for (const label of ["BAG", "EQUIP", "GEAR", "STATS", "MAP"])
    await expect(
      frame.locator(`.InterfaceLabels [data-quick-action="${label}"]`)
    ).toHaveCount(1);
  await expect(frame.locator(".InterfaceLabels")).not.toContainText("Hotkeys");
  await expect(frame.locator(".InterfaceLabels")).not.toContainText("Terminal");
  await expect(frame.locator(".InterfaceLabels .Key")).toHaveCount(0);
  expect(
    (await page.locator("main > p").first().boundingBox()).y
  ).toBeGreaterThan((await diagram.boundingBox()).y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  );
});

test("key labels use the native raised key height and prose spaces collapse when wrapping", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  );
  await expect(
    page.locator('main a[href="https://laemeur.sdf.org/fonts/"]')
  ).toHaveText("DOS FONT");
  await page.goto("/game-design/controls/keyboard-mouse.html");
  expect(
    await page
      .locator("main .Key")
      .evaluateAll((keys) =>
        keys.every((key) => key.getBoundingClientRect().height === 48)
      )
  ).toBe(true);
  expect(
    await page
      .locator("main p .Word")
      .evaluateAll((words) =>
        words.every((word) => word.textContent.trim().length > 0)
      )
  ).toBe(true);
});

test("index exposes the text callout, complete palette and ordered font atlas", async ({
  page,
}) => {
  await page.goto("/index.html");
  await expect(page.getByRole("note")).toHaveAccessibleName(
    "THE ENTIRE GAME IS ONLY MADE OF TEXT CHARACTERS!"
  );
  await expect(page.locator(".GlyphAtlas")).toHaveAttribute(
    "aria-label",
    "256 CP437 characters in byte order"
  );
  await expect(page.locator("#palette tbody tr:not(.GridRule)")).toHaveCount(8);
});

test("Play starts with the game and loads presets with optional Test Mode", async ({
  page,
}) => {
  await page.goto("/intro/play.html");
  await expect(page.locator("main h1")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Test Mode", exact: true })
  ).toHaveAttribute("aria-pressed", "false");
  expect(
    await page
      .locator("main")
      .evaluate((element) => element.firstElementChild.dataset.scene)
  ).toBe("game");
  const table = page.locator("main table");
  await expect(table.locator("tbody tr:not(.GridRule)")).toHaveCount(10);
  await table
    .locator("tbody tr:not(.GridRule)")
    .filter({ hasText: "Dungeon" })
    .getByRole("button", { name: "Load", exact: true })
    .click();
  const iframe = page.locator('[data-scene="game"] iframe');
  await expect(iframe).toHaveAttribute("src", /preview.html#game\/dungeon$/);
  await expect(iframe).toHaveAttribute("data-hp", /\d+/);
  await page.getByRole("button", { name: "Test Mode", exact: true }).click();
  await page.locator('[data-scene="game"]').scrollIntoViewIfNeeded();
  await expect(iframe).toHaveAttribute("src", /\?test#game\/dungeon$/);
  await expect(iframe).toHaveAttribute("data-hp", /\d+/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  await expect(frame.locator("canvas")).toBeVisible();
  await iframe.focus();
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(550);
  await page.keyboard.up("ArrowDown");
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await expect(frame.locator("canvas")).toBeVisible();
  await table
    .locator("tbody tr:not(.GridRule)")
    .filter({ hasText: "Worm Boss" })
    .getByRole("button", { name: "Load", exact: true })
    .click();
  await expect(iframe).toHaveAttribute("src", /\?test#game\/worm$/);
  await expect(iframe).toHaveAttribute("data-hp", /\d+/, { timeout: 15000 });
  const wormFrame = await (await iframe.elementHandle()).contentFrame();
  await expect(wormFrame.locator("canvas")).toBeVisible();
});

test("page concepts link to features while sprite names keep game colors until hover", async ({
  page,
}) => {
  await page.goto("/game-design/world/map.html");
  await expect(page.locator('[data-widget="minimap"]')).toBeVisible();
  const concept = page.locator('main a[href$="light.html"]').first();
  await expect(concept).toBeAttached();
  await expectColor(concept, "rgb(0, 0, 255)");
  const spriteLink = page
    .locator("main a")
    .filter({
      has: page.locator(".Item .TextPrefix > .Pixels, .RichMention > .Pixels"),
    })
    .first();
  await expect(spriteLink.locator(".Pixels")).not.toHaveCount(0);
  await spriteLink.hover();
  await expectColor(spriteLink.locator(".LinkText"), "rgb(0, 255, 255)");
  await page.goto("/development/wiki/scenes.html");
  await expect(
    page.locator('main a[href$="development/entities/creation.html"]').first()
  ).toBeAttached();
});

test("source component and system pages exist", () => {
  for (const dir of ["src/engine/components", "src/engine/systems"])
    for (const file of fs.readdirSync(dir)) {
      if (
        file.endsWith(".ts") &&
        !file.includes(".test.") &&
        file !== "index.ts"
      )
        expect(
          fs.existsSync(path.join(dir, file.replace(".ts", ".md"))),
          file
        ).toBe(true);
    }
  for (const entry of fs.readdirSync("src/components")) {
    const file = path.join("src/components", entry, "index.tsx");
    if (fs.existsSync(file))
      expect(fs.existsSync(file.replace(".tsx", ".md")), file).toBe(true);
  }
});

test("grouped routes load directly and legacy routes keep their anchors", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/game-design/items/gear.html#sword");
  await expect(page.locator("h1")).toHaveAccessibleName("Gear");
  await expect(page.locator("#sword")).toBeVisible();
  await expect(page.locator('nav a[aria-label="Gear"]')).toHaveAttribute(
    "aria-current",
    "page"
  );
  await page.goto("/gear.html#sword");
  await expect(page).toHaveURL(/game-design\/items\/gear.html#sword$/);
  await expect(page.locator("#sword")).toBeVisible();
  await page.goto("/development/src/engine/components/item.html#type-item");
  await expect(page).toHaveURL(/development\/components\/item.html#type-item$/);
  await expect(page.locator("#type-item")).toBeVisible();
});

test("automatic prose links avoid self references and keep navigation within its width", async ({
  page,
}) => {
  await page.goto("/game-design/world/map.html");
  const links = await page
    .locator("main p a:not(.SpriteReference)")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  const pages = links
    .filter((href) => href && !/^https?:/.test(href))
    .map((href) => href.split("#")[0]);

  expect(pages.every((href) => !href.endsWith("/world/minimap.html"))).toBe(
    true
  );
  const viewport = page.locator(".NavViewport");
  expect(
    await viewport.evaluate((element) => element.scrollWidth)
  ).toBeLessThanOrEqual(
    await viewport.evaluate((element) => element.clientWidth)
  );
  const scrollbar = page.getByRole("scrollbar", { name: "Chapter position" });
  await expect(scrollbar).toBeVisible();
  await page.getByRole("button", { name: "Scroll navigation down" }).click();
  expect(
    await viewport.evaluate((element) => element.scrollTop)
  ).toBeGreaterThan(0);
});

test("feature pages show native popup specimens and separate speech from signs", async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const [route, screens] of [
    ["items/gear", ["gear", "inspect", "use", "equip"]],
    ["world/savegames", ["load"]],
    ["interactions/chat", ["chat"]],
    ["interactions/dialogs", ["message"]],
    [
      "interactions/signs",
      [
        "menu_sign",
        "spawn_sign",
        "potion_sign",
        "fruit_sign",
        "guide_sign",
        "trader_sign",
        "worm_sign",
        "credits_sign",
      ],
    ],
  ]) {
    await page.goto(`/game-design/${route}.html`);
    const gallery = page.locator("main .DialogGallery");
    await expect(gallery).toHaveCount(1);
    for (const screen of screens) {
      const specimen = gallery.locator(
        `.Pixels[aria-label="${screen} game dialog"]`
      );
      await expect(specimen).toHaveCount(1);
      expect(await specimen.locator(":scope > .Row").count()).toBeGreaterThan(
        0
      );
    }
    await expect(gallery.locator("iframe, canvas")).toHaveCount(0);
    if (route === "world/savegames")
      await expect(gallery.locator(".PauseSnapshot .Paused")).toHaveCount(1);
  }
  await expect(page.locator('nav a[aria-label="Signs"]')).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(page.locator('nav a[aria-label="Dialogs"]')).toHaveCount(1);
  await expect(page.locator('nav a[aria-label="Tips"]')).toHaveCount(0);
  await page.goto("/tips.html");
  await expect(page).toHaveURL(/game-design\/interactions\/dialogs.html$/);
  await expect(page.locator("h1")).toHaveAccessibleName("Dialogs");
  await page.goto("/game-design/world/savegames.html");
  await expect(page.locator("main")).toContainText("[20261011-151323]");
  await expect(page.locator("main")).not.toContainText("[[data:");
});

test("quest reward lists keep each reward on its own line", async ({
  page,
}) => {
  await page.goto("/game-design/interactions/quests.html");
  await expect(page.locator("main")).not.toContainText("[[stat:");
  const chief = page
    .locator("main table")
    .filter({
      has: page.locator("thead th").filter({ hasText: "Character" }),
    })
    .locator("tbody tr:not(.GridRule)")
    .first();
  const reward = chief.locator("td").last();
  await expect(reward.locator("br")).toHaveCount(2);
  await expect(reward).not.toContainText("<br>");
  const items = reward.locator(".Item");
  await expect(items).toHaveCount(3);
  const boxes = await items.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().y)
  );
  expect(boxes[1]).toBeGreaterThan(boxes[0]);
  expect(boxes[2]).toBeGreaterThan(boxes[1]);
});
