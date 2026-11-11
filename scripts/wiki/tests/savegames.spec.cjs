const { test, expect } = require("./fixtures.cjs");
const { build } = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");
const { deserialize } = require("node:v8");
const { gunzipSync } = require("node:zlib");
const currentVersion = require("../../../package.json").version;
const futureVersion = `${Number(currentVersion.split(".")[0]) + 1}.0.0`;

let bundle;
const fixture = deserialize(
  gunzipSync(
    fs.readFileSync(
      path.join(process.cwd(), "src/game/saves/fixtures/0.4.0-tutorial.v8.gz")
    )
  )
);
const entry = `
export {loadSaveSummaries,restoreGame} from "./src/game/saves/storage";
export {getSaveSummaries,setSaveSummaries,getSummary,isLoadable,saveVersion} from "./src/game/saves";
export {createSystems,preloadLevel} from "./src/engine/ecs";
export {createAreaWorld,assertHero,walk,step,trigger,advance,advanceUntil} from "./src/testing/harness";
export {getTab,isInPopup} from "./src/engine/systems/popup";
export {getSequence} from "./src/engine/systems/sequence";
`;

test.beforeAll(async () => {
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: "ts" },
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: "SaveMigration",
    loader: { ".css": "empty" },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.PUBLIC_URL": '""',
    },
    logLevel: "silent",
  });
  bundle = result.outputFiles[0].text;
});

test.beforeEach(async ({ page }) => {
  await page.route("**/save-migration-test.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Save migration test</title>",
    })
  );
  await page.goto("/save-migration-test.html");
  await page.addScriptTag({ content: bundle });
  // Playwright passes the native decoded object, including Infinity and aliases.
  await page.evaluate(async (save) => {
    window.originalSave = save;
    const request = indexedDB.open("alive", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("summaries", { keyPath: "id" });
      request.result.createObjectStore("saves", { keyPath: "id" });
    };
    const database = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const complete = (tx) =>
      new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    const put = async (record, summary = SaveMigration.getSummary(record)) => {
      const tx = database.transaction(["summaries", "saves"], "readwrite");
      const done = complete(tx);
      if (record) tx.objectStore("saves").put(record);
      tx.objectStore("summaries").put(summary);
      await done;
    };
    const read = async (id = save.id) => {
      const tx = database.transaction(["summaries", "saves"], "readonly");
      const done = complete(tx);
      const full = tx.objectStore("saves").get(id);
      const summary = tx.objectStore("summaries").get(id);
      await done;
      return { save: full.result, summary: summary.result };
    };
    const trace = { reads: [], writes: [] };
    const get = IDBObjectStore.prototype.get;
    const nativePut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.get = function (...args) {
      trace.reads.push(this.name);
      return get.apply(this, args);
    };
    for (const method of ["getAll", "openCursor"]) {
      const read = IDBObjectStore.prototype[method];
      IDBObjectStore.prototype[method] = function (...args) {
        if (this.name === "saves") trace.reads.push(this.name);
        return read.apply(this, args);
      };
    }
    IDBObjectStore.prototype.put = function (value, ...args) {
      trace.writes.push({ store: this.name, version: value.version });
      return nativePut.call(this, value, ...args);
    };
    const resetTrace = () => {
      trace.reads.length = 0;
      trace.writes.length = 0;
    };
    const openDialog = (confirm = false) => {
      const {
        createAreaWorld,
        assertHero,
        walk,
        step,
        trigger,
        advanceUntil,
        getTab,
        isInPopup,
        getSequence,
      } = SaveMigration;
      const world = createAreaWorld("|         |\n| ♀     Π |\n|         |");
      const hero = assertHero(world);
      walk(world, "right", 5);
      step(world, 15);
      trigger(world, "interact");
      advanceUntil(world, () => !!isInPopup(world, hero), 1000);
      step(world, 30);
      const popup = world.getEntityById(hero.PLAYER.popup);
      if (confirm) {
        trigger(world, "right");
        advanceUntil(
          world,
          () => !!getSequence(world, hero, "message") || !hero.MOVABLE,
          1000
        );
      }
      const message = getSequence(world, hero, "message");
      return {
        tab: getTab(world, popup),
        movable: !!hero.MOVABLE,
        message:
          message?.args.messages
            .map((m) =>
              m.line.map((sprite) => sprite.layers.at(-1)?.char || " ").join("")
            )
            .join(" ") || "",
      };
    };
    window.saveTest = {
      database,
      complete,
      put,
      read,
      trace,
      resetTrace,
      openDialog,
    };
    await put(save);
    resetTrace();
  }, fixture);
});

test("loading the save list upgrades a genuine 0.4 world before opening its native dialog", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const original = originalSave;
    const originalHero = original.snapshot.entities.find(
      ([, c]) => c.PLAYER
    )[1];
    await SaveMigration.loadSaveSummaries();
    const trace = structuredClone(saveTest.trace);
    const record = await saveTest.read();
    const hero = record.save.snapshot.entities.find(([, c]) => c.PLAYER)[1];
    return {
      version: record.save.version,
      summaryVersion: record.summary.version,
      cacheVersion: SaveMigration.getSaveSummaries()[0].version,
      id: record.save.id,
      name: record.save.name,
      classKey: record.save.classKey,
      // Content comparison only; Infinity and actual aliases are checked separately.
      sameSnapshot:
        JSON.stringify(record.save.snapshot) ===
        JSON.stringify(original.snapshot),
      infinity:
        originalHero.STATS.maxXp === Infinity && hero.STATS.maxXp === Infinity,
      originalAlias: originalHero.SPAWNABLE.viewable === originalHero.VIEWABLE,
      alias: hero.SPAWNABLE.viewable === hero.VIEWABLE,
      lightAlias:
        hero.SPAWNABLE.light === hero.SEQUENCABLE.states.vision.args.light,
      dialog: saveTest.openDialog(),
      trace,
    };
  });
  expect(result).toMatchObject({
    version: currentVersion,
    summaryVersion: currentVersion,
    cacheVersion: currentVersion,
    id: fixture.id,
    name: fixture.name,
    classKey: "scout",
    sameSnapshot: true,
    infinity: true,
    originalAlias: true,
    alias: true,
    lightAlias: true,
    dialog: { tab: "load", movable: true },
  });
  expect(result.trace.reads).toEqual(["saves"]);
  expect(result.trace.writes.map((x) => x.store).sort()).toEqual([
    "saves",
    "summaries",
  ]);
});

test("an upgraded save list reads summaries only and writes nothing", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    await SaveMigration.loadSaveSummaries();
    saveTest.resetTrace();
    await SaveMigration.loadSaveSummaries();
    return {
      trace: saveTest.trace,
      version: SaveMigration.getSaveSummaries()[0].version,
    };
  });
  expect(result).toEqual({
    trace: { reads: [], writes: [] },
    version: currentVersion,
  });
});

test("a migrated historical world restores and accepts native movement", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    await SaveMigration.loadSaveSummaries();
    const world = await SaveMigration.restoreGame(originalSave.id);
    world.metadata.resume = () => {};
    world.metadata.initial = false;
    SaveMigration.createSystems(world);
    SaveMigration.preloadLevel(world);
    SaveMigration.advance(world, 1000);
    const hero = SaveMigration.assertHero(world),
      before = { ...hero.POSITION };
    SaveMigration.walk(world, "right", 1);
    return {
      id: world.metadata.saveId,
      level: world.metadata.gameEntity.LEVEL.name,
      dx: hero.POSITION.x - before.x,
      dy: hero.POSITION.y - before.y,
    };
  });
  expect(result).toEqual({
    id: fixture.id,
    level: "LEVEL_TUTORIAL",
    dx: 1,
    dy: 0,
  });
});

test("a stale summary is refreshed without rewriting an already-current world", async ({
  page,
}) => {
  const result = await page.evaluate(async (currentVersion) => {
    const current = {
      ...originalSave,
      version: currentVersion,
      playtime: 12345,
    };
    await saveTest.put(current, {
      ...SaveMigration.getSummary(originalSave),
      playtime: 1,
    });
    saveTest.resetTrace();
    await SaveMigration.loadSaveSummaries();
    return {
      trace: saveTest.trace,
      summary: SaveMigration.getSaveSummaries()[0],
    };
  }, currentVersion);
  expect(result.summary).toMatchObject({
    version: currentVersion,
    playtime: 12345,
  });
  expect(result.trace.reads).toEqual(["saves"]);
  expect(result.trace.writes).toEqual([
    { store: "summaries", version: currentVersion },
  ]);
});

test("a future world behind an old summary is untouched and denied by the native dialog", async ({
  page,
}) => {
  const result = await page.evaluate(async (futureVersion) => {
    await saveTest.put(
      { ...originalSave, version: futureVersion },
      SaveMigration.getSummary(originalSave)
    );
    saveTest.resetTrace();
    await SaveMigration.loadSaveSummaries();
    const trace = structuredClone(saveTest.trace),
      summary = SaveMigration.getSaveSummaries()[0];
    const record = await saveTest.read();
    let refused = false;
    try {
      await SaveMigration.restoreGame(originalSave.id);
    } catch (error) {
      refused = error.message.includes("newer version");
    }
    return {
      trace,
      version: record.save.version,
      cacheVersion: summary.version,
      loadable: SaveMigration.isLoadable(summary),
      sameSnapshot:
        JSON.stringify(record.save.snapshot) ===
        JSON.stringify(originalSave.snapshot),
      refused,
      dialog: saveTest.openDialog(true),
    };
  }, futureVersion);
  expect(result).toMatchObject({
    version: futureVersion,
    cacheVersion: futureVersion,
    loadable: false,
    sameSnapshot: true,
    refused: true,
    trace: { writes: [] },
    dialog: { tab: "load", movable: true, message: "Newer version!" },
  });
});

test("missing worlds and snapshots are not stamped or replaced", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const { snapshot, ...missing } = originalSave;
    await saveTest.put({ ...missing, id: "missing-snapshot" });
    await saveTest.put(null, {
      ...SaveMigration.getSummary(originalSave),
      id: "missing-world",
    });
    await SaveMigration.loadSaveSummaries();
    const incomplete = await saveTest.read("missing-snapshot"),
      absent = await saveTest.read("missing-world"),
      valid = await saveTest.read();
    return {
      incompleteVersion: incomplete.save.version,
      hasSnapshot: "snapshot" in incomplete.save,
      absent: absent.save === undefined,
      absentVersion: absent.summary.version,
      validVersion: valid.save.version,
    };
  });
  expect(result).toEqual({
    incompleteVersion: "0.4.0",
    hasSnapshot: false,
    absent: true,
    absentVersion: "0.4.0",
    validVersion: currentVersion,
  });
});

test("a failed summary write rolls back the world and preserves the original error and cache", async ({
  page,
}) => {
  const result = await page.evaluate(async (currentVersion) => {
    SaveMigration.setSaveSummaries([
      { ...SaveMigration.getSummary(originalSave), name: "cached-before" },
    ]);
    const cache = SaveMigration.getSaveSummaries(),
      put = IDBObjectStore.prototype.put;
    let injected, caught;
    IDBObjectStore.prototype.put = function (value, ...args) {
      if (this.name === "summaries" && value.version === currentVersion) {
        try {
          return put.call(this, { ...value, uncloneable: () => {} }, ...args);
        } catch (error) {
          injected = error;
          throw error;
        }
      }
      return put.call(this, value, ...args);
    };
    try {
      await SaveMigration.loadSaveSummaries();
    } catch (error) {
      caught = error;
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    const record = await saveTest.read();
    return {
      errorName: caught?.name,
      sameError: caught === injected,
      sameCache: cache === SaveMigration.getSaveSummaries(),
      saveVersion: record.save.version,
      summaryVersion: record.summary.version,
    };
  }, currentVersion);
  expect(result).toEqual({
    errorName: "DataCloneError",
    sameError: true,
    sameCache: true,
    saveVersion: "0.4.0",
    summaryVersion: "0.4.0",
  });
});

test("a queued newer writer cannot be overwritten by an old migration read", async ({
  page,
}) => {
  const result = await page.evaluate(async (futureVersion) => {
    const newer = { ...originalSave, version: futureVersion, playtime: 98765 };
    const tx = saveTest.database.transaction(
        ["saves", "summaries"],
        "readwrite"
      ),
      written = saveTest.complete(tx);
    tx.objectStore("saves").put(newer);
    tx.objectStore("summaries").put(SaveMigration.getSummary(newer));
    await Promise.all([written, SaveMigration.loadSaveSummaries()]);
    const first = await saveTest.read();
    await saveTest.put(originalSave);
    const loading = SaveMigration.loadSaveSummaries();
    // The cached openDatabase promise lets the migration acquire its transaction.
    await Promise.resolve();
    const writing = saveTest.put(newer);
    await Promise.all([loading, writing]);
    await SaveMigration.loadSaveSummaries();
    const last = await saveTest.read();
    return {
      first: { version: first.save.version, playtime: first.save.playtime },
      last: { version: last.save.version, playtime: last.save.playtime },
      summaryVersion: last.summary.version,
      cacheVersion: SaveMigration.getSaveSummaries()[0].version,
    };
  }, futureVersion);
  expect(result).toEqual({
    first: { version: futureVersion, playtime: 98765 },
    last: { version: futureVersion, playtime: 98765 },
    summaryVersion: futureVersion,
    cacheVersion: futureVersion,
  });
});
