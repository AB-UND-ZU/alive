import * as town from "../../engine/wfc/town";
import * as igloos from "../../game/levels/island/igloos";
import * as haven from "../../engine/wfc/haven";
import { createPresetWorld } from "../../wiki/presets";
import { receiveGeneratedWorld, saveAndLoad } from "../../testing/saves";
import {
  assertHero,
  step,
  createTestWorld,
  advance,
} from "../../testing/harness";
import { POPUP } from "../../engine/components/popup";
import { WARPABLE } from "../../engine/components/warpable";
import { initiateWarp } from "../../engine/systems/trigger";
import { levelConfig } from "../../game/levels";
import { LEVEL } from "../../engine/components/level";
import { getSequence } from "../../engine/systems/sequence";
import { POSITION } from "../../engine/components/position";

test("restores a generated island and continues playing at the saved position", () => {
  const world = createPresetWorld("island");
  step(world, 60);
  const position = { ...assertHero(world)[POSITION] };
  const loaded = saveAndLoad(world);
  expect(loaded.metadata.gameEntity[LEVEL].name).toBe("LEVEL_ISLAND");
  expect(assertHero(loaded)[POSITION]).toEqual(position);
  step(loaded, 60);
  expect(loaded.metadata.gameEntity[LEVEL].name).toBe("LEVEL_ISLAND");
}, 120000);

test("restores an island reached through the menu portal", () => {
  jest.useFakeTimers();
  const warnings = jest.spyOn(console, "warn").mockImplementation(() => {});
  try {
    let world = createTestWorld();
    const rows: string[] = [];
    const townLabels = new Set<string>();
    const havenLabels = new Set<string>();
    const glacierLabels = new Set<string>();
    const generateVillage = igloos.generateIglooVillage;
    jest.spyOn(igloos, "generateIglooVillage").mockImplementation((...args) => {
      glacierLabels.add(rows[rows.length - 1]);
      return generateVillage(...args);
    });
    const generateTown = town.default;
    const generateHaven = haven.default;
    jest.spyOn(town, "default").mockImplementation((...args) => {
      townLabels.add(rows[rows.length - 1]);
      return generateTown(...args);
    });
    jest.spyOn(haven, "default").mockImplementation((...args) => {
      havenLabels.add(rows[rows.length - 1]);
      return generateHaven(...args);
    });
    const arrival = receiveGeneratedWorld(world, (line) => {
      rows.push(
        line
          .slice(1, -1)
          .map((cell) => cell.layers.slice(-1)[0].char)
          .join("")
      );
    });
    advance(world, 3000);
    const hero = assertHero(world);
    const portal = world
      .getEntities([WARPABLE, POPUP])
      .find((e) => e[POPUP].tabs.includes("warp"))!;
    portal[POPUP].horizontalIndex = portal[POPUP].tabs.indexOf("warp");
    portal[POPUP].verticalIndezes[portal[POPUP].horizontalIndex] =
      levelConfig.LEVEL_ISLAND.mapOffsetY;
    initiateWarp(world, portal, hero);
    advance(world, 3000);
    advance(world, 100);
    world = arrival();
    const start = rows.lastIndexOf("Loading terrain 0%...");
    expect(start).toBeGreaterThanOrEqual(0);
    const passes = rows.slice(start);
    for (const pass of ["terrain", "biomes", "water", "units"]) {
      expect(passes).toContain(`Loading ${pass} 0%...`);
      expect(passes).toContain(`Loading ${pass} 100%...`);
    }
    expect([...townLabels]).toEqual(["Loading jungle..."]);
    expect([...havenLabels]).toEqual(["Loading desert..."]);
    expect([...glacierLabels]).toEqual(["Loading glacier..."]);
    expect(passes.slice(-5)).toEqual([
      "Loading units 100%...",
      "Loading jungle...",
      "Loading desert...",
      "Loading glacier...",
      "Loading map...",
    ]);
    advance(world, 1000);
    jest.advanceTimersByTime(2000);
    advance(world, 3000);
    expect(getSequence(world, assertHero(world), "quest")?.name).toBe(
      "spawnQuest"
    );
    expect(warnings.mock.calls).toEqual([]);
    const position = { ...assertHero(world)[POSITION] };
    const loaded = saveAndLoad(world);
    expect(loaded.metadata.gameEntity[LEVEL].name).toBe("LEVEL_ISLAND");
    expect(assertHero(loaded)[POSITION]).toEqual(position);
    step(loaded, 60);
    expect(warnings.mock.calls).toEqual([]);
  } finally {
    jest.restoreAllMocks();
    jest.useRealTimers();
  }
}, 120000);
