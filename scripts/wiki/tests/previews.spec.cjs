const { test, expect } = require("./fixtures.cjs");

test("feature previews align 23 by 15 cells with the game camera and show an instruction", async ({
  page,
}) => {
  await page.goto("/game-design/controls/keyboard-mouse.html");
  const preview = page.locator('[data-scene="movement"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  await expect(
    frame.locator('.DemoFrame[data-columns="23"][data-rows="15"]')
  ).toHaveCount(1);
  const readGeometry = () =>
    frame.evaluate(() => {
      const bounds = document
        .querySelector(".DemoFrame")
        .getBoundingClientRect();
      const canvas = document.querySelector("canvas").getBoundingClientRect();
      return {
        width: bounds.width,
        height: bounds.height,
        dx: bounds.x + bounds.width / 2 - canvas.x - canvas.width / 2,
        dy: bounds.y + bounds.height / 2 - canvas.y - canvas.height / 2,
        cell: getComputedStyle(document.documentElement).getPropertyValue(
          "--cell-height"
        ),
        top: bounds.top,
        bottom: bounds.bottom,
        viewport: innerHeight,
      };
    });
  // ResizeObserver sizes the canvas after the iframe has loaded its world.
  await expect
    .poll(async () => {
      const geometry = await readGeometry();
      return Math.max(Math.abs(geometry.dx), Math.abs(geometry.dy));
    })
    .toBeLessThan(0.1);
  const geometry = await readGeometry();
  expect(geometry.width).toBe(414);
  expect(geometry.height).toBe(480);
  expect(geometry.cell).toBe("32px");
  expect(Math.abs(geometry.dx)).toBeLessThan(0.1);
  expect(Math.abs(geometry.dy)).toBeLessThan(0.1);
  expect(geometry.top).toBeGreaterThanOrEqual(-2);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewport);
  await expect(preview.locator(".PreviewInstruction")).toContainText(
    "Follow the maze"
  );
  const note = await preview
    .locator(".PreviewInstruction")
    .evaluate((element) => ({
      top: parseFloat(getComputedStyle(element).marginTop),
      height: element.offsetHeight,
      frame: element.previousElementSibling.offsetHeight,
    }));
  expect(note.top % 32).toBe(0);
  expect(Math.abs(note.top - (note.frame - note.height) / 2)).toBeLessThan(32);
});

test("desktop touch emulation feeds the native joystick and releases movement", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/game-design/controls/touch.html");
  await expect(
    page.locator('[aria-label="Touch joystick direction reference"] .Joystick')
  ).toHaveCount(1);
  const preview = page.locator('[data-scene="touch"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  const initialX = Number(await iframe.getAttribute("data-x"));
  const frame = await (await iframe.elementHandle()).contentFrame();
  await frame.locator("#interact").click();
  await expect(iframe).toHaveAttribute("data-dialog", "craft");
  await iframe.press("Escape");
  await expect(iframe).toHaveAttribute("data-dialog", "");
  await expect(frame.locator(".Controls")).not.toHaveAttribute(
    "style",
    /--popup-height/
  );
  await expect(frame.locator(".PopupClose")).toHaveCount(0);
  await frame.evaluate(() => {
    window.touchInputs = [];
    for (const type of ["touchstart", "touchmove", "touchend"])
      window.addEventListener(type, (event) =>
        window.touchInputs.push(event.type)
      );
  });
  await expect(frame.locator("style[data-touch-cursor]")).toHaveCount(1);
  const bounds = await iframe.boundingBox();
  await page.mouse.move(bounds.x + 180, bounds.y + 330);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 252, bounds.y + 330, { steps: 5 });
  await expect(frame.locator(".Joystick")).toBeVisible();
  expect(
    await frame.evaluate(() => getComputedStyle(document.body).cursor)
  ).toBe("none");
  const origin = await frame.locator(".Joystick").boundingBox();
  expect(Math.abs(origin.x + origin.width / 2 - bounds.x - 180)).toBeLessThan(
    1
  );
  expect(origin.y + origin.height / 2).toBeCloseTo(bounds.y + 330, 1);
  await expect(preview).toHaveClass(/active/);
  await expect(frame.locator(".DemoFrame .Layer").first()).toHaveCSS(
    "color",
    "rgb(0, 255, 0)"
  );
  await expect
    .poll(async () => Number(await iframe.getAttribute("data-x")))
    .toBeGreaterThan(initialX);
  await page.mouse.up();
  await expect(frame.locator(".Joystick")).toHaveCount(0);
  const touches = await frame.evaluate(() => window.touchInputs);
  expect(touches).toContain("touchstart");
  expect(touches).toContain("touchmove");
  expect(touches).toContain("touchend");
  // Let the native queued grid step finish and its position reach the parent.
  await page.waitForTimeout(450);
  const stoppedX = await iframe.getAttribute("data-x");
  await page.waitForTimeout(450);
  expect(await iframe.getAttribute("data-x")).toBe(stoppedX);
  expect(errors).toEqual([]);
});

test("scene HUDs remove unused rows without changing the game camera", async ({
  page,
}) => {
  for (const scene of [
    "abilities",
    "skills",
    "combat",
    "food",
    "movement",
    "water",
  ]) {
    const stat =
      scene === "abilities" ? "MP" : scene === "food" ? "HP" : undefined;
    await page.goto("about:blank");
    await page.setViewportSize({ width: 414, height: stat ? 608 : 576 });
    await page.goto(`/preview.html?test#${scene}`);
    await page.evaluate(() =>
      window.postMessage({ type: "view" }, location.origin)
    );
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator(".Stats")).toHaveCSS(
      "height",
      stat ? "32px" : "0px"
    );
    await expect(page.locator(".Stats .Menu")).toHaveCSS("display", "none");
    for (const name of ["HP", "MP"])
      await expect(page.locator(`.Stats > .Stat${name}`)).toHaveCSS(
        "display",
        stat === name ? "flex" : "none"
      );
    if (scene === "food") {
      await expect(page.locator(".Stats .StatProgress")).toHaveCSS(
        "display",
        "none"
      );
      await expect(page.locator(".Stats .Quick")).toHaveCSS("display", "block");
      await expect(page.locator(".Stats .StatQuick")).toBeVisible();
    } else
      await expect(page.locator(".Stats > .StatXP")).toHaveCSS(
        "display",
        "none"
      );
    const geometry = await page.evaluate(() => ({
      cell: getComputedStyle(document.documentElement).getPropertyValue(
        "--cell-height"
      ),
      frame: document.querySelector(".DemoFrame").getBoundingClientRect(),
      canvas: document.querySelector("canvas").getBoundingClientRect(),
    }));
    expect(geometry.cell).toBe("32px");
    expect(geometry.frame.height).toBe(480);
    expect(
      Math.abs(
        geometry.frame.y + 240 - geometry.canvas.y - geometry.canvas.height / 2
      )
    ).toBeLessThan(0.1);
  }
});

test("native touch devices use the game handlers without a desktop cursor", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 414, height: 576 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/preview.html?test#touch");
    await page.evaluate(() =>
      window.postMessage({ type: "view" }, location.origin)
    );
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator("style[data-touch-cursor]")).toHaveCount(0);
    await expect(page.locator(".Joystick")).toHaveCount(0);
    await page.locator("#interact").tap();
    await expect(page.locator(".Controls")).toHaveAttribute(
      "style",
      /--popup-height/
    );
  } finally {
    await context.close();
  }
});

test("visible crafting autoplay waits for native interaction readiness", async ({
  page,
}) => {
  await page.goto("/game-design/interactions/crafting.html");
  const preview = page.locator('[data-scene="crafting"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  await iframe.scrollIntoViewIfNeeded();
  await expect(iframe).toHaveAttribute("data-dialog", "craft", {
    timeout: 10000,
  });
  await expect(preview).not.toHaveClass(/active/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  await expect(frame.locator(".PopupClose")).toBeVisible();
});

test("Touch instructions remain outside the frame on the character-row grid when resized", async ({
  page,
}) => {
  await page.goto("/game-design/controls/touch.html");
  const preview = page.locator('[data-scene="touch"]');
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator("iframe")).toHaveAttribute("data-x", /\d+/);
  for (const width of [1440, 1110, 1050, 768, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        preview.locator(".PreviewInstruction").evaluate((element) => {
          const note = element.getBoundingClientRect();
          const frame = element.previousElementSibling.getBoundingClientRect();
          const beside = note.left >= frame.right;
          const top = parseFloat(getComputedStyle(element).marginTop);
          return (
            top % 32 === 0 &&
            (beside
              ? note.top >= frame.top && note.bottom <= frame.bottom
              : note.top >= frame.bottom + 32)
          );
        })
      )
      .toBe(true);
  }
});

test("phone maze autoplay completes its path when one native direction is ignored", async ({
  page,
}, testInfo) => {
  test.setTimeout(40000);
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.addInitScript(() => {
    if (window.parent === window) return;
    let ignored = false;
    window.addEventListener(
      "keydown",
      (event) => {
        if (!event.isTrusted && event.key === "ArrowUp" && !ignored) {
          ignored = true;
          event.stopImmediatePropagation();
        }
      },
      true
    );
  });
  await page.goto("/game-design/controls/keyboard-mouse.html");
  const preview = page.locator('[data-scene="movement"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  await page.screenshot({
    path: testInfo.outputPath("maze-start.png"),
    fullPage: true,
  });
  await expect(iframe).toHaveAttribute("data-x", "14", { timeout: 30000 });
  await expect(iframe).toHaveAttribute("data-y", "1");
  await expect(iframe).toHaveAttribute("data-auto", "false");
  await page.screenshot({
    path: testInfo.outputPath("maze-exit.png"),
    fullPage: true,
  });
});
