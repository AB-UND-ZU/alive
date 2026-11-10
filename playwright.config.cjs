const { defineConfig } = require("@playwright/test");
const development = process.env.WIKI_TEST_DEV === "true";
const port = Number(process.env.WIKI_PORT || 4173) + (development ? 1 : 0);
module.exports = defineConfig({
  testDir: "./scripts/wiki/tests",
  testMatch: development ? "**/reload.spec.cjs" : "**/*.spec.cjs",
  testIgnore: development ? [] : ["**/reload.spec.cjs"],
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      args: ["--disable-gpu"],
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
    },
  },
  webServer: {
    command: development
      ? "npm run wiki:dev"
      : `PUBLIC_URL=/ npm run wiki:build && npx --no-install serve .wiki-build --config ../scripts/wiki/serve.json --no-clipboard --no-port-switching --listen tcp://127.0.0.1:${port}`,
    env: { PORT: String(port) },
    timeout: 180000,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
  },
});
