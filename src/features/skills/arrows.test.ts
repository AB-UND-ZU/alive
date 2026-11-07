import { CONDITIONABLE } from "../../engine/components/conditionable";
import { FRAGMENT } from "../../engine/components/fragment";
import { INVENTORY } from "../../engine/components/inventory";
import { NPC } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { PROJECTILE } from "../../engine/components/projectile";
import { SHOOTABLE } from "../../engine/components/shootable";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { moveEntity } from "../../engine/systems/map";
import { getLootable } from "../../engine/systems/collect";
import { SPRITE } from "../../engine/components/sprite";
import { none } from "../../game/assets/sprites";
import { playedSounds } from "../../testing/env";
import {
  act,
  advance,
  advanceUntil,
  face,
  findEntityAt,
  giveItems,
} from "../../testing/harness";
import {
  countAllLoot,
  countLoot,
  getProjectiles,
  getUnit,
  setupHero,
} from "./helpers";

const bow = [
  { skill: "bow" as const, material: "wood" as const, amount: 1 },
  { stackable: "arrow" as const, amount: 3 },
];

/** Bandit archer in line with the hero, carrying arrows to shoot. */
const setupArcher = (items = [] as Parameters<typeof setupHero>[1]) => {
  const area = `
|                    |
|♀       B           |
|                    |
`;
  const { world, hero } = setupHero(area, items, {
    legend: { B: "banditArcher" },
    size: 24,
  });
  const archer = getUnit(world, area, "B") as TypedEntity<
    "INVENTORY" | "POSITION" | "STATS"
  >;
  giveItems(world, archer, [{ stackable: "arrow", amount: 5 }]);
  return { world, hero, archer };
};

describe("arrows", () => {
  it("lose their shadow over water and sink into it at the end of their range", () => {
    const area = `
|♀ ~~~~~~~~~~~~      |
`;
    const { world } = setupHero(area, bow, { size: 24 });
    face(world, "right");

    act(world, "skill");
    const [arrow] = getProjectiles(world);
    advanceUntil(world, () => arrow[POSITION].x === 4, 1000);

    expect(arrow[PROJECTILE].shadow).toBe(false);

    advance(world, 2000);
    const drop = getLootable(world, { x: 9, y: 0 });

    expect(countLoot(world, { x: 9, y: 0 }, { stackable: "arrow" })).toBe(1);
    expect(drop?.[SPRITE]).toBe(none);
  });

  it("hit a limb of a large creature and pass the damage on to its body", () => {
    const area = `
|           |
|     G     |
|           |
|           |
|     ♀     |
`;
    const { world } = setupHero(area, bow, {
      legend: { G: "golem" },
      size: 24,
    });
    const golem = getUnit(world, area, "G");
    const leg = findEntityAt(world, { x: 5, y: 2 }, [
      FRAGMENT,
      STATS,
      SHOOTABLE,
    ])!;
    face(world, "up");

    act(world, "skill");
    advance(world, 1000);

    const damage = leg[STATS].maxHp - leg[STATS].hp;
    expect(damage).toBeGreaterThan(0);
    expect(leg[SHOOTABLE].shots).toBe(1);
    expect(golem[STATS].hp).toBe(golem[STATS].maxHp - damage);
  });

  it("from an archer hurt the hero", () => {
    const { world, hero } = setupArcher();

    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 10000);
  });

  it("from an archer are absorbed by the hero's bubble", () => {
    const { world, hero } = setupArcher([
      { skill: "block", material: "gold", amount: 1 },
      { stackable: "charge", amount: 1 },
    ]);
    act(world, "skill");
    const blocks = hero[CONDITIONABLE].block!.amount;

    advanceUntil(
      world,
      () => (hero[CONDITIONABLE].block?.amount ?? 0) < blocks,
      10000
    );

    expect(hero[CONDITIONABLE].block?.amount).toBe(blocks - 1);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
    expect(playedSounds).toContain("block");
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(0);
  });

  it("from an archer vanish instead of dropping when they miss", () => {
    const { world, hero, archer } = setupArcher();

    advanceUntil(world, () => getProjectiles(world).length > 0, 10000);
    moveEntity(world, hero, { x: 0, y: 12 });
    advanceUntil(world, () => getProjectiles(world).length === 0, 3000);
    advance(world, 1000);

    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(0);
    expect(archer[INVENTORY].items.length).toBeGreaterThan(0);
    expect(NPC in archer).toBe(true);
  });
});
