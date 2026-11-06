import { World } from "../../engine";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { RECHARGABLE } from "../../engine/components/rechargable";
import { STATS } from "../../engine/components/stats";
import { isDead } from "../../engine/systems/damage";
import {
  act,
  advance,
  advanceUntil,
  countItems,
  face,
  GivenItem,
  holdMove,
  walk,
} from "../../testing/harness";
import { countAllLoot, getUnit, setupHero } from "./helpers";

const area = `
|♀A       |
`;
const legend = { A: "dummy" };

const setup = (items: GivenItem[]) => {
  const { world, hero } = setupHero(area, items, { legend });
  const target = getUnit(world, area, "A");
  return { world, hero, target };
};

const attackUntilDead = (world: World, target: ReturnType<typeof getUnit>) => {
  holdMove(world, ["right"]);
  advanceUntil(world, () => isDead(world, target));
  holdMove(world, []);
  advance(world, 3000);
};

describe("recharge", () => {
  it("drops one charge from a mob killed in melee while carrying a rechargable skill", () => {
    const { world, target } = setup([
      { weapon: "sword", material: "ruby", amount: 1 },
      { skill: "zap", material: "wood", amount: 1 },
    ]);

    attackUntilDead(world, target);

    expect(countAllLoot(world, { stackable: "charge" })).toBe(1);
  });

  it("drops no charge without a rechargable skill", () => {
    const { world, target } = setup([
      { weapon: "sword", material: "ruby", amount: 1 },
    ]);

    attackUntilDead(world, target);

    expect(target[RECHARGABLE].hit).toBe(false);
    expect(countAllLoot(world, { stackable: "charge" })).toBe(0);
  });

  it("only needs the rechargable skill to be carried, not equipped", () => {
    const { world, hero, target } = setup([
      { weapon: "sword", material: "ruby", amount: 1 },
      { skill: "bow", material: "wood", amount: 1 },
      { skill: "slash", material: "wood", amount: 1 },
    ]);
    expect(countItems(world, hero, { skill: "slash" })).toBe(1);

    attackUntilDead(world, target);

    expect(countAllLoot(world, { stackable: "charge" })).toBe(1);
  });

  it("drops no charge from a mob killed only by arrows", () => {
    const area = `
|♀   A     |
`;
    const { world } = setupHero(
      area,
      [
        { skill: "bow", material: "ruby", amount: 1 },
        { stackable: "arrow", amount: 2 },
        { skill: "slash", material: "wood", amount: 1 },
      ],
      { legend }
    );
    const target = getUnit(world, area, "A");
    face(world, "right");

    act(world, "skill");
    advance(world, 1000);
    act(world, "skill");
    advanceUntil(world, () => isDead(world, target), 2000);
    advance(world, 3000);

    expect(target[RECHARGABLE].hit).toBe(false);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(2);
    expect(countAllLoot(world, { stackable: "charge" })).toBe(0);
  });

  it("drops a charge when a single melee hit is finished off by arrows", () => {
    const { world, target } = setup([
      { weapon: "sword", material: "wood", amount: 1 },
      { skill: "bow", material: "ruby", amount: 1 },
      { stackable: "arrow", amount: 2 },
      { skill: "slash", material: "wood", amount: 1 },
    ]);

    holdMove(world, ["right"]);
    advanceUntil(world, () => target[STATS].hp < target[STATS].maxHp);
    holdMove(world, []);
    expect(target[RECHARGABLE].hit).toBe(true);

    face(world, "right");
    act(world, "skill");
    advance(world, 1000);
    act(world, "skill");
    advanceUntil(world, () => isDead(world, target), 2000);
    advance(world, 3000);

    expect(countAllLoot(world, { stackable: "charge" })).toBe(1);
    expect(countAllLoot(world, { stackable: "arrow" })).toBe(2);
  });

  it("picks up the dropped charge to use the skill again", () => {
    const { world, hero, target } = setup([
      { weapon: "sword", material: "ruby", amount: 1 },
      { skill: "zap", material: "wood", amount: 1 },
    ]);
    attackUntilDead(world, target);

    walk(world, "right", 2);
    advance(world, 1000);
    expect(countItems(world, hero, { stackable: "charge" })).toBe(1);

    act(world, "skill");
    expect(hero[CONDITIONABLE].zap).toBeDefined();
    expect(countItems(world, hero, { stackable: "charge" })).toBe(0);
  });
});
