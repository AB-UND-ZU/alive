import { CONDITIONABLE } from "../../engine/components/conditionable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { STATS } from "../../engine/components/stats";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import {
  act,
  advance,
  advanceUntil,
  countItems,
  getMessages,
} from "../../testing/harness";
import { getUnit, setupHero } from "./helpers";

const area = `
|     |
|♀    |
|     |
`;

// prism walks left along the corridor and attacks the hero
const corridor = `
|██████|
|█♀  ◀█|
|██████|
`;

describe("block", () => {
  it.each([
    ["wood", 1],
    ["iron", 2],
    ["gold", 3],
  ] as const)(
    "spends a charge to raise a %s bubble absorbing %i hits",
    (material, hits) => {
      const { world, hero } = setupHero(area, [
        { skill: "block", material, amount: 1 },
        { stackable: "charge", amount: 2 },
      ]);

      act(world, "skill");

      expect(playedSounds).toContain("block");
      expect(countItems(world, hero, { stackable: "charge" })).toBe(1);
      expect(hero[CONDITIONABLE].block?.amount).toBe(hits);
    }
  );

  it("absorbs melee hits until the bubble pops", () => {
    const { world, hero } = setupHero(corridor, [
      { skill: "block", material: "iron", amount: 1 },
      { stackable: "charge", amount: 1 },
    ]);
    const prism = getUnit(world, corridor, "◀");
    prism[ORIENTABLE].facing = "left";

    act(world, "skill");
    advanceUntil(world, () => hero[CONDITIONABLE].block?.amount === 1, 3000);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
    expect(getMessages(world, hero)).toContain("BLOCKED");

    advanceUntil(world, () => !hero[CONDITIONABLE].block, 3000);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);

    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 3000);
  });

  it("ignores casting again while the bubble is up", () => {
    const { world, hero } = setupHero(area, [
      { skill: "block", material: "wood", amount: 1 },
      { stackable: "charge", amount: 2 },
    ]);
    act(world, "skill");
    resetPlayedSounds();

    act(world, "skill");

    expect(countItems(world, hero, { stackable: "charge" })).toBe(1);
    expect(playedSounds).not.toContain("deny");
  });

  it("fades after its duration", () => {
    const { world, hero } = setupHero(area, [
      { skill: "block", material: "wood", amount: 1 },
      { stackable: "charge", amount: 1 },
    ]);
    act(world, "skill");

    advance(world, 2500);
    expect(hero[CONDITIONABLE].block).toBeDefined();

    advance(world, 1500);
    expect(hero[CONDITIONABLE].block).toBeUndefined();
  });

  it("refuses without charges", () => {
    const { world, hero } = setupHero(area, [
      { skill: "block", material: "wood", amount: 1 },
    ]);

    act(world, "skill");

    expect(playedSounds).toContain("deny");
    expect(getMessages(world, hero)).toContainEqual(
      expect.stringMatching(/^Need .Charge!$/)
    );
    expect(hero[CONDITIONABLE].block).toBeUndefined();
  });
});
