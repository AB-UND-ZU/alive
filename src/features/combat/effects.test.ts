import { advance, giveItems, step, walk } from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { POSITION } from "../../engine/components/position";
import { BELONGABLE } from "../../engine/components/belongable";
import { BUMPABLE } from "../../engine/components/bumpable";
import { RENDERABLE } from "../../engine/components/renderable";
import { knockEntity } from "../../engine/systems/damage";
import { attackUntil, createCombatWorld, getUnit } from "./helpers";

describe("draining", () => {
  const area = `
|         |
| ♀ U     |
|         |
`;

  const setup = () => {
    const { world, hero } = createCombatWorld(area, { U: "dummy" });
    const dummy = getUnit(world, area, "U");
    walk(world, "right");
    giveItems(world, hero, [
      { weapon: "sword", material: "wood", element: "earth", amount: 1 },
    ]);
    hero[STATS].hp = 5;
    step(world, 15);
    return { world, hero, dummy };
  };

  it("heals the attacker with an earth sword", () => {
    const { world, hero, dummy } = setup();

    attackUntil(world, "right", () => dummy[STATS].hp < 25);

    expect(dummy[STATS].hp).toBe(23);
    expect(hero[STATS].hp).toBe(7);
  });

  it("heals only once per target until the effect is ready again", () => {
    const { world, hero, dummy } = setup();

    attackUntil(world, "right", () => dummy[STATS].hp < 25);
    attackUntil(world, "right", () => dummy[STATS].hp < 23);
    attackUntil(world, "right", () => dummy[STATS].hp < 21);

    expect(hero[STATS].hp).toBe(7);

    advance(world, 35000);
    attackUntil(world, "right", () => dummy[STATS].hp < 19);

    expect(hero[STATS].hp).toBe(9);
  });

  it("doesn't heal beyond max hp", () => {
    const { world, hero, dummy } = setup();
    hero[STATS].hp = 9.5;

    attackUntil(world, "right", () => dummy[STATS].hp < 25);

    expect(hero[STATS].hp).toBe(10);
  });
});

describe("knockback", () => {
  const area = `
|           |
| ♀ U    █  |
|           |
`;

  const setup = (legend: Record<string, string> = {}) => {
    const { world, hero } = createCombatWorld(area, { U: "prism", ...legend });
    return { world, hero, prism: getUnit(world, area, "U") };
  };

  it("pushes a unit back by the knock amount", () => {
    const { world, prism } = setup();

    knockEntity(world, prism, "right", 2);

    expect(prism[POSITION]).toEqual({ x: 5, y: 1 });
  });

  it("stops in front of obstacles", () => {
    const { world, prism } = setup();

    knockEntity(world, prism, "right", 10);

    expect(prism[POSITION]).toEqual({ x: 7, y: 1 });
  });

  it("bumps a unit that can't move", () => {
    const { world, prism } = setup();
    const unit = world.assertComponents(prism, [BUMPABLE, RENDERABLE]);

    knockEntity(world, prism, "up", 0);
    expect(prism[POSITION]).toEqual({ x: 3, y: 1 });

    knockEntity(world, prism, "left", 2);
    expect(prism[POSITION]).toEqual({ x: 2, y: 1 });

    knockEntity(world, prism, "left", 2);
    expect(prism[POSITION]).toEqual({ x: 2, y: 1 });
    expect(unit[BUMPABLE]).toEqual(
      expect.objectContaining({ orientation: "left" })
    );
  });

  it("doesn't affect the fire tribe", () => {
    const { world, prism } = setup();
    world.assertComponents(prism, [BELONGABLE])[BELONGABLE].faction = "fire";

    knockEntity(world, prism, "right", 2);

    expect(prism[POSITION]).toEqual({ x: 3, y: 1 });
  });

  it("stings units knocked into spikes", () => {
    const { world, hero } = createCombatWorld(area, { U: "cactus" });
    const cactus = getUnit(world, area, "U");

    knockEntity(world, hero, "right", 3);

    expect(hero[POSITION]).toEqual({ x: 2, y: 1 });
    expect(hero[STATS].hp).toBe(10 - cactus[STATS].spike);
  });
});
