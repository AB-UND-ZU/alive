const { test: base, expect } = require("@playwright/test");
const pages = require("../../../src/wiki/pages.json");
const routes = new Set([
  "/",
  ...pages.flatMap((page) =>
    [page.route, ...(page.aliases || [])].map((route) => "/" + route)
  ),
]);

const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (...args) => {
      const response = await goto(...args);
      if (routes.has(new URL(page.url()).pathname))
        await expect(page.locator("main")).toHaveAttribute(
          "aria-busy",
          "false",
          { timeout: 30000 }
        );
      return response;
    };
    await use(page);
  },
});
module.exports = { test, expect };
