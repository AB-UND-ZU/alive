const { chromium } = require("@playwright/test");
const assert = require("assert/strict");
const fs = require("fs");
const stage = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const width of [1280, 390])
      for (const scene of ["door-first", "sign-first", "boat"]) {
        const page = await browser.newPage({
          viewport: { width, height: 800 },
        });
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`http://127.0.0.1:4196/?stage=${stage}&scene=${scene}`);
        await page.waitForFunction(() => window.live && window.liveThree);
        await page
          .locator(
            (await page.locator("#pause-resume").isVisible())
              ? "#pause-resume"
              : "#resume"
          )
          .click();
        await page.waitForTimeout(1000);
        const state = () =>
          page.evaluate(() => {
            const w = window.live.ecs;
            const hero = w.getEntities(["PLAYER", "ACTIONABLE", "POSITION"])[0];
            const door = w.getEntities(["LOCKABLE"])[0];
            const boat = w.getEntities(["MOUNTABLE"])[0];
            return {
              action: hero.ACTIONABLE,
              popup: hero.PLAYER.popup,
              mount: hero.PLAYER.mount,
              position: { ...hero.POSITION },
              locked: door?.LOCKABLE.locked,
              boatId: boat && w.getEntityId(boat),
            };
          });
        const before = await state();
        if (scene === "door-first") {
          assert.ok(before.action.unlock);
          await page.waitForTimeout(500);
          await page.keyboard.press("Enter", { delay: 80 });
          await page.waitForFunction(
            () =>
              window.live.ecs.getEntities(["LOCKABLE"])[0].LOCKABLE.locked ===
              false
          );
          await page.waitForFunction(
            () =>
              !!window.live.ecs.getEntities(["PLAYER", "ACTIONABLE"])[0]
                .ACTIONABLE.popup
          );
        } else if (scene === "sign-first") {
          assert.ok(before.action.popup);
          assert.equal(before.action.unlock, undefined);
          await page.waitForTimeout(500);
          await page.keyboard.press("Enter", { delay: 80 });
          await page.waitForFunction(
            () =>
              !!window.live.ecs.getEntities(["PLAYER", "ACTIONABLE"])[0].PLAYER
                .popup
          );
          assert.equal((await state()).locked, true);
        } else {
          assert.ok(before.action.mount);
          await page.waitForTimeout(500);
          await page.keyboard.press("Enter", { delay: 80 });
          await page.waitForFunction(
            () =>
              !!window.live.ecs.getEntities(["PLAYER", "ACTIONABLE"])[0].PLAYER
                .mount
          );
          assert.equal((await state()).mount, before.boatId);
          await page.keyboard.down("ArrowRight");
          await page.waitForTimeout(600);
          await page.keyboard.up("ArrowRight");
          await page.waitForFunction(
            () =>
              window.live.ecs.getEntities(["PLAYER", "POSITION"])[0].POSITION
                .x >= 6
          );
          assert.notDeepEqual((await state()).position, before.position);
        }
        await page.waitForTimeout(3000);
        await page.screenshot({
          path: `results/performance/live/${stage}-${scene}-check-${width}.png`,
        });
        const after = await state();
        if (scene === "sign-first") {
          await page.keyboard.press("Escape");
          await page.waitForFunction(
            () =>
              !window.live.ecs.getEntities(["PLAYER", "ACTIONABLE"])[0].PLAYER
                .popup
          );
        }
        assert.deepEqual(errors, []);
        results.push({ width, scene, before, after, errors });
        console.log("Passed", width, scene);
        await page.close();
      }
    fs.writeFileSync(
      `results/performance/live/${stage}-interactions.json`,
      JSON.stringify(results, null, 2)
    );
    console.log(results);
  } finally {
    await browser.close();
  }
})();
