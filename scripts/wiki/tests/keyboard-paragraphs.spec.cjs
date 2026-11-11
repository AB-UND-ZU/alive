const { test, expect } = require("./fixtures.cjs");
for (const width of [1440, 390, 360]) {
  test(`key instructions stay in separate readable lines at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    const pages = [];
    for (const name of [
      "keyboard-mouse",
      "map",
      "chat",
      "quests",
      "savegames",
      "shops",
      "skills",
      "spells",
      "harvesting",
      "tools",
      "gear",
      "consumables",
      "slots",
      "stats",
      "npcs",
      "dialogs",
      "menu",
      "signs",
    ]) {
      await page.goto(`/${name}.html`);
      const failures = await page
        .locator(".ControlParagraph")
        .evaluateAll((nodes) =>
          nodes
            .filter(
              (node) =>
                node.scrollWidth > node.clientWidth + 1 ||
                !node.firstElementChild.classList.contains("Key") ||
                [...node.querySelectorAll(".Text")].some(
                  (text) => text.getBoundingClientRect().height > 32.1
                )
            )
            .map((node) => node.textContent)
        );
      if (failures.length) pages.push({ page: name, failures });
      await expect(page.locator("table .Key")).toHaveCount(0);
    }
    expect(pages).toEqual([]);
  });
}
