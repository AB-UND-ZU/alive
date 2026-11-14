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
    await page.waitForTimeout(450);
    await page.keyboard.up("ArrowDown");
    await expect
      .poll(async () => (await session(page)).position)
      .not.toEqual(before);
    await page.keyboard.press("c");
    await expect.poll(async () => (await session(page)).dialog).toBe("chat");
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
