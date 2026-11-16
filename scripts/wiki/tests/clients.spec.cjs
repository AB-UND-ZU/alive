const { test, expect } = require("./fixtures.cjs");

test("Clients lists renderer features and keeps the old ThreeJS route", async ({
  page,
}) => {
  await page.goto("/game-design/clients/renderers.html");
  const clients = page
    .locator("nav .NavGroup")
    .filter({ has: page.locator(".NavGroupTitle", { hasText: "[CLIENTS]" }) });
  expect(
    await clients
      .locator("a")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("aria-label"))
      )
  ).toEqual(["Renderers", "ThreeJS", "HTML", "Terminal"]);
  await expect(
    page.getByRole("rowheader", { name: "Lighting", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("rowheader", { name: "Example", exact: true })
  ).toHaveCount(1);
  await expect(page.locator('[data-scene="comparison"]')).toHaveCount(3);
  for (const renderer of ["three-js", "html", "terminal"]) {
    const preview = page.locator(
      `[data-scene="comparison"][data-renderer="${renderer}"]`
    );
    await preview.scrollIntoViewIfNeeded();
    const iframe = preview.locator("iframe");
    await expect(iframe).toHaveAttribute("data-x", "3");
    await expect(iframe).toHaveCSS("width", "198px");
    await expect(iframe).toHaveCSS("height", "224px");
    const frame = page.frameLocator(
      `[data-scene="comparison"][data-renderer="${renderer}"] iframe`
    );
    await expect(frame.locator(".Stats, .Controls, .DemoFrame")).toHaveCount(0);
    if (renderer === "terminal") {
      await expect(frame.locator(".TerminalBrowserPreview")).toHaveCSS(
        "font-size",
        "32px"
      );
      const lines = (await frame.locator("pre").innerText()).split("\n");
      expect(lines).toHaveLength(7);
      expect(lines.every((line) => [...line].length === 11)).toBe(true);
    } else {
      await expect(
        frame.locator(renderer === "html" ? ".HtmlRenderer" : "canvas")
      ).toBeVisible();
    }
  }
  await page.goto("/game-design/rendering/threejs.html");
  await expect(page.locator(".Preview")).toHaveAttribute(
    "data-scene",
    "clients"
  );
  await expect(page.locator("main")).toContainText("default browser client");
  await page.goto("/development/wiki/preview.html");
  await expect(page.locator("main h1")).toHaveAccessibleName("Game Frame");
});

for (const width of [1440, 390]) {
  for (const client of ["three-js", "html", "terminal"]) {
    test(`${client} runs a real client preview at ${width}px`, async ({
      page,
    }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(
        `/game-design/clients/${
          client === "three-js" ? "threejs" : client
        }.html`
      );
      const preview = page.locator('[data-scene="clients"]');
      await preview.scrollIntoViewIfNeeded();
      const iframe = preview.locator("iframe");
      await expect(iframe).toBeVisible();
      await expect(preview).toHaveAttribute("data-renderer", client);
      const clientPath = client === "three-js" ? "/" : `/${client}/`;
      await expect(iframe).toHaveAttribute(
        "src",
        new URL(`${clientPath}?preview`, page.url()).href
      );
      await expect(
        page.getByRole("link", {
          name: new RegExp(
            `^Play ${
              client === "three-js"
                ? "ThreeJS"
                : client === "html"
                ? "HTML"
                : "Terminal"
            }\\.?$`
          ),
        })
      ).toHaveAttribute("href", new URL(clientPath, page.url()).href);
      const frame = page.frameLocator('iframe[title="Renderer"]');
      if (client === "terminal") {
        await expect(frame.locator(".TerminalBrowserPreview")).toBeVisible();
        await expect(
          frame.locator("canvas, .HtmlRenderer, .DemoFrame, .Stats, .Controls")
        ).toHaveCount(0);
      } else {
        await expect(
          frame.locator(client === "html" ? ".HtmlRenderer" : "canvas")
        ).toBeVisible();
        await expect(frame.locator(".DemoFrame")).toHaveCount(0);
      }
      await expect(iframe).toHaveAttribute("data-x", /\d+/);
      await frame
        .locator(
          client === "terminal" ? ".TerminalBrowserPreview" : ".Terminal"
        )
        .evaluate(() => window.focus());
      await iframe.click({ position: { x: 150, y: 180 } });
      const level = await frame
        .locator(
          client === "terminal" ? ".TerminalBrowserPreview" : ".Terminal"
        )
        .evaluate((element) => {
          let fiber =
            element[
              Object.keys(element).find((name) =>
                name.startsWith("__reactFiber")
              )
            ];
          while (fiber && !fiber.memoizedProps?.value?.ecs)
            fiber = fiber.return;
          return fiber?.memoizedProps.value.ecs.metadata.gameEntity.LEVEL.name;
        });
      expect(level).toBe("LEVEL_MENU");
      const initialX = await iframe.getAttribute("data-x");
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(350);
      await page.keyboard.up("ArrowRight");
      await expect(iframe).not.toHaveAttribute("data-x", initialX);
      const cellHeight = await frame
        .locator(client === "terminal" ? ".TerminalBrowserPreview" : ".App")
        .evaluate((element) =>
          getComputedStyle(element).getPropertyValue("--cell-height").trim()
        );
      expect(cellHeight).toBe("32px");
      expect(
        await frame.locator("body").evaluate(() => typeof window.aliveChat)
      ).toBe("undefined");
      await expect(
        frame.getByRole("button", { name: "Reset", exact: true })
      ).toHaveCount(0);
      const scripts = await frame
        .locator(
          client === "terminal" ? ".TerminalBrowserPreview" : ".Terminal"
        )
        .evaluate(() =>
          performance
            .getEntriesByType("resource")
            .map((entry) => new URL(entry.name))
            .filter((url) => url.pathname.endsWith(".js"))
            .map((url) => url.pathname)
        );
      expect(scripts.length).toBeGreaterThan(0);
      expect(
        scripts.every((path) => path.startsWith(`${clientPath}static/js/`))
      ).toBe(true);
      if (client === "terminal")
        await expect(frame.locator(".TerminalBrowserPreview svg")).toHaveCount(
          0
        );
      expect(errors).toEqual([]);
    });
  }
}
