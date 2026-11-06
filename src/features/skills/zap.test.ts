import { World } from "../../engine";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { Material } from "../../engine/components/item";
import { STATS } from "../../engine/components/stats";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import {
  act,
  advance,
  advanceUntil,
  countItems,
  getMessages,
  holdMove,
} from "../../testing/harness";
import { getUnit, setupHero } from "./helpers";

const area = `
|           |
|♀A   B     |
|           |
`;
const legend = { A: "dummy", B: "dummy" };

const setup = (material: Material, charges = 2) => {
  const { world, hero } = setupHero(
    area,
    [
      { weapon: "sword", material: "wood", amount: 1 },
      { skill: "zap", material, amount: 1 },
      ...(charges > 0
        ? [{ stackable: "charge" as const, amount: charges }]
        : []),
    ],
    { legend }
  );
  const struck = getUnit(world, area, "A");
  const nearby = getUnit(world, area, "B");
  return { world, hero, struck, nearby };
};

const strike = (world: World, target: ReturnType<typeof getUnit>) => {
  holdMove(world, ["right"]);
  advanceUntil(world, () => target[STATS].hp < target[STATS].maxHp);
  holdMove(world, []);
  advance(world, 500);
};

describe("zap", () => {
  it.each([
    ["wood", 1],
    ["iron", 2],
    ["gold", 3],
  ] as const)(
    "spends a charge to load %s zap with %i jumps",
    (material, targets) => {
      const { world, hero } = setup(material);

      act(world, "skill");

      expect(playedSounds).toContain("zap");
      expect(countItems(world, hero, { stackable: "charge" })).toBe(1);
      expect(hero[CONDITIONABLE].zap?.amount).toBe(targets);
    }
  );

  it("ignores casting again while loaded", () => {
    const { world, hero } = setup("iron");
    act(world, "skill");
    resetPlayedSounds();

    act(world, "skill");

    expect(countItems(world, hero, { stackable: "charge" })).toBe(1);
    expect(playedSounds).not.toContain("deny");
    expect(
      getMessages(world, hero).filter((text) => text.startsWith("Need "))
    ).toHaveLength(0);
  });

  it("discharges on the next melee hit into the target and a nearby enemy", () => {
    const { world, hero, struck, nearby } = setup("iron");
    act(world, "skill");

    strike(world, struck);

    expect(playedSounds).toContain("spark");
    expect(struck[STATS].hp).toBe(struck[STATS].maxHp - 2 - 3);
    expect(nearby[STATS].hp).toBe(nearby[STATS].maxHp - 3);
    expect(hero[CONDITIONABLE].zap).toBeUndefined();
  });

  it("jumps to a nearby enemy first when zapping a single target", () => {
    const { world, hero, struck, nearby } = setup("wood");
    act(world, "skill");

    strike(world, struck);

    expect(struck[STATS].hp).toBe(struck[STATS].maxHp - 2);
    expect(nearby[STATS].hp).toBe(nearby[STATS].maxHp - 3);
    expect(hero[CONDITIONABLE].zap).toBeUndefined();
  });

  it("melee hits without a loaded zap deal only sword damage", () => {
    const { world, struck, nearby } = setup("iron");

    strike(world, struck);

    expect(playedSounds).not.toContain("spark");
    expect(struck[STATS].hp).toBe(struck[STATS].maxHp - 2);
    expect(nearby[STATS].hp).toBe(nearby[STATS].maxHp);
  });

  it("fades after its duration", () => {
    const { world, hero } = setup("wood");
    act(world, "skill");

    advance(world, 12000);
    expect(hero[CONDITIONABLE].zap).toBeDefined();

    advance(world, 1000);
    expect(hero[CONDITIONABLE].zap).toBeUndefined();
  });

  it("refuses without charges", () => {
    const { world, hero } = setup("wood", 0);

    act(world, "skill");

    expect(playedSounds).toContain("deny");
    expect(getMessages(world, hero)).toContainEqual(
      expect.stringMatching(/^Need .Charge!$/)
    );
    expect(hero[CONDITIONABLE].zap).toBeUndefined();
  });
});
