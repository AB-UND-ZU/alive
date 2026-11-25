const { test, expect } = require("@playwright/test");

const session = (page) =>
  page.evaluate(() => {
    const host = document.querySelector(".TerminalBrowserPreview, .Terminal");
    if (!host) return null;
    let fiber =
      host[Object.keys(host).find((name) => name.startsWith("__reactFiber"))];
    while (fiber && !fiber.memoizedProps?.value?.ecs) fiber = fiber.return;
    const context = fiber?.memoizedProps.value;
    const world = context?.ecs;
    const hero = world?.getEntities(["PLAYER"])[0];
    const popup = hero?.PLAYER.popup && world.getEntityById(hero.PLAYER.popup);
    return {
      level: world?.metadata.gameEntity.LEVEL.name,
      position: hero?.POSITION,
      paused: context?.paused,
      promptLength: popup?.POPUP.selections[popup.POPUP.horizontalIndex]?.length,
      dialog: popup?.POPUP.active
        ? popup.POPUP.tabs[popup.POPUP.horizontalIndex]
        : null,
    };
  });

for (const renderer of ["three-js", "html", "terminal"]) {
  test(`${renderer} standalone entry plays the menu with only its own assets`, async ({
    page,
  }) => {
    const errors = [];
    const scripts = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.push(request.url());
    });
    const base = renderer === "three-js" ? "/" : `/${renderer}/`;
    await page.goto(base + "?test");
    await expect(
      page.locator(
        renderer === "three-js"
          ? "canvas"
          : renderer === "html"
          ? ".HtmlRenderer"
          : ".TerminalBrowserPreview"
      )
    ).toBeVisible();
    if (renderer !== "terminal") await page.locator("#resume").click();
    await expect.poll(async () => (await session(page))?.paused).toBe(false);
    await expect.poll(async () => (await session(page))?.position).toBeTruthy();
    expect((await session(page)).level).toBe("LEVEL_MENU");
    const before = (await session(page)).position;
    await page.keyboard.down("ArrowDown");
    await expect
      .poll(async () => (await session(page)).position)
      .not.toEqual(before);
    await page.keyboard.up("ArrowDown");
    await page.keyboard.press("c");
    await expect.poll(async () => (await session(page)).dialog).toBe("chat");
    await page.keyboard.type("draft");
    await expect.poll(async () => (await session(page)).promptLength).toBe(5);
    if (renderer !== "terminal") {
      const keys = await page.locator("#keyboard").boundingBox();
      const lastRow = { x: keys.x + keys.width / 2, y: keys.y + keys.height * 5 / 6 };
      await page.locator("#menu").click();
      await expect(page.locator("#pause-resume")).toBeVisible();
      const lastKey = page.locator(".KeyboardOverlay > .Row .Cell").last();
      await expect(lastKey).toHaveAttribute("data-glyph", "▓");
      expect(await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.id,
        lastRow
      )).toBe("resume");
      await page.mouse.click(lastRow.x, lastRow.y);
      await expect.poll(async () => (await session(page)).paused).toBe(false);
      await expect(lastKey).not.toHaveAttribute("data-glyph", "▓");
      expect((await session(page)).promptLength).toBe(5);
    }
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await session(page)).promptLength).toBe(0);
    expect((await session(page)).dialog).toBe("chat");
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await session(page)).dialog).toBeNull();
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await session(page)).paused).toBe(true);
    if (renderer === "terminal") {
      await expect(
        page.locator("canvas, svg, .Cell, .HtmlRenderer")
      ).toHaveCount(0);
      await expect(page.locator(".TerminalBrowserPreview")).toHaveCSS(
        "user-select",
        "text"
      );
      await page.keyboard.press(" ");
    } else await page.locator("#pause-resume").click();
    await expect.poll(async () => (await session(page)).paused).toBe(false);
    expect(scripts.length).toBeGreaterThan(0);
    expect(
      scripts.every((url) =>
        new URL(url).pathname.startsWith(base + "static/js/")
      )
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test.describe("touch controls", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("wiki dungeon keeps Save disabled and lets touch players resume or return to menu", async ({ page }) => {
    await page.goto("/preview.html?test#game/dungeon");
    await expect.poll(async () => (await session(page))?.level).toBe("LEVEL_TUTORIAL");
    await page.locator("#resume").tap({ position: { x: 2, y: 2 } });
    await expect(page.locator(".Paused")).toHaveCount(0);
    await page.locator("#menu").tap();

    const save = page.locator("#pause-save");
    await expect(save).toBeVisible();
    await save.tap();
    expect((await session(page)).paused).toBe(true);
    await expect(page.locator("#pause-save + .Row .Cell")).toHaveCount(0);

    await page.locator("#pause-resume").tap();
    await expect.poll(async () => (await session(page)).paused).toBe(false);
    await page.locator("#menu").tap();
    await page.locator("#pause-menu").tap();
    await expect.poll(async () => (await session(page)).level).toBe("LEVEL_MENU");
  });

  test("the game suppresses the iOS loupe on the scene and both HUD bars while taps still activate once", async ({ page }) => {
    // Desktop WebKit lacks the native iOS callout.
    await page.addInitScript(() => {
      const supports = CSS.supports.bind(CSS);
      CSS.supports = (...args) => args[0] === "-webkit-touch-callout" || supports(...args);
      window.gameTouches = [];
      window.gameClicks = [];
      window.addEventListener("touchstart", event => window.gameTouches.push(event.defaultPrevented));
      window.addEventListener("click", event => window.gameClicks.push(event.target));
    });
    await page.goto("/?test");
    await page.locator("#resume").tap();
    await expect(page.locator(".Paused")).toHaveCount(0);
    for (const selector of ["canvas", "#skill", "#spell", "#menu", "#pause-resume"]) {
      const control = page.locator(selector);
      await page.evaluate(() => {
        window.gameClicks.length = 0;
        window.gameTouches.length = 0;
      });
      await control.tap();
      expect(await page.evaluate(() => window.gameTouches)).toEqual([true]);
      expect(await page.evaluate(() => window.gameClicks.length), selector).toBe(1);
    }
    await expect(page.locator(".Paused")).toHaveCount(0);
  });
});
