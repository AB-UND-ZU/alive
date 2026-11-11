const { test, expect } = require("./fixtures.cjs");
const pages = require("../../../src/wiki/pages.json");

test("player pages keep entity references capitalized and put their sprite and label in the same link", async ({
  page,
}) => {
  test.setTimeout(300000);
  const failures = [];
  for (const entry of pages.filter(
    (entry) => entry.chapter === "Gameplay" && !entry.disabled
  )) {
    await page.goto("/" + entry.route);
    const violations = await page.locator("main").evaluate((main) => {
      const label = (node) => {
        const copy = node.cloneNode(true);
        copy
          .querySelectorAll(".Pixels, .InlineCode")
          .forEach((node) => node.remove());
        return copy.textContent.replace(/\s+/g, " ").trim();
      };
      const problems = [];
      for (const node of main.querySelectorAll(".RichMention, .Item")) {
        if (!node.querySelector(".Pixels") || !label(node)) continue;
        if (!node.closest("a.WikiLink"))
          problems.push("Unlinked sprite: " + label(node));
        const letters = label(node).replace(/^[^A-Za-z]+/, "");
        if (/^[a-z]/.test(letters))
          problems.push("Lowercase entity: " + label(node));
      }
      for (const node of main.querySelectorAll("a.WikiLink")) {
        if (node.closest(".CodeBlock, .InlineCode")) continue;
        if (node.querySelector("a"))
          problems.push("Nested links: " + label(node));
        const name = label(node),
          url = new URL(node.href);
        if (
          node.querySelector(".Pixels") &&
          /^[a-z]/.test(name.replace(/^[^A-Za-z]+/, ""))
        )
          problems.push("Lowercase sprite link: " + name);
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const target = url.hash.slice(1).replace(/[^a-z0-9]/g, "");
        const entity =
          /\/game-design\/(characters|items|cells)\//.test(url.pathname) &&
          url.hash &&
          [
            target,
            target + "s",
            target + "es",
            target.replace(/y$/, "ie") + "s",
          ].includes(slug);
        if (
          (entity || /^(gate|smith|portal)s?$/i.test(name)) &&
          !node.querySelector(".Pixels")
        )
          problems.push("Missing sprite: " + name);
      }
      for (const node of main.querySelectorAll(".Text")) {
        if (
          node.closest(
            "a, button, .Heading, .CodeBlock, .InlineCode, .SpriteGallery [data-column='1']"
          )
        )
          continue;
        if (/^(gate|smith|portal)s?$/i.test(label(node)))
          problems.push("Unlinked entity label: " + label(node));
      }
      return [...new Set(problems)];
    });
    if (violations.length) failures.push({ page: entry.route, violations });
  }
  expect(failures).toEqual([]);
});
