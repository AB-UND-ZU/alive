import {
  assertHero,
  createAreaWorld,
  giveItems,
  holdMove,
  step,
} from "../../testing/harness";
import {
  hasUnlock,
  loadUnlocks,
  setUnlocks,
} from "../unlocks";
import { createCell, createNpc } from "../../bindings/creation";
import { createPopup } from "../../engine/systems/popup";
import { POPUP } from "../../engine/components/popup";
import { craftingIngredients } from "../balancing/crafting";
import { getTraderDeals } from "../balancing/trading";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { createSystems, preloadLevel } from "../../engine/ecs";
import { createSnapshot } from "../../engine/snapshot";
import { saveUpgrades } from "./upgrades";
import { installFakeIndexedDB } from "./testing";
import {
  createSave,
  getSaveSummaries,
  getSummary,
  SaveGame,
  saveVersion,
  setSaveSummaries,
} from ".";
import {
  eraseGame,
  loadSaveSummaries,
  restoreGame,
  storeGame,
} from "./storage";

jest.mock("../../../package.json", () => ({ version: "0.9.0" }));

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
  fake.closeConnections("alive");
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

  it("offers current recipes and trader stock on a previously saved island", async () => {
    const world = createAreaWorld(area, { level: "LEVEL_ISLAND" });
    const bench = createCell(world, { x: 2, y: 2 }, "bench", "visible").cell;
    const trader = createNpc(world, "earthTrader", { x: 3, y: 2 });
    const benchId = world.getEntityId(bench);
    const traderId = world.getEntityId(trader);
    bench[POPUP]!.ingredients = craftingIngredients.filter(
      ({ item }) => item.stackable !== "gem"
    );
    createPopup(world, trader, {
      tabs: ["buy", "sell"],
      deals: getTraderDeals().filter(
        ({ item }) => item.stackable !== "ingot" && item.material !== "diamond"
      ),
    });

    const saved = await storeGame(world);
    await loadSaveSummaries();
    const loaded = await restoreGame(saved.id);
    expect(loaded.assertByIdAndComponents(benchId, [POPUP])[POPUP].ingredients)
      .toEqual(craftingIngredients);
    expect(loaded.assertByIdAndComponents(traderId, [POPUP])[POPUP].deals)
      .toEqual(getTraderDeals());
  });

  it("keeps earned classes when their save is erased", async () => {
    loadUnlocks();
    const world = createAreaWorld(area);
    const hero = world.assertComponents(assertHero(world), [
      PLAYER, "INVENTORY", POSITION,
    ]);
    giveItems(world, hero, [
      { stackable: "resource", material: "diamond", amount: 5 },
    ]);
    hero[PLAYER].defeatedUnits.woodChest = 1;
    await storeGame(world);
    expect(hasUnlock("???")).toBe(false);
    expect(hasUnlock("knight")).toBe(false);
    expect(hasUnlock("mage")).toBe(false);

    hero[PLAYER].defeatedUnits.chestBoss = 1;
    hero[PLAYER].defeatedUnits.fireNomad = 2;
    giveItems(world, hero, [{ stackable: "gem", amount: 1 }]);
    const save = await storeGame(world);
    await eraseGame(save.id);
    loadUnlocks();
    expect(hasUnlock("???")).toBe(true);
    expect(hasUnlock("knight")).toBe(true);
    expect(hasUnlock("mage")).toBe(true);
  });

  it.each([
    ["LEVEL_ISLAND", 0, true],
    ["LEVEL_TUTORIAL", 1, true],
    ["LEVEL_TUTORIAL", 0, false],
  ] as const)("recovers Island access at the menu from %s with %i boss defeats", async (level, defeats, earned) => {
    const world = createAreaWorld(area, { level });
    assertHero(world)[PLAYER]!.defeatedUnits.tutorialBoss = defeats;
    const legacy = createSave(world);
    // Seed the pre-unlock save directly so no live hero can grant the unlock.
    await loadSaveSummaries("readonly");
    fake.write("alive", "saves", legacy);
    fake.write("alive", "summaries", getSummary(legacy));

    await loadSaveSummaries("readonly");
    loadUnlocks();
    expect(hasUnlock("LEVEL_ISLAND")).toBe(false);

    await loadSaveSummaries();
    loadUnlocks();
    expect(hasUnlock("LEVEL_ISLAND")).toBe(earned);
    expect(readSaves()).toEqual([legacy]);
  });

  it("offers earned classes when the menu lists older saves from different characters", async () => {
    await loadSaveSummaries("readonly");
    const dungeon = createAreaWorld(area);
    assertHero(dungeon)[PLAYER]!.defeatedUnits.chestBoss = 1;
    const island = createAreaWorld(area, { level: "LEVEL_ISLAND" });
    const hero = island.assertComponents(assertHero(island), [PLAYER, "INVENTORY", POSITION]);
    hero[PLAYER].defeatedUnits.fireNomad = 1;
    giveItems(island, hero, [{ stackable: "gem", amount: 1 }]);

    for (const world of [dungeon, island]) {
      const legacy = createSave(world);
      fake.write("alive", "saves", legacy);
      fake.write("alive", "summaries", getSummary(legacy));
    }

    localStorage.clear();
    await loadSaveSummaries("readonly");
    loadUnlocks();
    expect(["knight", "mage", "???"].map((key) => localStorage.getItem("alive.class." + key)))
      .toEqual([null, null, null]);
    await loadSaveSummaries();
    loadUnlocks();
    expect((["knight", "mage", "???"] as const).every(hasUnlock)).toBe(true);
  });

  it("ignores Gems in another inventory", async () => {
    const world = createAreaWorld(area);
    const npc = world.assertComponents(createNpc(world, "earthTrader", { x: 2, y: 2 }), ["INVENTORY", POSITION]);
    giveItems(world, npc, [{ stackable: "gem", amount: 1 }]);
    assertHero(world)[PLAYER]!.defeatedUnits.fireNomad = 1;
    await storeGame(world);
    setUnlocks(false);
    await loadSaveSummaries();
    expect(hasUnlock("mage")).toBe(false);
    expect(hasUnlock("knight")).toBe(true);
  });

  it("recovers unlocks once, even when the save already has the released version", async () => {
    const world = createAreaWorld(area);
    assertHero(world)[PLAYER]!.defeatedUnits.tutorialBoss = 1;
    await storeGame(world);
    setUnlocks(false);
    await loadSaveSummaries();
    expect(hasUnlock("LEVEL_ISLAND")).toBe(true);

    setUnlocks(false);
    await loadSaveSummaries();
    expect(hasUnlock("LEVEL_ISLAND")).toBe(false);
    expect(localStorage.getItem("alive.lastGameVersion")).toBe(saveVersion);
  });

  it("runs only releases newer than the last completed upgrade, in order", async () => {
    await storeGame(createAreaWorld(area));
    localStorage.setItem("alive.lastGameVersion", "0.6.0");
    const steps: string[] = [];
    const upgrades = ["0.7.2", "0.6.0", "0.7.1", "99.0.0"].map((version) => ({
      version,
      upgrade: (save: SaveGame) => { steps.push(version); return save; },
    }));
    saveUpgrades.push(...upgrades);
    const hint = jest.fn();
    try {
      await loadSaveSummaries("readwrite", hint);
      await loadSaveSummaries("readwrite", hint);
      expect(steps).toEqual(["0.7.1", "0.7.2"]);
      expect(hint.mock.calls.flat()).toEqual(["0.7.1", "0.7.2", "0.9.0"]);
    } finally {
      saveUpgrades.splice(saveUpgrades.indexOf(upgrades[0]), upgrades.length);
    }
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

  it.each(["readonly", "readwrite"] as const)(
    "lists an older save in a %s transaction",
    async (mode) => {
      const saved = await storeGame(createAreaWorld(area));
      const older = { ...saved, version: "0.4.0" };
      fake.write("alive", "saves", older);
      fake.write("alive", "summaries", getSummary(older));
      setSaveSummaries([]);

      await loadSaveSummaries(mode);

      const upgraded = { ...older, version: saveVersion };
      const stored = mode === "readwrite" ? upgraded : older;
      expect(getSaveSummaries()).toEqual([getSummary(stored)]);
      expect(readSaves()).toEqual([stored]);
      expect(fake.read("alive", "summaries")).toEqual([getSummary(stored)]);
    }
  );

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
      expect(localStorage.getItem("alive.lastGameVersion")).toBeNull();

      expect(readSaves()).toEqual([older]);
      expect(fake.read("alive", "summaries")).toEqual([getSummary(older)]);
      expect(getSaveSummaries()).toEqual([getSummary(saved)]);
    } finally {
      saveUpgrades.splice(saveUpgrades.indexOf(upgrade), 1);
    }
    await loadSaveSummaries();
    expect(localStorage.getItem("alive.lastGameVersion")).toBe(saveVersion);
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

  it.each([true, false])(
    "saves after the browser closes its connection (close event: %s)",
    async (notify) => {
      const world = createAreaWorld(area);
      const first = await storeGame(world);
      step(world, 30);
      fake.closeConnections("alive", notify);

      const second = await storeGame(world);

      expect(second.id).toBe(first.id);
      expect(second.playtime).toBeGreaterThan(first.playtime);
      expect(readSaves()).toEqual([second]);
      expect(getSaveSummaries()).toEqual([getSummary(second)]);
      expect(createSnapshot(await restoreGame(second.id))).toEqual(
        second.snapshot
      );
    }
  );

  it("lists, restores and erases saves after separate connection closures", async () => {
    const saved = await storeGame(createAreaWorld(area));
    setSaveSummaries([]);
    fake.closeConnections("alive", false);
    await loadSaveSummaries();
    expect(getSaveSummaries()).toEqual([getSummary(saved)]);

    fake.closeConnections("alive", false);
    expect(createSnapshot(await restoreGame(saved.id))).toEqual(saved.snapshot);

    fake.closeConnections("alive", false);
    await eraseGame(saved.id);
    expect(readSaves()).toEqual([]);
    expect(fake.read("alive", "summaries")).toEqual([]);
  });

  it("shares a reopened connection when multiple saves encounter a closed handle", async () => {
    await loadSaveSummaries();
    fake.closeConnections("alive", false);
    const open = jest.spyOn(fake.indexedDB, "open");
    try {
      const saves = await Promise.all([
        storeGame(createAreaWorld(area)),
        storeGame(createAreaWorld(area)),
      ]);

      expect(open).toHaveBeenCalledTimes(1);
      expect(readSaves()).toEqual(saves);
      expect(getSaveSummaries()).toHaveLength(2);
    } finally {
      open.mockRestore();
    }
  });

  it("closes a connection on version changes so another tab can upgrade", async () => {
    const open = jest.spyOn(fake.indexedDB, "open");
    try {
      const saved = await storeGame(createAreaWorld(area));
      const connection = (open.mock.results[0].value as IDBOpenDBRequest)
        .result;
      const close = jest.spyOn(connection, "close");

      connection.onversionchange?.(
        new Event("versionchange") as IDBVersionChangeEvent
      );

      expect(close).toHaveBeenCalledTimes(1);
      expect(createSnapshot(await restoreGame(saved.id))).toEqual(
        saved.snapshot
      );
      expect(open).toHaveBeenCalledTimes(2);
    } finally {
      jest.restoreAllMocks();
    }
  });

  it("can retry saving after opening the database fails", async () => {
    const world = createAreaWorld(area);
    const saved = await storeGame(world);
    fake.closeConnections("alive");
    const failure = new DOMException("Storage unavailable", "UnknownError");
    fake.failNextOpen(failure);

    await expect(storeGame(world)).rejects.toBe(failure);
    expect(readSaves()).toEqual([saved]);
    expect(getSaveSummaries()).toEqual([getSummary(saved)]);

    step(world, 30);
    const updated = await storeGame(world);
    expect(updated.id).toBe(saved.id);
    expect(readSaves()).toEqual([updated]);
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

  it("loads the changes committed by the startup upgrade", async () => {
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
      await loadSaveSummaries();
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
