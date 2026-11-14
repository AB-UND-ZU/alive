const { test: base, expect } = require("@playwright/test");
const pages = require("../../../src/wiki/pages.json");
const routes = new Set([
  "/",
  ...pages.flatMap((page) =>
    [page.route, ...(page.aliases || [])].map((route) => "/" + route)
  ),
]);

const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (...args) => {
      const target = new URL(args[0], baseURL);
      if (
        process.env.WIKI_TEST_DEV !== "true" &&
        target.origin === new URL(baseURL).origin &&
        routes.has(target.pathname)
      ) {
        target.pathname = "/wiki" + target.pathname;
        args[0] = target.href;
      }
      const response = await goto(...args);
      const pathname = new URL(page.url()).pathname.replace(
        /^\/wiki(?=\/)/,
        ""
      );
      if (routes.has(pathname))
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
