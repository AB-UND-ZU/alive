import { createPresetWorld } from "../../wiki/presets";
import { saveAndLoad } from "../../testing/saves";
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
  try {
    const world = createTestWorld();
    advance(world, 1000);
    const hero = assertHero(world);
    const portal = world
      .getEntities([WARPABLE, POPUP])
      .find((e) => e[POPUP].tabs.includes("warp"))!;
    portal[POPUP].horizontalIndex = portal[POPUP].tabs.indexOf("warp");
    portal[POPUP].verticalIndezes[portal[POPUP].horizontalIndex] =
      levelConfig.LEVEL_ISLAND.mapOffsetY;
    initiateWarp(world, portal, hero);
    jest.advanceTimersByTime(3500);
    advance(world, 1000);
    jest.advanceTimersByTime(2000);
    advance(world, 3000);
    const position = { ...assertHero(world)[POSITION] };
    const loaded = saveAndLoad(world);
    expect(loaded.metadata.gameEntity[LEVEL].name).toBe("LEVEL_ISLAND");
    expect(assertHero(loaded)[POSITION]).toEqual(position);
    step(loaded, 60);
  } finally {
    jest.useRealTimers();
  }
}, 120000);
