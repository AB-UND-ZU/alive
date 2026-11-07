import { advance, assertHero, createTestWorld } from "../../testing/harness";
import { LEVEL } from "../components/level";
import { POPUP } from "../components/popup";
import { SPRITE } from "../components/sprite";
import { SWIMMABLE } from "../components/swimmable";
import { WARPABLE } from "../components/warpable";
import { levelConfig } from "../../game/levels";
import { initiateWarp } from "./trigger";
import { SPAWNABLE } from "../components/spawnable";
import { getClassData } from "../../game/balancing/classes";

describe("warping", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("enters a new world on land without swimming", () => {
    const world = createTestWorld();
    advance(world, 1000);
    const hero = world.assertComponents(assertHero(world), [
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
    jest.advanceTimersByTime(3500);

    expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_TUTORIAL");
    const { sprite, swimming } = getClassData(
      hero[SPAWNABLE].classKey,
      hero[SPAWNABLE].hairColor
    );
    expect(hero[SWIMMABLE].swimming).toBe(false);
    expect(hero[SPRITE]).toEqual(sprite);
    expect(hero[SWIMMABLE].sprite).toEqual(swimming);

    advance(world, 1000);
    expect(hero[SWIMMABLE].swimming).toBe(false);
    expect(hero[SPRITE]).toEqual(sprite);
  });
});
