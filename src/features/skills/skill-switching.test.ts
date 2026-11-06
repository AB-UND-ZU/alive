import { ACTIONABLE } from "../../engine/components/actionable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { playedSounds } from "../../testing/env";
import {
  act,
  countItems,
  face,
  getMessages,
  GivenItem,
} from "../../testing/harness";
import { equipFromMenu, getProjectiles, setupHero } from "./helpers";

const area = `
|♀       |
`;

const bowAndAxe: GivenItem[] = [
  { skill: "bow", material: "wood", amount: 1 },
  { stackable: "arrow", amount: 3 },
  { tool: "axe", material: "wood", amount: 1 },
];

describe("switching between skill and tool", () => {
  it("keeps the skill active and asks to swap when picking up a tool", () => {
    const { world, hero } = setupHero(area, bowAndAxe);

    expect(hero[EQUIPPABLE].skill).toBeDefined();
    expect(hero[EQUIPPABLE].tool).toBeUndefined();
    expect(hero[ACTIONABLE].toolEquipped).toBe(false);
    expect(getMessages(world, hero)).toContainEqual(
      expect.stringContaining("Swap with")
    );
  });

  it("uses the skill while the tool is stowed", () => {
    const { world, hero } = setupHero(area, bowAndAxe);
    face(world, "right");

    act(world, "skill");

    expect(getProjectiles(world)).toHaveLength(1);
    expect(countItems(world, hero, { stackable: "arrow" })).toBe(2);
    expect(hero[CONDITIONABLE].axe).toBeUndefined();
  });

  it("uses the tool after equipping it from the equip menu", () => {
    const { world, hero } = setupHero(area, bowAndAxe);

    equipFromMenu(world, 1);
    expect(hero[EQUIPPABLE].tool).toBeDefined();
    expect(hero[ACTIONABLE].toolEquipped).toBe(true);

    face(world, "right");
    act(world, "skill");

    expect(hero[CONDITIONABLE].axe).toBeDefined();
    expect(getProjectiles(world)).toHaveLength(0);
    expect(countItems(world, hero, { stackable: "arrow" })).toBe(3);
  });

  it("uses the skill again after switching back in the equip menu", () => {
    const { world, hero } = setupHero(area, bowAndAxe);
    equipFromMenu(world, 1);

    equipFromMenu(world, 0);
    expect(hero[ACTIONABLE].toolEquipped).toBe(false);

    face(world, "right");
    act(world, "skill");

    expect(getProjectiles(world)).toHaveLength(1);
    expect(hero[CONDITIONABLE].axe).toBeUndefined();
  });

  it("uses a tool when no skill is equipped", () => {
    const { world, hero } = setupHero(area, [
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    hero[ACTIONABLE].toolEquipped = false;

    act(world, "skill");

    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
    expect(hero[CONDITIONABLE].axe).toBeDefined();
    expect(playedSounds).not.toContain("deny");
  });

  it("ends a loaded zap when switching to a tool", () => {
    const { world, hero } = setupHero(area, [
      { skill: "zap", material: "wood", amount: 1 },
      { stackable: "charge", amount: 1 },
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    act(world, "skill");
    expect(hero[CONDITIONABLE].zap).toBeDefined();

    equipFromMenu(world, 1);

    expect(hero[CONDITIONABLE].zap).toBeUndefined();
  });
});
