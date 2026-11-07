import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  createTestWorld,
  findInArea,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { POPUP } from "../components/popup";
import { POSITION } from "../components/position";
import { PLAYER } from "../components/player";
import { MOVABLE } from "../components/movable";
import { getTab, getTabSelections, getVerticalIndex, isInPopup } from "./popup";
import { getSequence } from "./sequence";
import { assertIdentifier } from "../utils";
import { STATS } from "../components/stats";
import { INVENTORY } from "../components/inventory";
import { AFFECTABLE } from "../components/affectable";
import { LIQUID } from "../components/liquid";
import { TOOLTIP } from "../components/tooltip";
import { createBubble } from "./water";
import { populateItems } from "../../bindings/creation";
import { World } from "../ecs";
import { TypedEntity } from "../entities";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import {
  getSaveSummaries,
  saveVersion,
  SaveSummary,
  setSaveSummaries,
} from "../../game/saves";
import { LIGHT } from "../components/light";
import { createSnapshot, restoreSnapshot } from "../snapshot";
import { createSystems, preloadLevel } from "../ecs";

// ♀ hero, Π continue portal of the main menu
const area = `
|         |
| ♀     Π |
|         |
`;

const portal = findInArea(area, "Π");

// ~ shallow water
const water = `
|       |
| ♀  ~  |
|       |
`;

const createSummary = (summary: Partial<SaveSummary>): SaveSummary => ({
  id: summary.name || "",
  name: "",
  version: saveVersion,
  level: "LEVEL_TUTORIAL",
  classKey: "rogue",
  hairColor: "",
  heroLevel: 1,
  items: [],
  playtime: 0,
  kills: 0,
  deaths: 0,
  ...summary,
});

const openSaves = () => {
  const world = createAreaWorld(area);
  const hero = assertHero(world);
  walk(world, "right", 5);
  step(world, 15);

  trigger(world, "interact");
  advanceUntil(world, () => !!isInPopup(world, hero), 1000);
  step(world, 30);

  const popup = world.getEntityById(hero[PLAYER].popup) as TypedEntity<
    "POPUP" | "POSITION"
  >;

  return { world, hero, popup };
};

const confirm = (world: World, outcome: () => boolean) => {
  resetPlayedSounds();
  trigger(world, "right");
  advanceUntil(world, outcome, 1000);
};

describe("continue portal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    setSaveSummaries([]);
  });

  it("lists saves to choose from", () => {
    setSaveSummaries([
      createSummary({ name: "20261011-151323" }),
      createSummary({ name: "20261106-090000" }),
    ]);
    const { world, popup } = openSaves();

    expect(popup[POSITION]).toEqual(portal);
    expect(getTab(world, popup)).toBe("load");

    trigger(world, "down");
    advanceUntil(world, () => getVerticalIndex(world, popup) === 1, 1000);
    trigger(world, "down");
    step(world, 15);
    expect(getVerticalIndex(world, popup)).toBe(1);
  });

  it("keeps the portal closed without saves", () => {
    const world = createAreaWorld(area);
    const continuePortal = assertIdentifier(world, "continue_portal");

    expect(continuePortal[POPUP]).toBeUndefined();
    expect(continuePortal[TOOLTIP]?.override).toBe("hidden");
    expect(getSequence(world, continuePortal, "vortex")).toBeUndefined();
    expect(getSequence(world, continuePortal, "discovery")).toBeUndefined();
  });

  it("opens the menu's continue portal while there are saves", () => {
    const world = createTestWorld();
    advance(world, 1000);
    const continuePortal = assertIdentifier(world, "continue_portal");
    expect(continuePortal[POPUP]).toBeUndefined();

    setSaveSummaries([createSummary({ name: "20261011-151323" })]);
    advance(world, 1000);
    expect(continuePortal[POPUP]?.tabs).toEqual(["load"]);
    expect(continuePortal[TOOLTIP]?.override).toBeUndefined();
    expect(getSequence(world, continuePortal, "vortex")).toBeDefined();

    setSaveSummaries([]);
    advance(world, 1000);
    expect(continuePortal[POPUP]).toBeUndefined();
    expect(getSequence(world, continuePortal, "vortex")).toBeUndefined();
  });

  it("asks before erasing a save and can go back", () => {
    setSaveSummaries([
      createSummary({ name: "20261011-151323" }),
      createSummary({ name: "20261106-090000" }),
    ]);
    const { world, popup } = openSaves();
    const eraseGame = jest.fn();
    world.metadata.eraseGame = eraseGame;

    trigger(world, "down");
    advanceUntil(world, () => getVerticalIndex(world, popup) === 1, 1000);
    trigger(world, "left");
    advanceUntil(
      world,
      () => getTabSelections(world, popup).length === 1,
      1000
    );
    expect(getTabSelections(world, popup)).toEqual([1]);

    trigger(world, "left");
    advanceUntil(
      world,
      () => getTabSelections(world, popup).length === 0,
      1000
    );
    expect(getVerticalIndex(world, popup)).toBe(1);
    expect(eraseGame).not.toHaveBeenCalled();
    expect(getSaveSummaries()).toHaveLength(2);
  });

  it("erases the selected save after confirming", () => {
    setSaveSummaries([
      createSummary({ name: "20261011-151323" }),
      createSummary({ name: "20261106-090000" }),
    ]);
    const { world, hero, popup } = openSaves();
    const eraseGame = jest.fn();
    world.metadata.eraseGame = eraseGame;

    trigger(world, "left");
    advanceUntil(
      world,
      () => getTabSelections(world, popup).length === 1,
      1000
    );
    confirm(world, () => getSaveSummaries().length === 1);

    expect(eraseGame).toHaveBeenCalledWith("20261106-090000");
    expect(getSaveSummaries().map((save) => save.name)).toEqual([
      "20261011-151323",
    ]);
    expect(getTabSelections(world, popup)).toEqual([]);
    expect(hero[MOVABLE]).toBeDefined();
  });

  it("denies loading saves of newer game versions", () => {
    setSaveSummaries([createSummary({ name: "newer", version: "99.0.0" })]);
    const { world, hero } = openSaves();

    confirm(world, () => playedSounds.includes("deny"));

    expect(hero[MOVABLE]).toBeDefined();
  });

  it("steps into the portal and loads the selected save, latest first", () => {
    setSaveSummaries([
      createSummary({ name: "20261011-151323" }),
      createSummary({ name: "20261106-090000" }),
    ]);
    const { world, hero, popup } = openSaves();
    const loadGame = jest.fn();
    world.metadata.suspend = jest.fn();
    world.metadata.loadGame = loadGame;

    trigger(world, "down");
    advanceUntil(world, () => getVerticalIndex(world, popup) === 1, 1000);
    confirm(world, () => !hero[MOVABLE]);

    expect(hero[POSITION]).toEqual(portal);

    jest.advanceTimersByTime(3500);

    expect(world.metadata.suspend).toHaveBeenCalled();
    expect(loadGame).toHaveBeenCalledWith("20261011-151323");
    expect(popup[POPUP].tabs).toEqual(["load"]);
  });

  it("loads a hero with all stats without replaying received stats", () => {
    const saved = createAreaWorld(area);
    const savedHero = saved.assertComponents(assertHero(saved), [
      STATS,
      PLAYER,
    ]);
    savedHero[STATS] = {
      ...savedHero[STATS],
      maxHp: 30,
      hp: 25,
      maxMp: 10,
      mp: 5,
    };
    // damage over time received before saving
    saved.assertComponents(savedHero, [AFFECTABLE])[AFFECTABLE].dot = 10;
    savedHero[PLAYER].receivedStats = {
      ...savedHero[PLAYER].receivedStats,
      hp: 20,
      maxHp: 20,
      mp: 5,
    };

    const world = restoreSnapshot(createSnapshot(saved));
    world.metadata.resume = jest.fn();
    resetPlayedSounds();
    createSystems(world);
    preloadLevel(world);
    jest.advanceTimersByTime(2000);
    advance(world, 3000);

    const hero = world.assertComponents(assertHero(world), [STATS]);
    expect(hero[STATS]).toMatchObject({ maxHp: 30, hp: 25, mp: 5 });
    expect(playedSounds).not.toContain("pickup");
    expect(playedSounds).not.toContain("magic");
  });

  it("keeps stats of equipment when loading", () => {
    const saved = createAreaWorld(area);
    const savedHero = saved.assertComponents(assertHero(saved), [
      STATS,
      INVENTORY,
      POSITION,
    ]);
    const baseMaxHp = savedHero[STATS].maxHp;
    populateItems(saved, savedHero, [
      { accessory: "amulet", material: "iron", amount: 1, bound: true },
    ]);
    advance(saved, 1000);
    const { maxHp } = savedHero[STATS];

    const world = restoreSnapshot(createSnapshot(saved));
    world.metadata.resume = jest.fn();
    createSystems(world);
    preloadLevel(world);
    jest.advanceTimersByTime(2000);
    advance(world, 1000);

    expect(maxHp).toBeGreaterThan(baseMaxHp);
    expect(
      world.assertComponents(assertHero(world), [STATS])[STATS].maxHp
    ).toBe(maxHp);
  });

  it("bursts bubbles of a loaded world", () => {
    const saved = createAreaWorld(water);
    createBubble(saved, findInArea(water, "~"), "water");
    advance(saved, 2000);
    createBubble(saved, findInArea(water, "~"), "water");
    step(saved);
    expect(saved.getEntities([LIQUID])).toHaveLength(1);

    const world = restoreSnapshot(createSnapshot(saved));
    createSystems(world);
    preloadLevel(world);
    advance(world, 2000);

    expect(world.getEntities([LIQUID])).toHaveLength(0);
  });

  it("restores vision and movement exactly as saved", () => {
    const saved = createAreaWorld(area);
    advance(saved, 3000);
    const savedHero = saved.assertComponents(assertHero(saved), [LIGHT]);

    // light set by a level instead of hero's vision, e.g. in dungeon rooms
    savedHero[LIGHT] = { ...savedHero[LIGHT], visibility: 23, brightness: 23 };
    advance(saved, 1000);
    expect(savedHero[LIGHT].visibility).toBe(23);

    const world = restoreSnapshot(createSnapshot(saved));
    createSystems(world);
    preloadLevel(world);
    const hero = world.assertComponents(assertHero(world), [LIGHT]);

    expect(hero[LIGHT]).toEqual(savedHero[LIGHT]);
    expect(hero[MOVABLE]).toBeDefined();

    advance(world, 1000);
    expect(getSequence(world, hero, "vision")).toBeUndefined();
    expect(hero[LIGHT]).toEqual(savedHero[LIGHT]);
  });
});
