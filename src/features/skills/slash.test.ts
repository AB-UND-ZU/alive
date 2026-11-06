import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { playedSounds } from "../../testing/env";
import {
  act,
  advance,
  countItems,
  findInArea,
  getMessages,
  GivenItem,
} from "../../testing/harness";
import { getUnit, setupHero } from "./helpers";

const area = `
|         |
|         |
|   A     |
|    ♀B   |
|    C  D |
|         |
|         |
`;
const legend = { A: "dummy", B: "dummy", C: "dummy", D: "dummy" };

const setup = (items: GivenItem[]) => {
  const { world, hero } = setupHero(area, items, { legend });
  const units = ["A", "B", "C", "D"].map((char) => getUnit(world, area, char));
  return { world, hero, units };
};

const getDamage = (units: ReturnType<typeof setup>["units"]) =>
  units.map((unit) => unit[STATS].maxHp - unit[STATS].hp);

describe("slash", () => {
  it("spends one charge and hits every unit around the hero", () => {
    const { world, hero, units } = setup([
      { weapon: "sword", material: "iron", amount: 1 },
      { skill: "slash", material: "wood", amount: 1 },
      { stackable: "charge", amount: 2 },
    ]);

    act(world, "skill");
    advance(world, 1000);

    expect(playedSounds).toContain("slash");
    expect(countItems(world, hero, { stackable: "charge" })).toBe(1);
    expect(getDamage(units)).toEqual([5, 5, 5, 0]);
  });

  it("knocks hit units away from the hero", () => {
    const { world, units } = setup([
      { weapon: "sword", material: "iron", amount: 1 },
      { skill: "slash", material: "wood", amount: 1 },
      { stackable: "charge", amount: 1 },
    ]);
    const side = units[1];

    act(world, "skill");
    advance(world, 1000);

    expect(side[POSITION].y).toBe(findInArea(area, "B").y);
    expect(side[POSITION].x).toBeGreaterThan(findInArea(area, "B").x);
  });

  it.each([
    ["wood", "wood", 3],
    ["iron", "wood", 5],
    ["wood", "iron", 4],
    ["gold", "gold", 9],
  ] as const)(
    "adds %s sword damage to %s slash damage",
    (sword, slash, damage) => {
      const { world, units } = setup([
        { weapon: "sword", material: sword, amount: 1 },
        { skill: "slash", material: slash, amount: 1 },
        { stackable: "charge", amount: 1 },
      ]);

      act(world, "skill");
      advance(world, 1000);

      expect(getDamage(units)[1]).toBe(damage);
    }
  );

  it("refuses without a sword and keeps the charge", () => {
    const { world, hero, units } = setup([
      { skill: "slash", material: "wood", amount: 1 },
      { stackable: "charge", amount: 1 },
    ]);

    act(world, "skill");

    expect(playedSounds).toContain("deny");
    expect(playedSounds).not.toContain("slash");
    const messages = getMessages(world, hero).filter((text) =>
      text.startsWith("Need ")
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]).not.toContain("Charge");
    expect(countItems(world, hero, { stackable: "charge" })).toBe(1);

    advance(world, 1000);
    expect(getDamage(units)).toEqual([0, 0, 0, 0]);
  });

  it("refuses without charges", () => {
    const { world, hero, units } = setup([
      { weapon: "sword", material: "iron", amount: 1 },
      { skill: "slash", material: "wood", amount: 1 },
    ]);

    act(world, "skill");

    expect(playedSounds).toContain("deny");
    expect(getMessages(world, hero)).toContainEqual(
      expect.stringMatching(/^Need .Charge!$/)
    );

    advance(world, 1000);
    expect(getDamage(units)).toEqual([0, 0, 0, 0]);
  });
});
