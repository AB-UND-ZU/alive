const { defineConfig } = require("@playwright/test");
const port = process.env.WIKI_PORT || 4173;
module.exports = defineConfig({
  testDir: "./scripts/wiki/tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
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
    command: "npm run wiki:dev",
    url: `http://127.0.0.1:${port}/__wiki_health`,
    reuseExistingServer: !process.env.CI,
  },
});
