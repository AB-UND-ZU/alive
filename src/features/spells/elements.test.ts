import { Entity } from "../../engine/entities";
import { AFFECTABLE } from "../../engine/components/affectable";
import { BURNABLE } from "../../engine/components/burnable";
import { FREEZABLE } from "../../engine/components/freezable";
import { IMMERSIBLE } from "../../engine/components/immersible";
import { Spell } from "../../engine/components/item";
import { STATS } from "../../engine/components/stats";
import { getEntityStats } from "../../engine/systems/damage";
import { isFrozen } from "../../engine/systems/freeze";
import { isWalkable } from "../../engine/systems/movement";
import { getAbilityStats } from "../../game/balancing/abilities";
import { findEntityAt, findInArea, step, walk } from "../../testing/harness";
import {
  cast,
  createSpellWorld,
  getUnit,
  recordHits,
  waitForSpell,
} from "./helpers";

const line = `
|            |
| ♀ D , # ≈ %|
|            |
`;

const getTerrain = <C extends keyof Entity>(
  world: Parameters<typeof findEntityAt>[0],
  char: string,
  component: C
) => findEntityAt(world, findInArea(line, char), [component])!;

describe("fire spells", () => {
  it("set hostile units on fire, which burns them over time", () => {
    const item = { spell: "wave", material: "wood", element: "fire" } as const;
    const { world } = createSpellWorld(line, item, { size: 30 });
    const dummy = world.assertComponents(getUnit(world, line, "D"), [
      AFFECTABLE,
      STATS,
    ]);
    const { magic, burn } = getAbilityStats(item);

    cast(world, "right");
    const [hits] = recordHits(world, [dummy], 20);

    expect(hits).toEqual([magic]);
    expect(dummy[AFFECTABLE].burn).toBe(burn);

    const [burns] = recordHits(world, [dummy], 150);

    expect(burns.length).toBeGreaterThan(0);
  });

  it("ignite grass and trees in range", () => {
    const item = { spell: "wave", material: "wood", element: "fire" } as const;
    const { world, hero } = createSpellWorld(line, item, { size: 30 });
    const grass = getTerrain(world, ",", BURNABLE);
    const tree = getTerrain(world, "#", BURNABLE);

    cast(world, "right");
    waitForSpell(world, hero);

    expect(grass[BURNABLE].burning || grass[BURNABLE].combusted).toBe(true);
    expect(tree[BURNABLE].burning).toBe(true);
  });

  it("thaw ice into water", () => {
    const item = { spell: "beam", material: "wood", element: "fire" } as const;
    const { world, hero } = createSpellWorld(line, item, { size: 30 });
    const ice = getTerrain(world, "%", FREEZABLE);

    expect(isFrozen(world, ice)).toBe(true);

    cast(world, "right");
    waitForSpell(world, hero);

    expect(isFrozen(world, ice)).toBe(false);
    expect(ice[IMMERSIBLE]).toMatchObject({ type: "water" });
  });
});

describe("water spells", () => {
  it("freeze hostile units", () => {
    const item = { spell: "wave", material: "wood", element: "water" } as const;
    const { world } = createSpellWorld(line, item, { size: 30 });
    const dummy = world.assertComponents(getUnit(world, line, "D"), [
      AFFECTABLE,
      STATS,
    ]);
    const { magic, freeze } = getAbilityStats(item);

    cast(world, "right");
    const [hits] = recordHits(world, [dummy], 20);

    expect(hits).toEqual([magic]);
    expect(dummy[AFFECTABLE].freeze).toBeGreaterThan(0);
    expect(dummy[AFFECTABLE].freeze).toBeLessThanOrEqual(freeze);
    expect(isFrozen(world, dummy)).toBe(true);
  });

  it("freeze water into walkable ice", () => {
    const item = { spell: "beam", material: "wood", element: "water" } as const;
    const { world, hero } = createSpellWorld(line, item, { size: 30 });
    const water = getTerrain(world, "≈", FREEZABLE);

    cast(world, "right");
    waitForSpell(world, hero);

    expect(isFrozen(world, water)).toBe(true);
    expect(water[IMMERSIBLE]).toBeUndefined();
    expect(isWalkable(world, findInArea(line, "≈"))).toBe(true);
  });

  it("extinguish burning terrain", () => {
    const item = { spell: "wave", material: "wood", element: "water" } as const;
    const { world, hero } = createSpellWorld(line, item, { size: 30 });
    const tree = getTerrain(world, "#", BURNABLE);
    tree[BURNABLE].burning = true;

    cast(world, "right");
    waitForSpell(world, hero);

    expect(tree[BURNABLE].burning).toBe(false);
    expect(tree[BURNABLE].combusted).toBe(false);
  });

  it("extinguish burning units instead of freezing them", () => {
    const item = { spell: "wave", material: "wood", element: "water" } as const;
    const { world } = createSpellWorld(line, item, { size: 30 });
    const dummy = world.assertComponents(getUnit(world, line, "D"), [
      AFFECTABLE,
      STATS,
    ]);
    dummy[AFFECTABLE].burn = 3;

    cast(world, "right");
    recordHits(world, [dummy], 20);

    expect(dummy[AFFECTABLE].burn).toBe(0);
    expect(dummy[AFFECTABLE].freeze).toBe(0);
  });
});

describe("earth spells", () => {
  it.each<Spell>(["wave", "dash"])(
    "earth %s drains health from hit units to the caster",
    (spell) => {
      const area = `
|          |
| ♀ D A    |
|          |
`;
      const item = { spell, material: "wood", element: "earth" } as const;
      const { world, hero } = createSpellWorld(area, item, {
        legend: { A: "dummy" },
        size: 30,
      });
      const units = [getUnit(world, area, "D"), getUnit(world, area, "A")];
      const { magic, drain } = getAbilityStats(item);
      hero[STATS].maxHp = 20;
      hero[STATS].hp = 5;

      cast(world, "right");
      const hits = recordHits(world, units, 90);

      expect(hits).toEqual([[magic], [magic]]);
      expect(hero[STATS].hp).toBe(5 + 2 * drain);
    }
  );

  it("earth beam heals friendly units and hurts hostile ones", () => {
    const area = `
|          |
| ♀ N D    |
|          |
`;
    const item = { spell: "beam", material: "wood", element: "earth" } as const;
    const { world } = createSpellWorld(area, item, {
      legend: { N: "guide" },
      size: 30,
    });
    const guide = getUnit(world, area, "N");
    const dummy = getUnit(world, area, "D");
    const { magic, heal } = getAbilityStats(item);
    guide[STATS].hp = 10;

    cast(world, "right");
    const [guideHits, dummyHits] = recordHits(world, [guide, dummy], 30);

    expect(guideHits).toEqual([]);
    expect(guide[STATS].hp).toBeGreaterThanOrEqual(10 + heal);
    expect(dummyHits[0]).toBe(magic);
  });

  it("earth trap heals its caster stepping back on it", () => {
    const area = `
|       |
| ♀     |
|       |
`;
    const item = { spell: "trap", material: "wood", element: "earth" } as const;
    const { world, hero } = createSpellWorld(area, item);
    const { heal } = getAbilityStats(item);
    hero[STATS].maxHp = 20;
    hero[STATS].hp = 5;

    cast(world, "right");
    walk(world, "right", 1);
    walk(world, "left", 1);
    step(world, 20);

    expect(hero[STATS].hp).toBe(5 + heal);
  });
});

describe("air spells", () => {
  it.each<Spell>(["wave", "beam", "dash"])(
    "air %s adds wisdom to its caster for more damage",
    (spell) => {
      const area = `
|          |
| ♀ D      |
|          |
`;
      const item = { spell, material: "wood", element: "air" } as const;
      const { world, hero } = createSpellWorld(area, item, { size: 30 });
      const dummy = getUnit(world, area, "D");
      const { magic, wisdom } = getAbilityStats(item);

      expect(getEntityStats(world, hero).wisdom).toBe(wisdom);

      cast(world, "right");
      const [hits] = recordHits(world, [dummy], 30);

      expect(hits[0]).toBe(magic + wisdom);
    }
  );
});
