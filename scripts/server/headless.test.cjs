const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { buildServer } = require("./build.cjs");

test("the native engine runs, moves and restores snapshots in Node without a browser", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "alive-server-test-"));
  try {
    const outfile = path.join(directory, "engine.cjs");
    await buildServer({
      stdin: {
        contents: `export {createAreaWorld,assertHero,walk,advance} from "./src/testing/harness";
        export {createSnapshot,restoreSnapshot} from "./src/engine/snapshot";
        export {createSystems,preloadLevel} from "./src/engine/ecs";`,
        resolveDir: process.cwd(),
        loader: "ts",
      },
      outfile,
    });
    const engine = require(outfile);
    assert.equal(typeof globalThis.window, "undefined");
    const world = engine.createAreaWorld("|       |\n| ♀     |\n|       |");
    engine.advance(world, 3000);
    const hero = engine.assertHero(world);
    const before = hero.POSITION.x;
    engine.walk(world, "right", 1);
    assert.equal(hero.POSITION.x, before + 1);
    const snapshot = engine.createSnapshot(world);
    const restored = engine.restoreSnapshot(structuredClone(snapshot));
    engine.createSystems(restored);
    engine.preloadLevel(restored);
    engine.walk(restored, "right", 1);
    assert.equal(engine.assertHero(restored).POSITION.x, before + 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
