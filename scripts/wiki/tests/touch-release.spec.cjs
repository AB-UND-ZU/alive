const { test, expect } = require("./fixtures.cjs");

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.dropGestureStarts = false;
    for (const type of ["pointerdown", "touchstart"])
      window.addEventListener(
        type,
        (event) => {
          if (window.dropGestureStarts) event.stopImmediatePropagation();
        },
        true
      );
  });
});

const openGame = async (page, scene = "game") => {
  await page.goto(`/preview.html?test#${scene}`);
  await page.waitForFunction(() => {
    const terminal = document.querySelector(".Terminal");
    if (!terminal) return false;
    let fiber =
      terminal[
        Object.keys(terminal).find((key) => key.startsWith("__reactFiber"))
      ];
    while (fiber && !fiber.memoizedProps?.value?.ecs) fiber = fiber.return;
    const context = fiber?.memoizedProps?.value;
    return (
      context?.ecs &&
      !context.suspended &&
      context.ecs.getEntities(["PLAYER"]).length > 0
    );
  });
  await page.evaluate(() => {
    window.postMessage({ type: "play" }, location.origin);
    window.dispatchEvent(new Event("focus"));
  });
  await expect(page.locator(".Paused")).toHaveCount(0);
};

const tapPauseWithoutStarts = async (page) => {
  await page.evaluate(() => {
    window.dropGestureStarts = true;
  });
  const menu = await page.locator("#menu").boundingBox();
  await page.touchscreen.tap(menu.x + menu.width / 2, menu.y + menu.height / 2);
  await expect(page.locator(".Paused")).toBeVisible();
};

test("a completed swipe cannot block pause when the next tap's start events are missing", async ({
  page,
}, testInfo) => {
  await openGame(page);
  await page.evaluate(() => {
    for (const [type, x] of [
      ["touchstart", 160],
      ["touchmove", 220],
      ["touchend", 220],
    ]) {
      const point = {
        target: document.body,
        identifier: 1,
        clientX: x,
        clientY: 430,
      };
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        touches: { value: type === "touchend" ? [] : [point] },
        changedTouches: { value: [point] },
      });
      window.dispatchEvent(event);
    }
  });
  await tapPauseWithoutStarts(page);
  await page.screenshot({
    path: testInfo.outputPath("pause-after-missing-starts.png"),
  });
});

test("closing a dialog with a held scrollbar cannot block a later pause tap", async ({
  page,
}, testInfo) => {
  await openGame(page, "game/ilex");
  const quick = await page.locator("#quick").boundingBox();
  await page.touchscreen.tap(
    quick.x + quick.width / 2,
    quick.y + quick.height / 2
  );
  await expect(page.locator("#content")).toBeVisible();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const target = document.getElementById("down");
    const rect = target.getBoundingClientRect();
    const point = {
      target,
      identifier: 1,
      clientX: rect.x + rect.width / 2,
      clientY: rect.y + rect.height / 2,
    };
    const event = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperties(event, {
      touches: { value: [point] },
      changedTouches: { value: [point] },
    });
    window.dispatchEvent(event);
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#content")).toHaveCount(0);
  await tapPauseWithoutStarts(page);
  await page.screenshot({
    path: testInfo.outputPath("pause-after-detached-scrollbar.png"),
  });
});

test("swiping a dialog cancels its click even after returning to the starting point", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Native drag uses the Chrome touch protocol"
  );
  await openGame(page, "game/ilex");
  const quick = await page.locator("#quick").boundingBox();
  await page.touchscreen.tap(
    quick.x + quick.width / 2,
    quick.y + quick.height / 2
  );
  await expect(page.locator("#content")).toBeVisible();
  const bounds = await page.locator("#content").boundingBox();
  const point = {
    x: bounds.x + bounds.width / 3,
    y: bounds.y + bounds.height / 3,
    id: 1,
  };
  await page.evaluate(() => {
    window.contentClicks = 0;
    document
      .getElementById("content")
      .addEventListener("click", () => window.contentClicks++);
  });
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...point, y: point.y + 60 }],
  });
  await page.waitForTimeout(250);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [point],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.contentClicks)).toBe(0);
  await page.touchscreen.tap(point.x, point.y);
  expect(await page.evaluate(() => window.contentClicks)).toBe(1);
});
