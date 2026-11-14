const { test, expect } = require("./fixtures.cjs");

const openScene = async (page, renderer, scene) => {
  await page.goto(
    `${renderer === "html" ? "/html" : ""}/preview.html?test#${scene}`
  );
  await expect(
    page.locator(renderer === "html" ? ".HtmlRenderer" : "canvas")
  ).toBeVisible();
  await page.evaluate(() => {
    const terminal = document.querySelector(".Terminal");
    let fiber =
      terminal[
        Object.keys(terminal).find((name) => name.startsWith("__reactFiber"))
      ];
    while (fiber && !fiber.memoizedProps?.value?.ecs) fiber = fiber.return;
    window.rendererWorld = fiber.memoizedProps.value.ecs;
    window.postMessage({ type: "play" }, location.origin);
    window.dispatchEvent(new Event("focus"));
  });
};

for (const renderer of ["three-js", "html"]) {
  test(`${renderer} keeps momentum through an opened building door after key release`, async ({
    page,
  }) => {
    await openScene(page, renderer, "structures");
    await page.keyboard.press("Enter");
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.rendererWorld
            .getEntities(["LOCKABLE"])
            .every((entity) => !entity.LOCKABLE.locked)
        )
      )
      .toBe(true);
    for (const [key, beyond, inside] of [
      ["ArrowUp", 3, true],
      ["ArrowDown", 5, false],
    ]) {
      await page.keyboard.down(key);
      await page.waitForFunction(
        () =>
          window.rendererWorld.getEntities(["PLAYER", "POSITION"])[0].POSITION
            .y === 4
      );
      await page.keyboard.up(key);
      await expect
        .poll(() =>
          page.evaluate(() => {
            const world = window.rendererWorld;
            const hero = world.getEntities(["PLAYER", "POSITION"])[0];
            const reference = world.getEntityById(hero.MOVABLE.reference);
            return {
              y: hero.POSITION.y,
              inside: !!hero.LAYER.structure,
              stopped: reference.REFERENCE.suspended,
              momentum: hero.MOVABLE.momentum || null,
            };
          })
        )
        .toEqual({ y: beyond, inside, stopped: true, momentum: null });
    }
  });
}

test("HTML shows a viewpoint earthquake without hero damage and settles afterwards", async ({
  page,
}) => {
  await openScene(page, "html", "combat");
  await page.waitForTimeout(1400);
  const camera = page.locator(".HtmlRendererScene");
  const idle = await camera.getAttribute("style");
  await page.evaluate(() => {
    const world = window.rendererWorld;
    const viewpoint = world
      .getEntities(["VIEWABLE", "POSITION"])
      .filter((entity) => entity.VIEWABLE.active)
      .sort(
        (left, right) => right.VIEWABLE.priority - left.VIEWABLE.priority
      )[0];
    viewpoint.VIEWABLE.quake =
      world.metadata.gameEntity.RENDERABLE.generation + 8;
  });
  await expect.poll(() => camera.getAttribute("style")).not.toBe(idle);
  await page.evaluate(() => {
    for (const entity of window.rendererWorld.getEntities(["VIEWABLE"]))
      entity.VIEWABLE.quake = undefined;
  });
  await expect.poll(() => camera.getAttribute("style")).toBe(idle);
  expect(
    await page.evaluate(() =>
      Object.values(
        window.rendererWorld.getEntities(["PLAYER"])[0].PLAYER.receivedStats
      ).reduce((sum, value) => sum + value, 0)
    )
  ).toBe(0);
});
