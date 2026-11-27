import { resolveSprite } from "../../game/assets/spriteIds";
import { receiveGeneratedWorld } from "../../testing/saves";
import { createSnapshot, restoreSnapshot } from "../snapshot";
import { createSystems, preloadLevel } from "../ecs";
import { MOVABLE } from "../components/movable";
import { advance, assertHero, createTestWorld } from "../../testing/harness";
import { LEVEL } from "../components/level";
import { POPUP } from "../components/popup";
import { SPRITE } from "../components/sprite";
import { SWIMMABLE } from "../components/swimmable";
import { WARPABLE } from "../components/warpable";
import { levelConfig } from "../../game/levels";
import { initiateWarp } from "./trigger";
import { SPAWNABLE } from "../components/spawnable";
import { getSequence } from "./sequence";
import { getClassData } from "../../game/balancing/classes";

describe("warping", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("enters a new world on land without swimming", () => {
    const warnings = jest.spyOn(console, "warn").mockImplementation(() => {});
    let world = createTestWorld();
    advance(world, 3000);
    let hero = world.assertComponents(assertHero(world), [
      SWIMMABLE,
      SPRITE,
      SPAWNABLE,
    ]);
    const portal = world
      .getEntities([WARPABLE, POPUP])
      .find((entity) => entity[POPUP].tabs.includes("warp"))!;
    portal[POPUP].horizontalIndex = portal[POPUP].tabs.indexOf("warp");
    portal[POPUP].verticalIndezes[portal[POPUP].horizontalIndex] =
      levelConfig.LEVEL_TUTORIAL.mapOffsetY;

    initiateWarp(world, portal, hero);
    advance(world, 300);
    expect(hero[MOVABLE]).toBeUndefined();
    world = restoreSnapshot(createSnapshot(world));
    createSystems(world);
    preloadLevel(world);
    const arrival = receiveGeneratedWorld(world);
    expect(world.getEntity(["PLAYER"])![MOVABLE]).toBeUndefined();
    advance(world, 3100);
    world = arrival();
    hero = world.assertComponents(assertHero(world), [
      SWIMMABLE,
      SPRITE,
      SPAWNABLE,
    ]);
    expect(hero[MOVABLE]).toBeDefined();

    expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_TUTORIAL");
    const { sprite, swimming } = getClassData(
      hero[SPAWNABLE].classKey,
      hero[SPAWNABLE].hairColor
    );
    expect(hero[SWIMMABLE].swimming).toBe(false);
    expect(resolveSprite(hero[SPRITE])).toEqual(sprite);
    expect(hero[SWIMMABLE].sprite).toEqual(swimming);

    advance(world, 1000);
    expect(hero[SWIMMABLE].swimming).toBe(false);
    expect(resolveSprite(hero[SPRITE])).toEqual(sprite);
    expect(getSequence(world, hero, "quest")?.name).not.toBe("menuQuest");
    expect(warnings.mock.calls).toEqual([]);
  });
});
