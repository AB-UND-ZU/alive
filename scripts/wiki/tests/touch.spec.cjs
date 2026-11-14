const { test, expect } = require("./fixtures.cjs");

test("Interface loads native controls after navigation from Welcome", async ({
  page,
}) => {
  await page.goto("/index.html");
  await page.locator('nav a[href$="controls/interface.html"]').click();
  const iframe = page.locator(".InterfaceDiagram");
  await expect(iframe).toHaveAttribute(
    "src",
    new URL("/interface-preview.html", page.url()).href
  );
  const frame = await (await iframe.elementHandle()).contentFrame();
  await expect(frame.locator("canvas")).toBeVisible();
  await expect
    .poll(() =>
      frame
        .locator(".Controls .Cell")
        .evaluateAll((nodes) =>
          nodes
            .map(
              (node) =>
                node.getAttribute("data-glyph") ||
                Array.from(node.querySelectorAll(".Layer")).pop()
                  ?.textContent ||
                " "
            )
            .join("")
        )
    )
    .toContain("SLASH");
  await expect
    .poll(() =>
      frame
        .locator(".Controls .Cell")
        .evaluateAll((nodes) =>
          nodes
            .map(
              (node) =>
                node.getAttribute("data-glyph") ||
                Array.from(node.querySelectorAll(".Layer")).pop()
                  ?.textContent ||
                " "
            )
            .join("")
        )
    )
    .toContain("WAVE");
  await expect
    .poll(() =>
      frame
        .locator(".Controls .Cell")
        .evaluateAll((nodes) =>
          nodes
            .map(
              (node) =>
                node.getAttribute("data-glyph") ||
                Array.from(node.querySelectorAll(".Layer")).pop()
                  ?.textContent ||
                " "
            )
            .join("")
        )
    )
    .toContain("Compass");
  await expect(frame.locator("[data-quick-action]")).toHaveCount(5);
  await expect(frame.locator(".InterfaceLabels")).not.toContainText("Hotkeys");
});

test("desktop joystick reference points toward the cursor", async ({
  page,
}) => {
  await page.goto("/game-design/controls/touch.html");
  const reference = page.locator(
    '[aria-label="Touch joystick direction reference"]'
  );
  await reference.scrollIntoViewIfNeeded();
  const bounds = await reference.boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width + 40,
    bounds.y + bounds.height / 2
  );
  await expect(reference).toContainText("\u0119");
  await expect(reference).not.toContainText("\u011a");
  await page.mouse.move(bounds.x - 40, bounds.y + bounds.height / 2);
  await expect(reference).toContainText("\u011a");
  await expect(reference).not.toContainText("\u0119");
});

async function touchScene(page) {
  await page.goto(
    `${process.env.WIKI_TEST_DEV === "true" ? "" : "/wiki"}/game-design/controls/touch.html`
  );
  const preview = page.locator('[data-scene="touch"]');
  await preview.scrollIntoViewIfNeeded();
  const iframe = preview.locator("iframe");
  await expect(iframe).toHaveAttribute("data-x", /\d+/);
  const frame = await (await iframe.elementHandle()).contentFrame();
  await frame.evaluate(() => {
    window.touchInputs = [];
    for (const type of ["touchstart", "touchend", "touchcancel"])
      window.addEventListener(type, (event) => window.touchInputs.push(type));
  });
  return { preview, iframe, frame, bounds: await iframe.boundingBox() };
}

for (const ending of ["release", "leave", "blur"]) {
  test(`desktop touch stops on ${ending} and requires a fresh press`, async ({
    page,
  }) => {
    const { iframe, frame, bounds } = await touchScene(page);
    await expect(frame.locator("style[data-touch-cursor]")).toHaveCount(1);
    const initialX = Number(await iframe.getAttribute("data-x"));
    const x = bounds.x + 170,
      y = bounds.y + 330;
    await page.mouse.move(x, y);
    await page.waitForTimeout(250);
    await expect(frame.locator(".Joystick")).toHaveCount(0);
    expect(Number(await iframe.getAttribute("data-x"))).toBe(initialX);
    await page.mouse.down();
    await page.mouse.move(x + 72, y, { steps: 5 });
    await expect(frame.locator(".Joystick")).toBeVisible();
    const origin = await frame.locator(".Joystick").boundingBox();
    expect(Math.abs(origin.x + origin.width / 2 - bounds.x - 170)).toBeLessThan(
      1
    );
    expect(
      Math.abs(origin.y + origin.height / 2 - bounds.y - 330)
    ).toBeLessThan(1);
    await expect
      .poll(async () => Number(await iframe.getAttribute("data-x")))
      .toBeGreaterThan(initialX);
    if (ending === "release") await page.mouse.up();
    else if (ending === "leave") await page.mouse.move(bounds.x - 10, y);
    else await frame.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect(frame.locator(".Joystick")).toHaveCount(0);
    expect(await frame.evaluate(() => window.touchInputs)).toContain(
      ending === "release" ? "touchend" : "touchcancel"
    );
    // Complete the native queued step before checking sustained idle movement.
    await page.waitForTimeout(450);
    const stopped = await iframe.getAttribute("data-x");
    await page.mouse.move(x + 54, y + 10);
    await page.waitForTimeout(450);
    await expect(frame.locator(".Joystick")).toHaveCount(0);
    expect(await iframe.getAttribute("data-x")).toBe(stopped);
    await page.mouse.up();
    const starts = await frame.evaluate(
      () => window.touchInputs.filter((t) => t === "touchstart").length
    );
    await page.mouse.move(x, y + 32);
    await page.mouse.down();
    await page.mouse.move(x, y + 96, { steps: 5 });
    await expect(frame.locator(".Joystick")).toBeVisible();
    expect(
      await frame.evaluate(
        () => window.touchInputs.filter((t) => t === "touchstart").length
      )
    ).toBe(starts + 1);
    const nextOrigin = await frame.locator(".Joystick").boundingBox();
    expect(
      Math.abs(nextOrigin.y + nextOrigin.height / 2 - bounds.y - 362)
    ).toBeLessThan(1);
    await page.mouse.up();
  });
}

test("native touch keeps real input and shows every reference direction", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const { iframe, frame, bounds } = await touchScene(page);
  await expect(frame.locator("style[data-touch-cursor]")).toHaveCount(0);
  expect(await frame.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(
    0
  );
  const reference = page.locator(
    '[aria-label="Touch joystick direction reference"]'
  );
  const chars = await reference.textContent();
  for (const arrow of ["\u0117", "\u0118", "\u0119", "\u011a"])
    expect(chars).toContain(arrow);
  const initialX = Number(await iframe.getAttribute("data-x"));
  const session = await context.newCDPSession(page);
  const point = { x: bounds.x + 170, y: bounds.y + 330 };
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...point, x: point.x + 72 }],
  });
  await expect(frame.locator(".Joystick")).toBeVisible();
  await expect
    .poll(async () => Number(await iframe.getAttribute("data-x")))
    .toBeGreaterThan(initialX);
  await expect(frame.locator("#interact")).toHaveCount(1);
  await expect(frame.locator("#interact")).toBeHidden();
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(frame.locator(".Joystick")).toHaveCount(0);
  await page.waitForTimeout(450);
  const stopped = await iframe.getAttribute("data-x");
  await page.waitForTimeout(450);
  expect(await iframe.getAttribute("data-x")).toBe(stopped);
  expect(
    await frame.evaluate(
      () => window.touchInputs.filter((t) => t === "touchstart").length
    )
  ).toBe(1);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...point, y: point.y + 64 }],
  });
  await expect(frame.locator(".Joystick")).toBeVisible();
  await session.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(frame.locator(".Joystick")).toHaveCount(0);
  expect(await frame.evaluate(() => window.touchInputs)).toContain(
    "touchcancel"
  );
  await context.close();
});
