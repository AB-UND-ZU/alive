import { materials } from "../../engine/components/item";
import { MOVABLE } from "../../engine/components/movable";
import { POSITION } from "../../engine/components/position";
import { getAbilityStats } from "../../game/balancing/abilities";
import { findInArea, step } from "../../testing/harness";
import {
  cast,
  createArea,
  createSpellWorld,
  getUnit,
  recordHits,
  waitForSpell,
} from "./helpers";

const dash = { spell: "dash", material: "wood" } as const;
const { magic, range } = getAbilityStats(dash);

describe("dash spell", () => {
  it("moves the caster its range in the facing direction", () => {
    const hero = { x: 1, y: 1 };
    const area = createArea(range + 4, 3, { "♀": hero });
    const { world, hero: caster } = createSpellWorld(area, dash, { size: 30 });

    cast(world, "right");
    waitForSpell(world, caster);

    expect(caster[POSITION]).toEqual({ x: hero.x + range, y: hero.y });
  });

  it("dashes left as well, wrapping around the map", () => {
    const area = `
|       |
| ♀     |
|       |
`;
    const { world, hero } = createSpellWorld(area, dash, { size: 20 });

    cast(world, "left");
    waitForSpell(world, hero);

    expect(hero[POSITION]).toEqual({ x: 20 + 1 - range, y: 1 });
  });

  it("holds the caster in place until the dash completes", () => {
    const area = `
|          |
| ♀        |
|          |
`;
    const { world, hero } = createSpellWorld(area, dash, { size: 30 });

    cast(world, "right");

    expect(hero[MOVABLE]).toBeUndefined();
    expect(hero[POSITION]).toEqual(findInArea(area, "♀"));

    waitForSpell(world, hero);

    expect(hero[MOVABLE]).toBeDefined();
  });

  it("passes through hostile units and hits each once", () => {
    const area = `
|          |
| ♀ D A    |
|          |
`;
    const { world, hero } = createSpellWorld(area, dash, {
      legend: { A: "dummy" },
      size: 30,
    });
    const units = [getUnit(world, area, "D"), getUnit(world, area, "A")];

    cast(world, "right");
    const hits = recordHits(world, units, 60);

    expect(hits).toEqual([[magic], [magic]]);
    expect(hero[POSITION]).toEqual({ x: 1 + range, y: 1 });
  });

  it("stops in front of a hostile unit at the end of its range", () => {
    const hero = { x: 1, y: 1 };
    const area = createArea(range + 4, 3, {
      "♀": hero,
      D: { x: hero.x + range, y: hero.y },
    });
    const { world, hero: caster } = createSpellWorld(area, dash, { size: 30 });
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const hits = recordHits(world, [dummy], 60);

    expect(caster[POSITION]).toEqual({ x: hero.x + range - 1, y: hero.y });
    expect(hits).toEqual([[]]);
  });

  it("stops in front of terrain", () => {
    const area = `
|          |
| ♀  █     |
|          |
`;
    const { world, hero } = createSpellWorld(area, dash, { size: 30 });

    cast(world, "right");
    waitForSpell(world, hero);

    expect(hero[POSITION]).toEqual({ x: 3, y: 1 });
  });

  it("stays in place when directly blocked", () => {
    const area = `
|          |
| ♀█       |
|          |
`;
    const { world, hero } = createSpellWorld(area, dash, { size: 30 });

    cast(world, "right");
    step(world, 30);

    expect(hero[POSITION]).toEqual({ x: 1, y: 1 });
    expect(hero[MOVABLE]).toBeDefined();
  });

  it("stops in front of friendly units without harming them", () => {
    const area = `
|          |
| ♀  N     |
|          |
`;
    const { world, hero } = createSpellWorld(area, dash, {
      legend: { N: "guide" },
      size: 30,
    });
    const guide = getUnit(world, area, "N");

    cast(world, "right");
    const hits = recordHits(world, [guide], 60);

    expect(hero[POSITION]).toEqual({ x: 3, y: 1 });
    expect(hits).toEqual([[]]);
  });

  it.each(materials)("deals the damage of a %s dash", (material) => {
    const area = `
|          |
| ♀ D      |
|          |
`;
    const item = { spell: "dash", material } as const;
    const { world } = createSpellWorld(area, item, { size: 30 });
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const hits = recordHits(world, [dummy], 60);

    expect(hits).toEqual([[getAbilityStats(item).magic]]);
  });
});
