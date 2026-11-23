import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import { POSITION } from "../../engine/components/position";
import { setMovementOrientations } from "../../engine/systems/movement";
import { getAbilityStats } from "../../game/balancing/abilities";
import { advanceUntil, FRAME, step } from "../../testing/harness";
import {
  cast,
  castAs,
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

  it("keeps the hero frozen for a movement tick after arriving", () => {
    const area = createArea(range + 4, 3, { "♀": { x: 1, y: 1 } });
    const { world, hero } = createSpellWorld(area, dash, { size: 30 });
    const tick = world.assertByIdAndComponents(hero[MOVABLE]!.reference, [
      REFERENCE,
    ])[REFERENCE].tick;
    const start = world.metadata.elapsed;
    castAs(world, hero, dash, "right");
    advanceUntil(world, () => hero[POSITION].x === 1 + range);
    expect(hero[MOVABLE]).toBeUndefined();
    const release = (Math.ceil(500 / tick) + 1) * tick;
    setMovementOrientations(world, hero, ["down"]);
    advanceUntil(world, () => !!hero[MOVABLE]);
    expect(hero[POSITION]).toEqual({ x: 1 + range, y: 1 });
    const elapsed = world.metadata.elapsed - start;
    expect(elapsed).toBeGreaterThanOrEqual(release);
    expect(elapsed).toBeLessThan(release + FRAME + 1);
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

  it.each([
    { material: "wood", damage: 3 },
    { material: "iron", damage: 6 },
    { material: "gold", damage: 9 },
    { material: "diamond", damage: 12 },
    { material: "ruby", damage: 15 },
  ] as const)(
    "deals $damage damage with a $material dash",
    ({ material, damage }) => {
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

      expect(hits).toEqual([[damage]]);
    }
  );
});
