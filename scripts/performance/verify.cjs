const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { isDeepStrictEqual } = require("node:util");
const stages = process.argv.slice(2);
const animate = process.env.ANIMATE === "1";
if (!stages.length) stages.push("baseline", "hud");
const cases = {
  tutorial: [
    "initial",
    "right",
    "damage",
    "paused",
    "resumed",
    "fog",
    "resize",
    "restore",
    "remount",
  ],
  island: ["initial", "right", "paused", "resumed", "restore"],
  menu: ["initial", "right", "paused", "resumed"],
  water: ["initial", "wet", "dry", "light"],
  seam: ["initial", "seam"],
  house: ["initial", "open", "enter", "exit"],
  spells: [
    "initial",
    "cast",
    "flight",
    "finished",
    "dead",
    "reviving",
    "revive",
  ],
};
(async () => {
  const browser = await chromium.launch({ headless: true });
  const rows = [],
    references = new Map();
  try {
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 390, height: 844 },
    ])
      for (const [scene, actions] of Object.entries(
        animate
          ? {
              tutorial: ["initial", "right", "paused", "resumed", "fog"],
              spells: ["initial", "cast", "flight", "paused", "resumed"],
            }
          : Object.fromEntries(
              Object.entries(cases).filter(
                ([name]) => !process.env.SCENE || name === process.env.SCENE
              )
            )
      ))
        for (const stage of stages) {
          const page = await browser.newPage({ viewport });
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          await page.goto(
            `http://127.0.0.1:4186/?static&stage=${stage}&scene=${scene}${
              animate ? "&animate" : ""
            }&level=${
              scene === "menu"
                ? "menu"
                : scene === "island"
                ? "island"
                : "tutorial"
            }`
          );
          await page.waitForFunction(
            () => window.bench && !window.bench.paused
          );
          await page.waitForTimeout(500);
          await page.evaluate(() => window.bench.state.setFrameloop("never"));
          for (const action of actions) {
            if (action === "resize")
              await page.setViewportSize({
                width: viewport.width > 800 ? 980 : 414,
                height: viewport.width > 800 ? 620 : 896,
              });
            await page.evaluate((action) => {
              const b = window.bench;
              const move = (direction, frames) => {
                b.move(direction);
                b.step(frames);
                b.move(null);
                b.step(2);
              };
              if (action === "initial") b.step(180);
              if (action === "right") move("right", 15);
              if (action === "damage") {
                b.action("damage");
                b.step(2);
              }
              if (action === "paused" || action === "resumed")
                document.getElementById("menu").click();
              if (action === "fog" || action === "light") {
                b.action(action);
                b.step(1);
              }
              if (action === "restore" || action === "remount") {
                window.expectedEpoch = b.epoch + 1;
                b.remount(action === "restore");
              }
              if (action === "wet") move("left", 30);
              if (action === "dry") move("right", 30);
              if (action === "seam") move("left", 45);
              if (action === "open") {
                b.action("open");
                b.step(60);
              }
              if (action === "enter") move("up", 45);
              if (action === "exit") move("down", 45);
              if (action === "cast") {
                b.action("spell");
                b.step(1);
              }
              if (action === "flight") b.step(10);
              if (action === "finished") b.step(90);
              if (action === "dead") {
                b.action("die");
                b.step(300);
              }
              if (action === "reviving") {
                b.action("revive");
                b.step(30);
              }
              if (action === "revive") b.step(180);
            }, action);
            await page.waitForTimeout(100);
            await page.waitForFunction(
              (action) =>
                window.bench &&
                window.bench.epoch >= (window.expectedEpoch || 0) &&
                window.bench.paused === (action === "paused"),
              action
            );
            const result = await page.evaluate(
              async ({ animate, action }) => {
                const b = window.bench;
                b.state.setFrameloop("never");
                if (action === "remount") b.step(180);
                await b.advance(animate && action !== "initial" ? 3 : 120);
                return {
                  image: b.capture(),
                  state: b.stateSnapshot(),
                  hero: b.hero(),
                  observe: b.observe(),
                  render: b.renderState(),
                };
              },
              { animate, action }
            );
            const key = `${animate ? "animated-" : ""}${
                viewport.width
              }-${scene}-${action}`,
              filename = `results/performance/${stage}-${key}`;
            fs.writeFileSync(
              filename + ".png",
              Buffer.from(result.image, "base64")
            );
            if (stage === stages[0]) references.set(key, result);
            const reference = references.get(key);
            const samePixels = result.image === reference.image;
            const sameState = isDeepStrictEqual(result.state, reference.state);
            const row = {
              stage,
              scene,
              action,
              width: viewport.width,
              samePixels,
              sameState,
              hero: result.hero,
              observe: result.observe,
            };
            rows.push(row);
            console.log(JSON.stringify(row));
            fs.writeFileSync(
              "results/performance/" +
                (animate ? "animated-checks" : "visual-checks") +
                ".json",
              JSON.stringify(rows, null, 2)
            );
            if (!samePixels)
              fs.writeFileSync(
                "results/performance/render-mismatch.json",
                JSON.stringify(
                  { reference: reference.render, result: result.render },
                  null,
                  2
                )
              );
            if (!sameState)
              fs.writeFileSync(
                "results/performance/state-mismatch.json",
                JSON.stringify(
                  { reference: reference.state, result: result.state },
                  null,
                  2
                )
              );
            assert.ok(samePixels && sameState, JSON.stringify(row));
            if (action === "wet") assert.equal(result.hero.swimming, true);
            if (action === "dry") assert.equal(result.hero.swimming, false);
            if (action === "seam") assert.ok(result.hero.position.x > 32);
            if (action === "enter") assert.ok(result.hero.layer.structure);
            if (action === "exit") assert.ok(!result.hero.layer.structure);
            if (action === "cast") assert.ok(result.observe.CASTABLE > 0);
            if (action === "dead") assert.ok(result.observe.SOUL > 0);
            if (action === "revive")
              assert.ok(result.hero.hp > 0 && result.observe.SOUL === 0);
            if (action === "paused")
              assert.ok(await page.locator("#pause-resume").isVisible());
            assert.deepEqual(errors, []);
            if (
              action === "paused" ||
              action === "resumed" ||
              action === "finished"
            )
              await page.screenshot({ path: filename + "-full.png" });
          }
          await page.close();
        }
  } finally {
    await browser.close();
  }
})();
