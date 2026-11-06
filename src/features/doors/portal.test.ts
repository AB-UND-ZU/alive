import {
  findEntityAt,
  findInArea,
  getItems,
  giveItems,
  step,
  trigger,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { LEVEL } from "../../engine/components/level";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { POSITION } from "../../engine/components/position";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { WARPABLE } from "../../engine/components/warpable";
import { getTab } from "../../engine/systems/popup";
import { canWarp } from "../../engine/systems/trigger";
import { getSelectedLevel, levelConfig } from "../../game/levels";
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

  it("only lets the hero warp to the next level", () => {
    const { world, hero } = setup(area, { level: "LEVEL_MENU" });
    const portal = getPortal(world);
    interact(world, 30);
    press(world, "right", 2);

    selectLevel(world, portal, "LEVEL_TUTORIAL");
    expect(canWarp(world, hero, portal)).toBe(true);

    selectLevel(world, portal, "LEVEL_ISLAND");
    expect(canWarp(world, hero, portal)).toBe(false);
  });

  it("warps the hero with class and items into the next level", () => {
    jest.useFakeTimers();
    try {
      const { world, hero } = setup(area, { level: "LEVEL_MENU" });
      const portal = getPortal(world);
      giveItems(world, hero, [{ consume: "key", material: "iron", amount: 1 }]);
      interact(world, 30);
      expect(portal[POPUP].tabs).toEqual(["class", "style", "warp"]);

      press(world, "right", 2);
      selectLevel(world, portal, "LEVEL_TUTORIAL");
      press(world, "right");

      expect(playedSounds).toContain("confirm");
      expect(hero[PLAYER].popup).toBeUndefined();
      expect(hero[POSITION]).toEqual(portal[POSITION]);
      expect(hero).not.toHaveProperty(MOVABLE);

      jest.advanceTimersByTime(3500);
      expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_TUTORIAL");
      expect(hero).not.toHaveProperty(MOVABLE);

      jest.advanceTimersByTime(2000);
      expect(hero).toHaveProperty(MOVABLE);
      expect(
        world.assertComponents(hero, [SPAWNABLE])[SPAWNABLE].classKey
      ).toBe("rogue");
      expect(getItems(world, hero)).toContainEqual(
        expect.objectContaining({ consume: "key", material: "iron" })
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
