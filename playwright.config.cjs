const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./scripts/docs/tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      args: ["--disable-gpu"],
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
    },
  },
  webServer: {
    command: "npm run docs:dev",
    url: "http://127.0.0.1:4173/__docs_health",
    reuseExistingServer: !process.env.CI,
  },
});
