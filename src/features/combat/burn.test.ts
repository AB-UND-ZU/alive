import {
  advanceUntil,
  findEntityAt,
  findInArea,
  getEntitiesAt,
  giveItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { RENDERABLE } from "../../engine/components/renderable";
import { moveEntity } from "../../engine/systems/map";
import { STATS } from "../../engine/components/stats";
import { AFFECTABLE } from "../../engine/components/affectable";
import { BURNABLE } from "../../engine/components/burnable";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { POSITION } from "../../engine/components/position";
import { applyEffects } from "../../engine/systems/damage";
import { attackUntil, createCombatWorld, getUnit } from "./helpers";

// ♀ hero, * campfire, ~ shallow water
const area = `
|         |
| ♀ *~    |
|         |
`;

const fire = findInArea(area, "*");

const enterFire = () => {
  const { world, hero } = createCombatWorld(area, {}, 20);
  walk(world, "right", 2);
  return { world, hero };
};

describe("burning", () => {
  it("sets the hero on fire inside a campfire", () => {
    const { hero } = enterFire();

    expect(hero[POSITION]).toEqual(fire);
    expect(hero[AFFECTABLE].burn).toBeGreaterThan(0);
  });

  it("hurts the hero every tick while standing in a campfire", () => {
    const { world, hero } = enterFire();
    const hp = hero[STATS].hp;

    step(world, 70);

    expect(hero[STATS].hp).toBeLessThanOrEqual(hp - 5);
    expect(hero[AFFECTABLE].burn).toBeGreaterThan(0);
  });

  it("keeps hurting a burning hero after leaving the fire", () => {
    const { world, hero } = createCombatWorld(
      `
|         |
| ♀ *     |
|         |
`,
      {},
      20
    );
    walk(world, "right", 3);
    const hp = hero[STATS].hp;

    advanceUntil(world, () => hero[AFFECTABLE].burn === 0);

    expect(hero[STATS].hp).toBeLessThan(hp);
  });

  it("keeps burn damage four ticks apart after lingering across different fires", () => {
    const { world, hero } = createCombatWorld(
      `
|         |
| ♀ **    |
|         |
`,
      {},
      500
    );
    walk(world, "right", 2);
    step(world, 15);
    walk(world, "right");
    step(world, 240);
    moveEntity(world, hero, { x: 5, y: 1 });
    hero[AFFECTABLE].burn = 8;
    const hits: number[] = [];
    let hp = hero[STATS].hp;
    for (let frame = 0; frame < 600 && hits.length < 5; frame++) {
      step(world);
      if (hero[STATS].hp < hp) {
        hits.push(world.metadata.gameEntity[RENDERABLE].generation);
        hp = hero[STATS].hp;
      }
    }
    expect(hits).toHaveLength(5);
    expect(hits.slice(1).map((tick, index) => tick - hits[index])).toEqual([
      4, 4, 4, 4,
    ]);
  });

  it("is extinguished by walking into water", () => {
    const { world, hero } = enterFire();
    walk(world, "right");

    advanceUntil(world, () => hero[AFFECTABLE].burn === 0, 500);
    const hp = hero[STATS].hp;
    step(world, 60);

    expect(hero[STATS].hp).toBe(hp);
  });

  it("is reduced by damp", () => {
    const { world, hero } = createCombatWorld(area);
    hero[STATS].damp = 2;

    expect(applyEffects(world, hero, 3, 0)).toBe(true);
    expect(hero[AFFECTABLE].burn).toBe(1);
    expect(applyEffects(world, hero, 2, 0)).toBe(false);
  });

  it("doesn't set dead units on fire", () => {
    const { world, hero } = createCombatWorld(area);
    hero[STATS].hp = 0;

    expect(applyEffects(world, hero, 3, 0)).toBe(false);
    expect(hero[AFFECTABLE].burn).toBe(0);
  });

  it("is caused by fire swords and deals damage over time", () => {
    const target = `
|         |
| ♀ U     |
|         |
`;
    const { world, hero } = createCombatWorld(target, { U: "dummy" });
    const dummy = world.assertComponents(getUnit(world, target, "U"), [
      AFFECTABLE,
      STATS,
    ]);
    walk(world, "right");
    giveItems(world, hero, [
      { weapon: "sword", material: "wood", element: "fire", amount: 1 },
    ]);

    attackUntil(world, "right", () => dummy[STATS].hp < 25);
    expect(dummy[STATS].hp).toBe(23);
    expect(dummy[AFFECTABLE].burn).toBe(3);

    advanceUntil(world, () => dummy[AFFECTABLE].burn === 0);
    step(world, 30);

    expect(dummy[STATS].hp).toBe(20);
  });
});

describe("burning plants", () => {
  const plants = `
|         |
| ♀ U     |
|         |
`;
  const position = findInArea(plants, "U");

  const ignite = (plant: string) => {
    const { world } = createCombatWorld(plants, { U: plant });
    const entity = findEntityAt(world, position, [BURNABLE])!;
    entity[BURNABLE].burning = true;
    advanceUntil(world, () => !getEntitiesAt(world, position).includes(entity));
    step(world, 30);
    return { world, entity };
  };

  it("burns a tree down to a stump", () => {
    const { world, entity } = ignite("tree");

    expect(entity[BURNABLE].combusted).toBe(true);
    expect(
      findEntityAt(world, position, [HARVESTABLE])?.[HARVESTABLE].resource
    ).toBe("stump");
  });

  it("burns grass away without remains", () => {
    const { world } = ignite("grass");

    expect(findEntityAt(world, position, [BURNABLE])).toBeUndefined();
    expect(findEntityAt(world, position, [HARVESTABLE])).toBeUndefined();
  });

  it("keeps an unlit tree", () => {
    const { world } = createCombatWorld(plants, { U: "tree" });
    holdMove(world, []);
    step(world, 300);

    expect(
      findEntityAt(world, position, [BURNABLE])?.[BURNABLE].combusted
    ).toBe(false);
  });
});
