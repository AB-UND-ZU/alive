#!/bin/sh
set -eu

# GitHub's Ubuntu image provides browser libraries; the game bundles its font.
npx playwright install chromium

node <<'JS'
const { chromium } = require("@playwright/test");
chromium.launch({ args: ["--disable-gpu"] }).then(async (browser) => {
  console.log(`Chromium launch verified: ${browser.version()}`);
  await browser.close();
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
JS
