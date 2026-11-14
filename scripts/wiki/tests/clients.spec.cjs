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
  for (const client of ["ThreeJS", "HTML", "Terminal"])
    await expect(
      page.getByLabel(`${client} sprite example`, { exact: true })
    ).toHaveCount(1);
  await page.goto("/game-design/rendering/threejs.html");
  await expect(page.locator(".Preview")).toHaveAttribute(
    "data-scene",
    "clients"
  );
  await expect(page.locator("main")).toContainText("default browser client");
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
      await expect(iframe).toHaveAttribute(
        "src",
        new RegExp(`#clients/${client}$`)
      );
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
        await expect(frame.locator(".DemoFrame")).toHaveCount(1);
      }
      await expect(iframe).toHaveAttribute("data-x", /\d+/);
      await frame
        .locator(
          client === "terminal" ? ".TerminalBrowserPreview" : ".DemoFrame"
        )
        .evaluate(() => window.focus());
      await iframe.click({ position: { x: 150, y: 180 } });
      await page.keyboard.press("b");
      await expect(iframe).toHaveAttribute("data-dialog", "inspect");
      await page.keyboard.press("Escape");
      await expect(iframe).toHaveAttribute("data-dialog", "");
      await expect(
        frame.getByRole("button", { name: "Reset", exact: true })
      ).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}
