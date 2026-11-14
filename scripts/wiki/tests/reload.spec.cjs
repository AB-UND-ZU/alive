const { test, expect } = require("./fixtures.cjs");
const fs = require("node:fs");
const path = require("node:path");

test("the wiki dev server rebuilds and reloads a Markdown edit", async ({
  page,
}) => {
  const file = path.resolve("wiki/touch.md"),
    original = fs.readFileSync(file, "utf8"),
    marker = "Live Reload Verification Marker";
  try {
    await page.goto("/game-design/controls/touch.html");
    await expect(page.locator('script[src*="bundle.js"]')).toHaveCount(1);
    await expect(page.locator("main h1")).toHaveAccessibleName("Touch");
    await page.waitForTimeout(250);
    fs.writeFileSync(file, original + "\n" + marker + "\n");
    for (let attempt = 0; attempt < 12; attempt++) {
      expect(
        (await page.request.get("/game-design/controls/touch.html")).status()
      ).toBe(200);
      await page.waitForTimeout(50);
    }

    await expect
      .poll(
        async () =>
          page
            .locator("main")
            .textContent()
            .catch(() => ""),
        { timeout: 20000 }
      )
      .toContain(marker);
    await expect(page).toHaveURL(/touch.html$/);
  } finally {
    fs.writeFileSync(file, original);
    await expect
      .poll(
        async () =>
          page
            .locator("main")
            .textContent()
            .catch(() => marker),
        { timeout: 20000 }
      )
      .not.toContain(marker);
    await expect(page.locator("main h1")).toHaveAccessibleName("Touch");
    await page.reload();
    await expect(page.locator("main h1")).toHaveAccessibleName("Touch");
    const markdown = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .find((url) => /\/touch\.[^/]+\.md$/.test(url))
    );
    expect(markdown).toBeTruthy();
    const response = await page.request.get(markdown);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("# Touch");
    expect(response.headers()["content-type"]).not.toContain("text/html");
  }
});

test("wiki development previews open each client's standard menu", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const [client, host] of [
    ["threejs", "canvas"],
    ["html", ".HtmlRenderer"],
    ["terminal", ".TerminalBrowserPreview"],
  ]) {
    await page.goto(`/game-design/clients/${client}.html`);
    const preview = page.locator('[data-scene="clients"]');
    await preview.scrollIntoViewIfNeeded();
    const iframe = preview.locator("iframe");
    await expect(iframe).toHaveAttribute("data-x", /\d+/, { timeout: 30000 });
    await expect(
      page.frameLocator('iframe[title="Renderer"]').locator(host)
    ).toBeVisible();
  }
});
