const { test: base, expect } = require("@playwright/test");
const pages = require("../../../src/wiki/pages.json");
const routes = new Set([
  "/",
  ...pages.flatMap((page) =>
    [page.route, ...(page.aliases || [])].map((route) => "/" + route)
  ),
]);

const test = base.extend({
  freezeGameClock: async ({ page }, use) => {
    await page.clock.install();
    await use(async () => {
      // Freeze at the current instant without fast-forwarding pending input or timers.
      const now = new Date();
      await page.clock.setFixedTime(now);
      await page.clock.pauseAt(now);
      await page.clock.setSystemTime(now);
      return page.clock;
    });
  },
  page: async ({ page, baseURL }, use) => {
    await page.addInitScript(() => {
      if (window !== window.top || !location.pathname.endsWith("/preview.html"))
        return;
      window.previewStarted = new Promise((resolve) => {
        const ready = (event) => {
          if (
            event.source !== window ||
            event.origin !== location.origin ||
            event.data?.type !== "preview-ready"
          )
            return;
          window.removeEventListener("message", ready);
          resolve();
        };
        window.addEventListener("message", ready);
      });
    });
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
      const response = await goto(args[0], {
        waitUntil: "domcontentloaded",
        ...args[1],
      });
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
// Standalone feature previews have no wiki parent to answer their ready message.
async function playPreview(page) {
  await page.evaluate(async () => {
    await window.previewStarted;
    window.postMessage({ type: "play" }, location.origin);
    window.dispatchEvent(new Event("focus"));
  });
}
// A visible iframe can still be loading bundles, sound buffers or its world.
async function readyFrame(preview) {
  await preview.scrollIntoViewIfNeeded();
  const frame = preview.locator("iframe[data-x]");
  await frame.waitFor({ state: "attached" });
  return frame;
}

module.exports = { test, expect, playPreview, readyFrame };
