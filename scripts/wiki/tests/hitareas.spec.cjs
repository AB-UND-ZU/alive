const { test, expect } = require("@playwright/test");

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
      layers: popup?.POPUP.sprite?.sprites[0]?.layers,
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
