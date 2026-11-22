const { test, expect } = require("./fixtures.cjs");

const openScene = async (page, renderer, scene) => {
  const base = renderer === "excalibur" ? "/" : `/${renderer}/`;
  await page.goto(`${base}preview.html?test#${scene}`);
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

for (const renderer of ["excalibur", "three-js", "html"]) {
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

test("Excalibur advances the world in fixed turns and freezes its motion samples on pause", async ({
  page,
}) => {
  await openScene(page, "excalibur", "clients");
  const sample = () =>
    page.evaluate(() => {
      const { elapsed, renderTime } = window.rendererWorld.metadata;
      return [elapsed, renderTime];
    });
  await page.evaluate(() => {
    const world = window.rendererWorld;
    const update = world.update;
    window.turnDurations = [];
    world.update = (delta) => {
      window.turnDurations.push(delta);
      update(delta);
    };
  });
  await expect
    .poll(() => page.evaluate(() => window.turnDurations.length))
    .toBeGreaterThan(3);
  expect(await page.evaluate(() => [...new Set(window.turnDurations)])).toEqual(
    [1000 / 30]
  );
  await page.evaluate(() =>
    window.postMessage({ type: "pause" }, location.origin)
  );
  await expect(page.locator("#resume")).toBeAttached();
  const paused = await sample();
  await page.waitForTimeout(250);
  expect(await sample()).toEqual(paused);
  await page.evaluate(() =>
    window.postMessage({ type: "play" }, location.origin)
  );
  await expect.poll(async () => (await sample())[0]).toBeGreaterThan(paused[0]);
  const [elapsed, renderTime] = await sample();
  expect(renderTime).toBeGreaterThanOrEqual(elapsed);
  expect(renderTime - elapsed).toBeLessThan(1000 / 30);
});

test("Excalibur keeps processing turns after a slow browser frame", async ({
  page,
}) => {
  await openScene(page, "excalibur", "structures");
  await page.waitForFunction(() => window.rendererWorld.metadata.elapsed > 300);
  const advanced = await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => {
          const world = window.rendererWorld;
          const before = world.metadata.elapsed;
          const until = performance.now() + 260;
          while (performance.now() < until) {
            // Simulate a long layout or garbage collection in the browser.
          }
          requestAnimationFrame(() => resolve(world.metadata.elapsed - before));
        });
      })
  );
  expect(advanced).toBeGreaterThanOrEqual(200);
  expect(advanced).toBeLessThanOrEqual(501);
});
