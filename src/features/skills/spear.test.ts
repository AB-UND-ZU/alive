import { STATS } from "../../engine/components/stats";
import { playedSounds } from "../../testing/env";
import {
  act,
  advance,
  advanceUntil,
  face,
  getItems,
  holdMove,
} from "../../testing/harness";
import { getUnit, setupHero } from "./helpers";

const area = `
|  Z♀ABCD      |
`;
const legend = { A: "dummy", B: "dummy", C: "dummy", D: "dummy", Z: "dummy" };

const setup = (material: "wood" | "iron" | "gold" | "diamond" | "ruby") => {
  const { world, hero } = setupHero(
    area,
    [{ weapon: "spear", skill: "spear", material, amount: 1 }],
    { legend }
  );
  const units = ["A", "B", "C", "D", "Z"].map((char) =>
    getUnit(world, area, char)
  );
  return { world, hero, units };
};

const getDamage = (units: ReturnType<typeof setup>["units"]) =>
  units.map((unit) => unit[STATS].maxHp - unit[STATS].hp);

describe("spear", () => {
  it("is held as weapon and skill at once", () => {
    const { hero } = setup("wood");

    expect(hero.EQUIPPABLE.weapon).toBeDefined();
    expect(hero.EQUIPPABLE.skill).toBe(hero.EQUIPPABLE.weapon);
  });

  it.each([
    ["wood", 1],
    ["iron", 2],
    ["gold", 3],
    ["diamond", 4],
    ["ruby", 5],
  ] as const)(
    "stabs the three cells in front with a %s spear",
    (material, damage) => {
      const { world, units } = setup(material);
      face(world, "right");

      act(world, "skill");
      advance(world, 1000);

      expect(playedSounds).toContain("spear");
      expect(getDamage(units)).toEqual([damage, damage, damage, 0, 0]);
    }
  );

  it("stabs only in the facing direction", () => {
    const { world, units } = setup("iron");
    face(world, "left");

    act(world, "skill");
    advance(world, 1000);

    expect(getDamage(units)).toEqual([0, 0, 0, 0, 2]);
  });

  it("needs no ammunition to be used again", () => {
    const { world, hero, units } = setup("iron");
    const items = getItems(world, hero).length;
    face(world, "right");

    act(world, "skill");
    advance(world, 1000);
    act(world, "skill");
    advance(world, 1000);

    expect(playedSounds).not.toContain("deny");
    expect(getItems(world, hero)).toHaveLength(items);
    expect(getDamage(units)).toEqual([4, 4, 4, 0, 0]);
  });

  it("stabs the whole line when bumping into a target", () => {
    const { world, units } = setup("iron");

    holdMove(world, ["right"]);
    advanceUntil(world, () => units[0][STATS].hp < units[0][STATS].maxHp);
    holdMove(world, []);
    advance(world, 500);

    expect(playedSounds).toContain("spear");
    expect(getDamage(units)).toEqual([2, 2, 2, 0, 0]);
  });
});
