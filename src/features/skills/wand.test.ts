import { Material } from "../../engine/components/item";
import { STATS } from "../../engine/components/stats";
import { playedSounds } from "../../testing/env";
import {
  act,
  advance,
  advanceUntil,
  face,
  holdMove,
} from "../../testing/harness";
import { getUnit, setupHero } from "./helpers";

const legend = { A: "dummy", B: "dummy" };

const wand = (material: Material) => [
  { weapon: "wand" as const, skill: "wand" as const, material, amount: 1 },
];

describe("wand", () => {
  it.each([
    ["wood", 1],
    ["iron", 2],
    ["gold", 3],
    ["diamond", 4],
    ["ruby", 5],
  ] as const)(
    "casts a %s bolt at a target in range without spending mana",
    (material, damage) => {
      const area = `
|♀   A        |
`;
      const { world, hero } = setupHero(area, wand(material), { legend });
      const target = getUnit(world, area, "A");
      face(world, "right");

      act(world, "skill");
      advance(world, 2000);

      expect(playedSounds).toContain("bolt");
      expect(playedSounds).not.toContain("deny");
      expect(hero[STATS].mp).toBe(0);
      expect(target[STATS].hp).toBe(target[STATS].maxHp - damage);
    }
  );

  it("does not reach targets beyond its range", () => {
    const area = `
|♀      A        |
`;
    const { world } = setupHero(area, wand("ruby"), { legend, size: 24 });
    const target = getUnit(world, area, "A");
    face(world, "right");

    act(world, "skill");
    advance(world, 3000);

    expect(target[STATS].hp).toBe(target[STATS].maxHp);
  });

  it("casts a bolt when bumping into a target", () => {
    const area = `
|♀AB      |
`;
    const { world } = setupHero(area, wand("iron"), { legend });
    const first = getUnit(world, area, "A");
    const second = getUnit(world, area, "B");

    holdMove(world, ["right"]);
    advanceUntil(world, () => first[STATS].hp < first[STATS].maxHp);
    holdMove(world, []);
    advance(world, 1000);

    expect(playedSounds).toContain("bolt");
    expect(first[STATS].hp).toBe(first[STATS].maxHp - 2);
    expect(second[STATS].hp).toBe(second[STATS].maxHp);
  });
});
