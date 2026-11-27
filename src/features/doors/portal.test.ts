import { receiveGeneratedWorld } from "../../testing/saves";
import {
  advance,
  assertHero,
  findEntityAt,
  findInArea,
  getItems,
  giveItems,
  step,
  trigger,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import {
  assertIdentifierAndComponents,
  setGenerationTestMode,
  TEST_MODE,
} from "../../engine/utils";
import { collectItem } from "../../engine/systems/collect";
import { moveEntity } from "../../engine/systems/map";
import { getMotion, sampleMotion } from "../../engine/motion";
import { ACTIONABLE } from "../../engine/components/actionable";
import { setUnlocks } from "../../game/unlocks";
import { LEVEL } from "../../engine/components/level";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { POSITION } from "../../engine/components/position";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { STATS } from "../../engine/components/stats";
import { WARPABLE } from "../../engine/components/warpable";
import { getTab } from "../../engine/systems/popup";
import { canWarp } from "../../engine/systems/trigger";
import { getSelectedLevel, levelConfig } from "../../game/levels";
import { finishCollecting, placeDrop } from "../items/helpers";
import { getMessages, getPrompt, interact, setup } from "./helpers";

// ♀ hero, ∩ portal
const area = `
|        |
|   ♀∩   |
|        |
`;

const getPortal = (world: World) =>
  findEntityAt(world, findInArea(area, "∩"), [WARPABLE, POPUP, POSITION])!;

const press = (world: World, action: "right" | "down", times = 1) => {
  for (let time = 0; time < times; time += 1) {
    trigger(world, action);
    step(world, 10);
  }
};

const selectLevel = (
  world: World,
  portal: ReturnType<typeof getPortal>,
  level: keyof typeof levelConfig
) => {
  for (let index = 0; getSelectedLevel(world, portal) !== level; index += 1) {
    if (index > 20) throw new Error(`Level ${level} not selectable`);
    press(world, "down");
  }
};

describe("portals", () => {
  it("offers to warp from an adjacent portal", () => {
    const { world, hero } = setup(area);
    const portal = getPortal(world);

    expect(hero[ACTIONABLE].popup).toBe(world.getEntityId(portal));
    expect(getPrompt(world, portal)).toBe("WARP");

    interact(world, 30);

    expect(hero[PLAYER].popup).toBe(world.getEntityId(portal));
    expect(getTab(world, portal)).toBe("warp");
    expect(hero[ACTIONABLE].warp).toBe(world.getEntityId(portal));
  });

  it("refuses to warp to the current level", () => {
    const { world, hero } = setup(area);
    const portal = getPortal(world);
    interact(world, 30);

    expect(getSelectedLevel(world, portal)).toBe("LEVEL_TUTORIAL");
    press(world, "right");

    expect(playedSounds).toContain("deny");
    expect(getMessages(world, hero)).toEqual(["Already here!"]);
    expect(hero[PLAYER].popup).toBe(world.getEntityId(portal));
  });

  it("refuses to warp to a level that is not unlocked", () => {
    const { world, hero } = setup(area, { level: "LEVEL_MENU" });
    const portal = getPortal(world);
    interact(world, 30);
    press(world, "right", 2);
    expect(getTab(world, portal)).toBe("warp");

    selectLevel(world, portal, "LEVEL_ISLAND");
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not unlocked!"]);
    expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_MENU");
  });

  it("initially offers only the Dungeon from the Menu", () => {
    const { world, hero } = setup(area, { level: "LEVEL_MENU" });
    const portal = getPortal(world);
    interact(world, 30);
    press(world, "right", 2);

    selectLevel(world, portal, "LEVEL_TUTORIAL");
    expect(canWarp(world, hero, portal)).toBe(true);

    selectLevel(world, portal, "LEVEL_ISLAND");
    expect(canWarp(world, hero, portal)).toBe(false);
  });

  it("offers the Island to a fresh character after it has been unlocked", () => {
    setUnlocks(true);
    try {
      const { world, hero } = setup(area, { level: "LEVEL_MENU" });
      const portal = getPortal(world);
      interact(world, 30);
      press(world, "right", 2);
      selectLevel(world, portal, "LEVEL_ISLAND");
      expect(hero[PLAYER].defeatedUnits).toEqual({});
      expect(canWarp(world, hero, portal)).toBe(true);
      press(world, "right");
      expect(hero[PLAYER].popup).toBeUndefined();
      expect(hero[POSITION]).toEqual(portal[POSITION]);
    } finally {
      setUnlocks(false);
    }
  });

  it("adds test menu pickups once to the selected class when entering a level", () => {
    jest.useFakeTimers();
    const previousMode = TEST_MODE;
    setGenerationTestMode(true);
    try {
      const { world, hero } = setup(area, { level: "LEVEL_MENU" });
      const arrival = receiveGeneratedWorld(world);
      const pickups = ["power", "wisdom", "level", "maxHp", "maxMp", "mp"] as const;
      for (const stat of pickups) {
        const drop = placeDrop(world, hero[POSITION], [{ stat, amount: 1 }]);
        expect(collectItem(world, hero, drop)).toBe(true);
        finishCollecting(world, hero);
      }

      const portal = getPortal(world);
      interact(world, 30);
      press(world, "right", 2);
      selectLevel(world, portal, "LEVEL_TUTORIAL");
      press(world, "right");
      advance(world, 3100);

      const generated = arrival();
      const player = generated.assertComponents(assertHero(generated), [
        STATS,
        SPAWNABLE,
      ]);
      expect(player[SPAWNABLE].classKey).toBe("rogue");
      expect(player[STATS]).toMatchObject({
        level: 2,
        power: 2,
        wisdom: 1,
        haste: 1,
        maxHp: 27,
        maxMp: 11,
        mp: 1,
        maxXp: 15,
      });
    } finally {
      setGenerationTestMode(previousMode);
      jest.useRealTimers();
    }
  });

  it.each(["rogue", "knight"] as const)("warps the chosen %s and their items into the next level", (key) => {
    jest.useFakeTimers();
    try {
      const { world, hero } = setup(area, { level: "LEVEL_MENU" });
      const arrival = receiveGeneratedWorld(world);
      const departingFocus = assertIdentifierAndComponents(world, "focus", [POSITION]);
      moveEntity(world, departingFocus, { x: 1, y: 2 });
      const portal = getPortal(world);
      giveItems(world, hero, [{ consume: "key", material: "iron", amount: 1 }]);
      if (key === "knight") hero[PLAYER].defeatedUnits.fireNomad = 1;
      interact(world, 30);
      expect(portal[POPUP].tabs).toEqual(["class", "style", "warp"]);

      if (key === "knight") press(world, "down");
      press(world, "right", 2);
      selectLevel(world, portal, "LEVEL_TUTORIAL");
      press(world, "right");

      expect(playedSounds).toContain("confirm");
      expect(hero[PLAYER].popup).toBeUndefined();
      expect(hero[POSITION]).toEqual(portal[POSITION]);
      expect(hero).not.toHaveProperty(MOVABLE);

      advance(world, 3100);
      const generated = arrival();
      const player = generated.assertComponents(assertHero(generated), [
        "INVENTORY",
        POSITION,
        SPAWNABLE,
      ]);
      expect(generated.metadata.gameEntity[LEVEL].name).toBe("LEVEL_TUTORIAL");
      const focus = assertIdentifierAndComponents(generated, "focus", [POSITION]);
      const motion = getMotion(focus);
      const start = motion
        ? sampleMotion(motion, generated.metadata.elapsed)
        : focus[POSITION];
      expect(start).toMatchObject(player[POSITION]);
      expect(player).toHaveProperty(MOVABLE);
      expect(player[SPAWNABLE].classKey).toBe(key);
      expect(getItems(generated, player)).toContainEqual(
        expect.objectContaining({ consume: "key", material: "iron" })
      );
    } finally {
      setUnlocks(false);
      jest.useRealTimers();
    }
  });
});
