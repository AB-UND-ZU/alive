import { Material } from "../../engine/components/item";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { SHOOTABLE } from "../../engine/components/shootable";
import { STATS } from "../../engine/components/stats";
import { isDead } from "../../engine/systems/damage";
import { playedSounds } from "../../testing/env";
import {
  act,
  advance,
  advanceUntil,
  countItems,
  face,
  getMessages,
  walk,
} from "../../testing/harness";
import {
  countAllLoot,
  countLoot,
  getProjectiles,
  getUnit,
  setupHero,
} from "./helpers";

const bow = (material: Material = "wood", arrows = 3) => [
  { skill: "bow" as const, material, amount: 1 },
  { stackable: "arrow" as const, amount: arrows },
];

const legend = { A: "dummy", B: "dummy", G: "guide" };

describe("bow", () => {
  it("spends one arrow per shot and flies in the facing direction", () => {
    const area = `
|          |
|    ♀     |
|          |
`;
    const { world, hero } = setupHero(area, bow("wood", 3));
    face(world, "up");

    act(world, "skill");

    expect(countItems(world, hero, { stackable: "arrow" })).toBe(2);
    expect(playedSounds).toContain("arrow");

    const [arrow] = getProjectiles(world);
    expect(arrow[ORIENTABLE].facing).toBe("up");
    advanceUntil(world, () => arrow[POSITION].y !== hero[POSITION].y, 1000);
    expect(arrow[POSITION].x).toBe(hero[POSITION].x);
  });

  it("refuses to shoot without arrows", () => {
    const area = `
|♀   A |
`;
    const { world, hero } = setupHero(
      area,
      [{ skill: "bow", material: "wood", amount: 1 }],
      { legend }
    );
    const target = getUnit(world, area, "A");
    face(world, "right");

    act(world, "skill");
    advance(world, 1000);

    expect(playedSounds).toContain("deny");
    expect(playedSounds).not.toContain("arrow");
    expect(
      getMessages(world, hero).some((text) => /^Need .Arrow!$/.test(text))
    ).toBe(true);
    expect(getProjectiles(world)).toHaveLength(0);
    expect(target[STATS].hp).toBe(target[STATS].maxHp);
  });

  it.each([
    ["wood", 3],
    ["iron", 6],
    ["gold", 9],
  ] as const)(
    "deals %s bow damage only to the first target in line",
    (material, damage) => {
      const area = `
|♀   A B   |
`;
      const { world } = setupHero(area, bow(material), { legend });
      const first = getUnit(world, area, "A");
      const second = getUnit(world, area, "B");
      face(world, "right");

      act(world, "skill");
      advance(world, 1000);

      expect(first[STATS].hp).toBe(first[STATS].maxHp - damage);
      expect(second[STATS].hp).toBe(second[STATS].maxHp);
      expect(getProjectiles(world)).toHaveLength(0);
    }
  );

  it("hits an adjacent target and keeps the arrow stuck in it", () => {
    const area = `
|♀A     |
`;
    const { world } = setupHero(area, bow(), { legend });
    const target = getUnit(world, area, "A");
    face(world, "right");

    act(world, "skill");
    act(world, "skill");
    advance(world, 1000);

    expect(target[STATS].hp).toBe(target[STATS].maxHp - 6);
    expect(target[SHOOTABLE].shots).toBe(2);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(0);
  });

  it("bounces off a mountain and drops in front of it", () => {
    const area = `
|♀   █     |
`;
    const { world } = setupHero(area, bow());
    face(world, "right");

    act(world, "skill");
    advance(world, 2000);

    expect(getProjectiles(world)).toHaveLength(0);
    expect(countLoot(world, { x: 3, y: 0 }, { stackable: "arrow" })).toBe(1);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(1);
  });

  it("bounces off allies without hurting them", () => {
    const area = `
|♀   G     |
`;
    const { world } = setupHero(area, bow(), { legend });
    const guide = getUnit(world, area, "G");
    face(world, "right");

    act(world, "skill");
    advance(world, 2000);

    expect(guide[STATS].hp).toBe(guide[STATS].maxHp);
    expect(guide[SHOOTABLE].shots).toBe(0);
    expect(countLoot(world, { x: 3, y: 0 }, { stackable: "arrow" })).toBe(1);
  });

  it("bounces off items lying on the ground", () => {
    const area = `
|♀   ∙     |
`;
    const { world } = setupHero(area, bow(), { size: 24 });
    face(world, "right");

    act(world, "skill");
    advance(world, 2000);

    expect(countLoot(world, { x: 4, y: 0 }, { stackable: "coin" })).toBe(1);
    expect(countLoot(world, { x: 3, y: 0 }, { stackable: "arrow" })).toBe(1);
  });

  it("drops at the end of its range to be picked up again", () => {
    const area = `
|♀            |
`;
    const { world, hero } = setupHero(area, bow("wood", 2), { size: 24 });
    face(world, "right");

    act(world, "skill");
    advance(world, 2000);

    expect(countItems(world, hero, { stackable: "arrow" })).toBe(1);
    expect(countLoot(world, { x: 9, y: 0 }, { stackable: "arrow" })).toBe(1);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(1);

    walk(world, "right", 9);
    advance(world, 500);

    expect(countItems(world, hero, { stackable: "arrow" })).toBe(2);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(0);
  });

  it("stacks with arrows already lying in its path", () => {
    const area = `
|♀            |
`;
    const { world } = setupHero(area, bow("wood", 2), { size: 24 });
    face(world, "right");

    act(world, "skill");
    advance(world, 2000);
    act(world, "skill");
    advance(world, 2000);

    expect(countLoot(world, { x: 9, y: 0 }, { stackable: "arrow" })).toBe(2);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(2);
  });

  it("drops arrows stuck in a killed target along with its loot", () => {
    const area = `
|♀   A     |
`;
    const { world } = setupHero(area, bow("ruby", 3), { legend });
    const target = getUnit(world, area, "A");
    face(world, "right");

    act(world, "skill");
    advance(world, 1000);
    expect(target[SHOOTABLE].shots).toBe(1);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(0);

    act(world, "skill");
    advanceUntil(world, () => isDead(world, target), 2000);
    advance(world, 3000);

    expect(countAllLoot(world, { stackable: "arrow" })).toBe(2);
    expect(countAllLoot(world, { stackable: "coin" })).toBe(1);
  });
});
