import {
  assertHero,
  createAreaWorld,
  holdMove,
  step,
} from "../../testing/harness";
import { POSITION } from "../../engine/components/position";
import { createSystems, preloadLevel } from "../../engine/ecs";
import { createSnapshot } from "../../engine/snapshot";
import { installFakeIndexedDB } from "./testing";
import {
  getSaveSummaries,
  getSummary,
  SaveGame,
  saveUpgrades,
  saveVersion,
  setSaveSummaries,
} from ".";
import {
  eraseGame,
  loadSaveSummaries,
  restoreGame,
  storeGame,
} from "./storage";

// ♀ hero, c chick
const area = `
|       |
| ♀   c |
|       |
`;

const fake = installFakeIndexedDB();
const readSaves = () => fake.read("alive", "saves") as SaveGame[];

const setPersist = (persist?: () => Promise<boolean>) =>
  Object.defineProperty(navigator, "storage", {
    value: persist && { persist },
    configurable: true,
  });

beforeEach(() => {
  fake.clear();
  setSaveSummaries([]);
  setPersist(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("save storage", () => {
  it("lists no saves before anything was stored", async () => {
    await loadSaveSummaries();

    expect(getSaveSummaries()).toEqual([]);
    expect(fake.stores("alive")).toEqual(["summaries", "saves"]);
  });

  it("stores a game and lists its summary without the snapshot", async () => {
    const world = createAreaWorld(area);

    const save = await storeGame(world);

    expect(world.metadata.saveId).toBe(save.id);
    expect(getSaveSummaries()).toEqual([getSummary(save)]);
    expect(fake.read("alive", "summaries")).toEqual([getSummary(save)]);
    expect(readSaves()).toEqual([save]);
  });

  it("lists stored saves after reloading, latest first", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 11, 15, 13, 23));
    const first = await storeGame(createAreaWorld(area));
    jest.setSystemTime(new Date(2026, 9, 12, 8, 0, 0));
    const second = await storeGame(createAreaWorld(area));
    setSaveSummaries([]);

    await loadSaveSummaries();

    expect(getSaveSummaries().map((save) => save.name)).toEqual([
      "20261012-080000",
      "20261011-151323",
    ]);
    expect(getSaveSummaries().map((save) => save.id)).toEqual([
      second.id,
      first.id,
    ]);
  });

  it("upgrades an older saved world and its summary while listing saves", async () => {
    const saved = await storeGame(createAreaWorld(area));
    const older = { ...saved, version: "0.4.0" };
    fake.write("alive", "saves", older);
    fake.write("alive", "summaries", getSummary(older));
    setSaveSummaries([]);

    await loadSaveSummaries();

    const upgraded = { ...older, version: saveVersion };
    expect(readSaves()).toEqual([upgraded]);
    expect(fake.read("alive", "summaries")).toEqual([getSummary(upgraded)]);
    expect(getSaveSummaries()).toEqual([getSummary(upgraded)]);
    expect(readSaves()[0].snapshot).toEqual(older.snapshot);
  });

  it("keeps stored worlds and the menu cache unchanged when an upgrade fails", async () => {
    const saved = await storeGame(createAreaWorld(area));
    const older = { ...saved, version: "0.0.1" };
    fake.write("alive", "saves", older);
    fake.write("alive", "summaries", getSummary(older));
    const failure = new Error("Unable to upgrade world");
    const upgrade = {
      version: "0.0.2",
      upgrade: () => {
        throw failure;
      },
    };
    saveUpgrades.push(upgrade);

    try {
      await expect(loadSaveSummaries()).rejects.toBe(failure);

      expect(readSaves()).toEqual([older]);
      expect(fake.read("alive", "summaries")).toEqual([getSummary(older)]);
      expect(getSaveSummaries()).toEqual([getSummary(saved)]);
    } finally {
      saveUpgrades.splice(saveUpgrades.indexOf(upgrade), 1);
    }
  });

  it("rolls back both save records when a transaction aborts after a write", async () => {
    const saved = await storeGame(createAreaWorld(area));
    const request = fake.indexedDB.open("alive", 1);
    const database = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = database.transaction(
      ["saves", "summaries"],
      "readwrite"
    );
    transaction.objectStore("saves").put({ ...saved, name: "changed" });
    const summary = transaction.objectStore("summaries").get(saved.id);
    summary.onsuccess = () => {
      transaction
        .objectStore("summaries")
        .put({ ...summary.result, name: "changed" });
      transaction.abort();
    };

    await new Promise<void>((resolve) => {
      transaction.onabort = () => resolve();
    });

    expect(readSaves()).toEqual([saved]);
    expect(fake.read("alive", "summaries")).toEqual([getSummary(saved)]);
    expect(getSaveSummaries()).toEqual([getSummary(saved)]);
  });

  it("replaces the same save when saving a game again", async () => {
    const world = createAreaWorld(area);
    const first = await storeGame(world);
    step(world, 30);

    const second = await storeGame(world);

    expect(second.id).toBe(first.id);
    expect(second.playtime).toBeGreaterThan(first.playtime);
    expect(readSaves()).toEqual([second]);
    expect(getSaveSummaries()).toEqual([getSummary(second)]);
  });

  it("adds a separate save for each new game", async () => {
    await storeGame(createAreaWorld(area));
    await storeGame(createAreaWorld(area));

    expect(readSaves()).toHaveLength(2);
    expect(getSaveSummaries()).toHaveLength(2);
  });

  it("asks the browser to keep saves when storage runs low", async () => {
    const persist = jest.fn(() => Promise.resolve(false));
    setPersist(persist);

    await storeGame(createAreaWorld(area));

    expect(persist).toHaveBeenCalled();
    expect(readSaves()).toHaveLength(1);
  });

  it("keeps the previous save when writing fails", async () => {
    const world = createAreaWorld(area);
    const save = await storeGame(world);
    step(world, 30);
    fake.abortNext(new Error("QuotaExceededError"));

    await expect(storeGame(world)).rejects.toThrow("QuotaExceededError");

    expect(readSaves()).toEqual([save]);
    expect(getSaveSummaries()).toEqual([getSummary(save)]);
  });

  it("restores a saved world that continues once systems are installed", async () => {
    const world = createAreaWorld(area);
    const save = await storeGame(world);
    step(world, 30);

    const restored = await restoreGame(save.id);

    expect(restored.metadata.saveId).toBe(save.id);
    expect(restored.metadata.playtime).toBe(save.playtime);
    expect(createSnapshot(restored)).toEqual(save.snapshot);

    createSystems(restored);
    preloadLevel(restored);
    const hero = assertHero(restored);
    const { x, y } = hero[POSITION];
    holdMove(restored, ["right"]);
    step(restored, 10);
    expect(hero[POSITION]).toEqual({ x: x + 1, y });
  });

  it("upgrades older saves when restoring", async () => {
    const save = await storeGame(createAreaWorld(area));
    fake.write("alive", "saves", { ...save, version: "0.0.1" });
    const upgrade = {
      version: "0.0.2",
      upgrade: (old: SaveGame) => ({
        ...old,
        snapshot: { ...old.snapshot, playtime: 1234 },
      }),
    };
    saveUpgrades.push(upgrade);

    try {
      const restored = await restoreGame(save.id);
      expect(restored.metadata.playtime).toBe(1234);
    } finally {
      saveUpgrades.splice(saveUpgrades.indexOf(upgrade), 1);
    }
  });

  it("refuses to restore saves of newer game versions", async () => {
    const save = await storeGame(createAreaWorld(area));
    fake.write("alive", "saves", { ...save, version: "99.0.0" });

    await expect(restoreGame(save.id)).rejects.toThrow("newer version");
  });

  it("fails to restore a missing save", async () => {
    await expect(restoreGame("missing")).rejects.toThrow(
      "Save missing not found!"
    );
  });

  it("erases the summary and the save", async () => {
    const kept = await storeGame(createAreaWorld(area));
    const erased = await storeGame(createAreaWorld(area));

    await eraseGame(erased.id);
    await loadSaveSummaries();

    expect(getSaveSummaries()).toEqual([getSummary(kept)]);
    expect(readSaves()).toEqual([kept]);
    await expect(restoreGame(erased.id)).rejects.toThrow("not found");
  });
});
