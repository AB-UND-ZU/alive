const { test, expect } = require("./fixtures.cjs");

test("unavailable Markdown reports an error while navigation remains usable", async ({
  page,
}) => {
  await page.route("**/touch.*.md", (route) =>
    route.fulfill({ status: 404, body: "Missing" })
  );
  await page.goto("/game-design/controls/touch.html");
  await expect(page.getByRole("alert")).toContainText(
    "Could not load wiki/touch.md"
  );
  await page.locator('nav a[aria-label="Keyboard/Mouse"]').click();
  await expect(page.locator("h1")).toHaveAccessibleName("Keyboard/Mouse");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
