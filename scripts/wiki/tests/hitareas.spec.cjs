const { test, expect } = require("./fixtures.cjs");

// Project native particle centers independently of the DOM hit areas.
const nativePoint = (page, sequence, key) =>
  page.evaluate(
    ({ sequence, key }) => {
      const terminal = document.querySelector(".Terminal");
      let fiber =
        terminal[
          Object.keys(terminal).find((name) => name.startsWith("__reactFiber"))
        ];
      while (fiber && !fiber.memoizedProps?.value?.ecs) fiber = fiber.return;
      const world = fiber.memoizedProps.value.ecs;
      const hero = world.getEntities(["PLAYER"])[0];
      const owner = world.assertById(
        sequence === "interact"
          ? world.metadata.interact.active
          : hero.PLAYER.popup
      );
      const state = owner.SEQUENCABLE.states[sequence];
      const particle = world.assertById(state.particles[key]);
      const camera = world
        .getEntities(["VIEWABLE", "POSITION"])
        .filter((entity) => entity.VIEWABLE.active)
        .sort((a, b) => b.VIEWABLE.priority - a.VIEWABLE.priority)[0];
      const size = world.metadata.gameEntity.LEVEL.size;
      const distance = (from, to) =>
        ((to - from + size * 1.5) % size) - size / 2;
      const canvas = document.querySelector("canvas").getBoundingClientRect();
      const styles = getComputedStyle(document.documentElement);
      const cellWidth = parseFloat(styles.getPropertyValue("--cell-width"));
      const cellHeight = parseFloat(styles.getPropertyValue("--cell-height"));
      return {
        x:
          canvas.x +
          canvas.width / 2 +
          (distance(camera.POSITION.x, owner.POSITION.x) +
            particle.PARTICLE.offsetX) *
            cellWidth,
        y:
          canvas.y +
          canvas.height / 2 +
          (distance(camera.POSITION.y, owner.POSITION.y) +
            particle.PARTICLE.offsetY) *
            cellHeight,
        char: particle.SPRITE.layers.at(-1)?.char,
        color: particle.SPRITE.layers.at(-1)?.color,
        cellWidth,
        cellHeight,
      };
    },
    { sequence, key }
  );

const popupState = (page) =>
  page.evaluate(() => {
    const terminal = document.querySelector(".Terminal");
    let fiber =
      terminal[
        Object.keys(terminal).find((name) => name.startsWith("__reactFiber"))
      ];
    while (fiber && !fiber.memoizedProps?.value?.ecs) fiber = fiber.return;
    const world = fiber.memoizedProps.value.ecs;
    const hero = world.getEntities(["PLAYER"])[0];
    const popup = hero.PLAYER.popup && world.assertById(hero.PLAYER.popup);
    return {
      row: popup?.POPUP.verticalIndezes[popup.POPUP.horizontalIndex],
      tab: popup?.POPUP.tabs[popup.POPUP.horizontalIndex],
      moving: popup?.POPUP.sprite?.moving,
      maximum: popup?.SEQUENCABLE.states.popup?.args.scrollMax,
      layers: popup?.POPUP.sprite?.sprites[0]?.layers,
      scroll: popup?.SEQUENCABLE.states.popup?.args.scrollIndex || 0,
    };
  });

const open = async (page, scene) => {
  await page.goto("about:blank");
  await page.goto(`/preview.html?test#${scene}`);
  await expect(page.locator("canvas")).toBeVisible();
  await page.evaluate(() => {
    window.postMessage({ type: "play" }, location.origin);
    window.dispatchEvent(new Event("focus"));
  });
  await page.waitForTimeout(1400);
};
const clickParticle = async (page, sequence, key) => {
  const point = await nativePoint(page, sequence, key);
  await page.mouse.click(point.x, point.y);
  return point;
};

for (const width of [414, 390]) {
  test(`preview interaction prompts and dialog buttons match their glyphs at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 414 ? 576 : 844 });
    await open(page, "crafting");
    await expect(page.locator(".Interact")).toBeVisible();
    await clickParticle(page, "interact", "cell-3");
    await expect.poll(async () => (await popupState(page)).tab).toBe("craft");
    await page.waitForTimeout(1100);
    await clickParticle(page, "popup", "popup-close-1");
    await expect.poll(async () => (await popupState(page)).tab).toBeUndefined();
  });

  test(`preview tabs, character cells and layer actions match their glyphs at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 414 ? 576 : 844 });
    await open(page, "sprites");
    await clickParticle(page, "popup", "popup-next-3");
    await expect.poll(async () => (await popupState(page)).tab).toBe("sprite");
    await page.waitForTimeout(1100);
    await clickParticle(page, "popup", "popup-next-3");
    await expect.poll(async () => (await popupState(page)).moving).toBe(true);
    await clickParticle(page, "popup", "popup-prev-3");
    await expect.poll(async () => (await popupState(page)).moving).toBe(false);
    for (const [row, column, char] of [
      [0, 1, "\u0100"],
      [4, 1, "A"],
      [5, 15, "_"],
      [8, 0, "Ç"],
    ]) {
      await clickParticle(page, "popup", "popup-tab-15");
      await expect.poll(async () => (await popupState(page)).tab).toBe("layer");
      await expect
        .poll(
          async () =>
            (
              await nativePoint(page, "popup", `popup-content-${row}-${column}`)
            ).char
        )
        .toBe(char);
      const point = await clickParticle(
        page,
        "popup",
        `popup-content-${row}-${column}`
      );
      await expect
        .poll(async () => (await popupState(page)).tab)
        .toBe("sprite");
      expect((await popupState(page)).layers.at(-1).char).toBe(point.char);
    }
    await clickParticle(page, "popup", "popup-tab-15");
    await expect.poll(async () => (await popupState(page)).tab).toBe("layer");
    await page.keyboard.down("ArrowDown");
    await expect.poll(async () => (await popupState(page)).row).toBe(7);
    await page.keyboard.up("ArrowDown");
    await expect
      .poll(
        async () =>
          (
            await nativePoint(page, "popup", "popup-content-6-11")
          ).color
      )
      .toBe("#ffffff");
    const block = await nativePoint(page, "popup", "popup-content-6-11");
    expect(block.char).toBe("█");
    await page.mouse.click(block.x + block.cellWidth / 2 - 1, block.y);
    await expect.poll(async () => (await popupState(page)).tab).toBe("sprite");
    await page.waitForTimeout(1100);
    expect((await popupState(page)).layers.at(-1).char).toBe("█");
  });
}

test("Play keeps the normal game's input center", async ({ page }) => {
  await page.goto("/preview.html?test#game");
  await expect(page.locator(".App")).toBeVisible();
  expect(
    await page
      .locator(".App")
      .evaluate((node) =>
        getComputedStyle(node).getPropertyValue("--controls-center-y")
      )
  ).toBe("");
});

for (const viewport of [
  { width: 390, height: 844, touch: true },
  { width: 414, height: 576, touch: true },
  { width: 1440, height: 1000, touch: false },
]) {
  test.describe(`popup input at ${viewport.width}x${viewport.height}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      isMobile: viewport.touch,
    });

    const openList = async (page) => {
      await page.addInitScript(() => {
        if (!location.protocol.startsWith("http")) return;
        localStorage.setItem(
          "alive.sprites",
          JSON.stringify(
            Array.from({ length: 24 }, (_, index) => ({
              name: `Sprite ${index + 1}`,
              layers: [{ char: "A", color: "#ffffff" }],
            }))
          )
        );
      });
      await open(page, "sprites");
      await expect(page.locator("#content")).toBeVisible();
      await expect
        .poll(
          async () =>
            (
              await nativePoint(page, "popup", "popup-content-8-10")
            ).char
        )
        .toBe("9");
    };

    test("a dialog without a visible scrollbar has no scrolling hit areas", async ({
      page,
    }, testInfo) => {
      await page.addInitScript(() =>
        localStorage.setItem(
          "alive.sprites",
          JSON.stringify([
            { name: "First", layers: [{ char: "A", color: "#ffffff" }] },
            { name: "Second", layers: [{ char: "B", color: "#ffffff" }] },
            { name: "Third", layers: [{ char: "C", color: "#ffffff" }] },
          ])
        )
      );
      await open(page, "sprites");
      await expect(page.locator("#content")).toBeVisible();
      await expect(page.locator("#scroll")).toHaveCount(0);
      const before = await popupState(page);
      for (const key of ["popup-right-1", "popup-right-6"]) {
        const point = await nativePoint(page, "popup", key);
        if (viewport.touch) await page.touchscreen.tap(point.x, point.y);
        else await page.mouse.click(point.x, point.y);
        await page.waitForTimeout(250);
        expect(await popupState(page)).toMatchObject({
          row: before.row,
          tab: before.tab,
        });
      }
      await page.screenshot({
        path: testInfo.outputPath("dialog-without-scrollbar.png"),
      });
    });

    test("popup hit areas match native cells without overlaps or scrollbar gaps", async ({
      page,
    }, testInfo) => {
      await openList(page);
      const rows = Number(
        await page.locator("#content").getAttribute("data-rows")
      );
      const first = await nativePoint(page, "popup", "popup-content-0-0");
      const last = await nativePoint(
        page,
        "popup",
        `popup-content-${rows - 1}-16`
      );
      const bar = await nativePoint(page, "popup", "popup-right-0");
      const content = await page.locator("#content").boundingBox();
      const track = await page.locator("#scroll").boundingBox();
      await page.screenshot({
        path: testInfo.outputPath("popup-hit-areas.png"),
      });
      expect(content.x).toBeCloseTo(first.x - first.cellWidth / 2, 1);
      expect(content.y).toBeCloseTo(first.y - first.cellHeight / 2, 1);
      expect(content.x + content.width).toBeCloseTo(
        last.x + last.cellWidth / 2,
        1
      );
      expect(content.y + content.height).toBeCloseTo(
        last.y + last.cellHeight / 2,
        1
      );
      expect(track.x).toBeCloseTo(bar.x - bar.cellWidth / 2, 1);
      expect(track.width).toBeCloseTo(bar.cellWidth, 1);
      expect(track.y).toBeCloseTo(content.y, 1);
      expect(track.height).toBeCloseTo(content.height, 1);
      const areas = await page
        .locator(
          ".PopupContent,.PopupScroll,.PopupLeft,.PopupRight,.PopupClose,.PopupTab"
        )
        .evaluateAll((elements) =>
          elements.map((element) => ({
            id: element.id,
            rect: element.getBoundingClientRect().toJSON(),
          }))
        );
      for (let i = 0; i < areas.length; i += 1) {
        for (const other of areas.slice(i + 1)) {
          const { rect, id } = areas[i];
          const width =
            Math.min(rect.right, other.rect.right) -
            Math.max(rect.left, other.rect.left);
          const height =
            Math.min(rect.bottom, other.rect.bottom) -
            Math.max(rect.top, other.rect.top);
          expect(
            width > 0.05 && height > 0.05,
            `${id} overlaps ${other.id}`
          ).toBe(false);
        }
      }
      const x = track.x + track.width / 2;
      const y = track.y + track.height / 2;
      expect(
        await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, {
          x,
          y,
        })
      ).toBe("scroll");
    });

    for (const [direction, delta] of [
      ["up", -1],
      ["down", 1],
    ]) {
      test(`holding the ${direction} triangle steps through rows and stops on release`, async ({
        page,
      }, testInfo) => {
        await openList(page);
        const track = await page.locator("#scroll").boundingBox();
        const center = {
          x: track.x + track.width / 2,
          y: track.y + track.height / 2,
        };
        const maximum = (await popupState(page)).maximum;
        const start = Math.round(maximum / 2);
        if (viewport.touch) await page.touchscreen.tap(center.x, center.y);
        else await page.mouse.click(center.x, center.y);
        await expect.poll(async () => (await popupState(page)).row).toBe(start);
        const rows = Number(
          await page.locator("#scroll").getAttribute("data-rows")
        );
        const point = await nativePoint(
          page,
          "popup",
          `popup-right-${direction === "up" ? 0 : rows - 1}`
        );
        let client;
        if (viewport.touch) {
          client = await page.context().newCDPSession(page);
          await client.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: point.x, y: point.y, id: 1 }],
          });
        } else {
          await page.mouse.move(point.x, point.y);
          await page.mouse.down();
        }
        await expect
          .poll(async () => delta * ((await popupState(page)).row - start))
          .toBeGreaterThanOrEqual(2);
        if (viewport.touch)
          await client.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
        else await page.mouse.up();
        await page.waitForTimeout(250);
        const stopped = await popupState(page);
        expect(stopped.row).toBeGreaterThan(0);
        expect(stopped.row).toBeLessThan(maximum);
        await page.waitForTimeout(350);
        expect(await popupState(page)).toMatchObject({
          row: stopped.row,
          tab: "pack",
        });
        await page.screenshot({
          path: testInfo.outputPath(`scrollbar-${direction}-released.png`),
        });
      });
    }

    test("scrollbar taps and captured drags follow the content percentage", async ({
      page,
    }, testInfo) => {
      await openList(page);
      const track = await page.locator("#scroll").boundingBox();
      const rows = Number(
        await page.locator("#scroll").getAttribute("data-rows")
      );
      const cell = track.height / rows;
      const point = {
        x: track.x + track.width / 2,
        y: track.y + 2 * cell + (track.height - 4 * cell) / 4,
      };
      const maximum = (await popupState(page)).maximum;
      let client;
      if (viewport.touch) {
        client = await page.context().newCDPSession(page);
        await client.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ ...point, id: 1 }],
        });
      } else {
        await page.mouse.move(point.x, point.y);
        await page.mouse.down();
      }
      await expect
        .poll(async () => (await popupState(page)).row)
        .toBe(Math.round(maximum / 4));
      const move = async (x, y) => {
        if (viewport.touch)
          await client.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x, y, id: 1 }],
          });
        else await page.mouse.move(x, y);
      };
      await move(track.x - 40, track.y + track.height + 50);
      await expect.poll(async () => (await popupState(page)).row).toBe(maximum);
      await page.screenshot({
        path: testInfo.outputPath("scrollbar-bottom-drag.png"),
      });
      await move(track.x - 40, track.y - 50);
      await expect.poll(async () => (await popupState(page)).row).toBe(0);
      if (viewport.touch)
        await client.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
      else await page.mouse.up();
      await page.waitForTimeout(250);
      expect(await popupState(page)).toMatchObject({ row: 0, tab: "pack" });
      await page.screenshot({
        path: testInfo.outputPath("scrollbar-top-released.png"),
      });
    });

    test("scrollbar gestures cannot jump rows, confirm rows or change tabs on release", async ({
      page,
    }, testInfo) => {
      await openList(page);
      const point = await nativePoint(page, "popup", "popup-right-6");
      const end = { x: point.x - point.cellWidth / 2 - 0.4, y: point.y };
      await page.evaluate(() => {
        window.addEventListener(
          "pointerup",
          () => {
            const terminal = document.querySelector(".Terminal");
            let fiber =
              terminal[
                Object.keys(terminal).find((key) =>
                  key.startsWith("__reactFiber")
                )
              ];
            while (fiber && !fiber.memoizedProps?.value?.ecs)
              fiber = fiber.return;
            const world = fiber.memoizedProps.value.ecs;
            const hero = world.getEntities(["PLAYER"])[0];
            const popup = world.getEntityById(hero.PLAYER.popup);
            window.popupAtRelease = {
              row: popup.POPUP.verticalIndezes[popup.POPUP.horizontalIndex],
              tab: popup.POPUP.tabs[popup.POPUP.horizontalIndex],
            };
          },
          { capture: true, once: true }
        );
      });
      let client;
      if (viewport.touch) {
        client = await page.context().newCDPSession(page);
        await client.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: point.x, y: point.y, id: 1 }],
        });
      } else {
        await page.mouse.move(point.x, point.y);
        await page.mouse.down();
      }
      await expect
        .poll(async () => (await popupState(page)).row)
        .toBeGreaterThanOrEqual(3);
      const held = await popupState(page);
      if (viewport.touch) {
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ ...end, id: 1 }],
        });
        await client.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
      } else {
        await page.mouse.move(end.x, end.y);
        await page.mouse.up();
      }
      await page.waitForTimeout(300);
      const atRelease = await page.evaluate(() => window.popupAtRelease);
      const released = await popupState(page);
      expect(released.tab).toBe(held.tab);
      expect(released.tab).toBe(atRelease.tab);
      expect(released.row).toBeGreaterThanOrEqual(atRelease.row);
      expect(released.row).toBeLessThanOrEqual(atRelease.row + 1);
      await page.waitForTimeout(250);
      expect(await popupState(page)).toMatchObject({
        row: released.row,
        tab: released.tab,
      });
      const track = await page.locator("#scroll").boundingBox();
      const center = {
        x: track.x + track.width / 2,
        y: track.y + track.height / 2,
      };
      if (viewport.touch) await page.touchscreen.tap(center.x, center.y);
      else await page.mouse.click(center.x, center.y);
      await page.waitForTimeout(250);
      expect((await popupState(page)).tab).toBe(held.tab);
      await page.screenshot({
        path: testInfo.outputPath("scrollbar-release.png"),
      });
      const beforeTap = await popupState(page);
      const row = await nativePoint(page, "popup", "popup-content-0-3");
      if (viewport.touch) await page.touchscreen.tap(row.x, row.y);
      else await page.mouse.click(row.x, row.y);
      await expect
        .poll(async () => (await popupState(page)).row)
        .toBe(beforeTap.scroll);
    });
  });
}
