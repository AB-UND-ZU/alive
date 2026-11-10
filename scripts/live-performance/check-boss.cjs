const { chromium } = require("@playwright/test");
const fs = require("fs");
const assert = require("assert/strict");
const stage = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:4196/?stage=${stage}&scene=long`);
      await page.waitForFunction(() => window.live && window.liveThree);
      await page
        .locator(
          (await page.locator("#pause-resume").isVisible())
            ? "#pause-resume"
            : "#resume"
        )
        .click();
      await page.evaluate(() => {
        window.live.boss();
        window.live.startBoss();
      });
      await page.waitForFunction(
        () =>
          window.live.ecs
            .getEntities(["NPC", "STATS"])
            .some((e) => e.NPC.type === "wormBoss"),
        {},
        { timeout: 30000 }
      );
      for (const key of ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]) {
        await page.keyboard.down(key);
        await page.waitForTimeout(500);
        await page.keyboard.up(key);
        await page.keyboard.press("Space");
      }
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: `results/performance/live/${stage}-boss-check-${width}-alive.png`,
      });
      await page.locator("#menu").click();
      assert.ok(await page.locator("#pause-resume").isVisible());
      await page.locator("#pause-resume").click();
      await page.evaluate(() => {
        const boss = window.live.ecs
          .getEntities(["NPC", "STATS"])
          .find((e) => e.NPC.type === "wormBoss");
        if (!boss) throw Error("Boss disappeared before death check");
        boss.STATS.hp = 0;
      });
      await page.waitForFunction(
        () =>
          window.live.ecs
            .getEntities(["PLAYER"])
            .some((e) => e.PLAYER.defeatedUnits?.wormBoss === 1),
        {},
        { timeout: 45000 }
      );
      await page.waitForTimeout(3000);
      const state = await page.evaluate(() => {
        const world = window.live.ecs;
        const hero = world
          .getEntities(["PLAYER"])
          .find((e) => e.PLAYER.defeatedUnits?.wormBoss);
        return {
          defeated: hero.PLAYER.defeatedUnits.wormBoss,
          kills: hero.PLAYER.kills,
          entities: world.metadata.ecs.entities.length,
          remainingBosses: world
            .getEntities(["NPC"])
            .filter((e) => e.NPC.type === "wormBoss").length,
        };
      });
      assert.equal(state.defeated, 1);
      assert.equal(state.remainingBosses, 0);
      assert.deepEqual(errors, []);
      await page.screenshot({
        path: `results/performance/live/${stage}-boss-check-${width}-dead.png`,
      });
      results.push({ width, ...state, errors });
      await page.close();
    }
    fs.writeFileSync(
      `results/performance/live/${stage}-boss-check.json`,
      JSON.stringify(results, null, 2)
    );
    console.log(results);
  } finally {
    await browser.close();
  }
})();
