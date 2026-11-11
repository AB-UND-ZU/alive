const { test, expect } = require("./fixtures.cjs");

const state = (page) =>
  page.evaluate(() => {
    const terminal = document.querySelector(".Terminal");
    let fiber =
      terminal[
        Object.keys(terminal).find((key) => key.startsWith("__reactFiber"))
      ];
    while (fiber && !fiber.memoizedProps?.value?.ecs) fiber = fiber.return;
    const world = fiber.memoizedProps.value.ecs;
    const hero = world.getEntities(["PLAYER"])[0];
    const popup = hero.PLAYER.popup && world.getEntityById(hero.PLAYER.popup);
    return {
      row: popup?.POPUP.verticalIndezes[popup.POPUP.horizontalIndex],
      scroll: popup?.SEQUENCABLE.states.popup?.args.scrollIndex || 0,
      tab: popup?.POPUP.tabs[popup.POPUP.horizontalIndex],
      x: hero.POSITION.x,
      interval: world.getEntityById(hero.MOVABLE.reference).REFERENCE.tick,
      generation: world.getEntityById(hero.MOVABLE.reference).RENDERABLE
        .generation,
    };
  });

const open = async (page, scene) => {
  await page.goto(`/preview.html?test#${scene}`);
  await expect(page.locator("canvas")).toBeVisible();
  await page.evaluate(() => {
    window.postMessage({ type: "play" }, location.origin);
    window.dispatchEvent(new Event("focus"));
  });
  await expect(page.locator("#content")).toBeVisible();
  await page.waitForTimeout(1000);
};

for (const mobile of [false, true]) {
  test.describe(mobile ? "touch dialog input" : "desktop dialog input", () => {
    test.use({
      viewport: { width: mobile ? 390 : 414, height: 576 },
      hasTouch: mobile,
      isMobile: mobile,
    });

    test(
      mobile
        ? "dialog swipes cannot tap their release row"
        : "held keyboard navigation repeats once per tick",
      async ({ page }, testInfo) => {
        await page.addInitScript(() =>
          localStorage.setItem(
            "alive.sprites",
            JSON.stringify(
              Array.from({ length: 24 }, (_, index) => ({
                name: `Sprite ${index + 1}`,
                layers: [{ char: "A", color: "#ffffff" }],
              }))
            )
          )
        );
        await open(page, "sprites");
        const before = await state(page);
        let client;
        let point;
        if (mobile) {
          client = await page.context().newCDPSession(page);
          const bounds = await page.locator("#content").boundingBox();
          point = { x: bounds.x + bounds.width / 2, y: bounds.y + 4, id: 1 };
          await client.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [point],
          });
          await client.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ ...point, y: point.y + 22 }],
          });
        } else await page.keyboard.down("ArrowDown");
        await page.waitForTimeout(650);
        const during = await state(page);
        expect(during.row).toBeGreaterThanOrEqual(2);
        expect(during.interval).toBe(175);
        expect(during.row).toBeLessThanOrEqual(
          during.generation - before.generation
        );
        if (mobile)
          await client.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
        else await page.keyboard.up("ArrowDown");
        await page.waitForTimeout(300);
        const released = await state(page);
        expect(released.row).toBeGreaterThanOrEqual(during.row);
        expect(released.row).toBeLessThanOrEqual(during.row + 1);
        await page.waitForTimeout(250);
        expect((await state(page)).row).toBe(released.row);
        await page.screenshot({
          path: testInfo.outputPath("released-navigation.png"),
        });
        if (mobile) {
          await page.touchscreen.tap(point.x, point.y);
          await expect
            .poll(async () => (await state(page)).row)
            .toBe(released.scroll);
        }
      }
    );

    test("walking after chat closes uses walking speed immediately", async ({
      page,
    }, testInfo) => {
      await open(page, "chat");
      await page.keyboard.type("hello");
      await page.keyboard.press("Enter");
      await expect.poll(async () => (await state(page)).tab).toBeUndefined();
      const start = await state(page);
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(450);
      const moved = await state(page);
      await page.keyboard.up("ArrowRight");
      expect(moved.interval).toBeGreaterThan(175);
      expect(moved.x - start.x).toBeGreaterThanOrEqual(1);
      expect(moved.x - start.x).toBeLessThanOrEqual(3);
      await page.screenshot({
        path: testInfo.outputPath("walking-after-chat.png"),
      });
    });
  });
}
