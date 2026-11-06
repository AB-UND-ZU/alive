import { materials } from "../../engine/components/item";
import { STATS } from "../../engine/components/stats";
import { getAbilityStats } from "../../game/balancing/abilities";
import {
  cast,
  createArea,
  createSpellWorld,
  getUnit,
  recordHits,
} from "./helpers";

const wave = { spell: "wave", material: "wood" } as const;
const { magic, range } = getAbilityStats(wave);
const waveFrames = 120;

describe("wave spell", () => {
  it("hits hostile units around the caster in every direction", () => {
    const area = `
|         |
|    A    |
|         |
|         |
|B   ♀   C|
|         |
|      E  |
|         |
|         |
`;
    const legend = { A: "dummy", B: "dummy", C: "dummy", E: "dummy" };
    const { world } = createSpellWorld(area, wave, { legend, size: 20 });
    const units = ["A", "B", "C", "E"].map((char) =>
      getUnit(world, area, char)
    );

    cast(world, "up");
    const hits = recordHits(world, units, waveFrames);

    expect(hits).toEqual([[magic], [magic], [magic], [magic]]);
  });

  it("reaches units within its range and spares units beyond", () => {
    const hero = { x: 1, y: 1 };
    const area = createArea(range + 4, range + 4, {
      "♀": hero,
      A: { x: hero.x + range - 1, y: hero.y },
      B: { x: hero.x + range + 1, y: hero.y },
      C: { x: hero.x + 3, y: hero.y + range - 4 },
      E: { x: hero.x + 4, y: hero.y + range - 3 },
    });
    const legend = { A: "dummy", B: "dummy", C: "dummy", E: "dummy" };
    const { world } = createSpellWorld(area, wave, { legend, size: 30 });
    const units = ["A", "B", "C", "E"].map((char) =>
      getUnit(world, area, char)
    );

    cast(world, "right");
    const hits = recordHits(world, units, waveFrames);

    expect(hits).toEqual([[magic], [], [magic], []]);
  });

  it("reaches near units before distant ones", () => {
    const area = `
|            |
| ♀ D  E     |
|            |
`;
    const { world } = createSpellWorld(area, wave, {
      legend: { E: "dummy" },
      size: 20,
    });
    const near = getUnit(world, area, "D");
    const far = getUnit(world, area, "E");

    cast(world, "right");
    const hits = recordHits(world, [near, far], 25);

    expect(hits).toEqual([[magic], []]);
    expect(recordHits(world, [near, far], waveFrames)).toEqual([[], [magic]]);
  });

  it("hits each unit only once per cast", () => {
    const area = `
|       |
| ♀D    |
|       |
`;
    const { world } = createSpellWorld(area, wave, { size: 20 });
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const hits = recordHits(world, [dummy], waveFrames);

    expect(hits).toEqual([[magic]]);
    expect(dummy[STATS].hp).toBe(dummy[STATS].maxHp - magic);
  });

  it("does not harm the caster or friendly units", () => {
    const area = `
|       |
| ♀ N D |
|       |
`;
    const { world, hero } = createSpellWorld(area, wave, {
      legend: { N: "guide" },
      size: 20,
    });
    const guide = getUnit(world, area, "N");
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const hits = recordHits(world, [hero, guide, dummy], waveFrames);

    expect(hits).toEqual([[], [], [magic]]);
  });

  it.each(materials)("deals the damage of a %s wave", (material) => {
    const area = `
|       |
| ♀ D   |
|       |
`;
    const item = { spell: "wave", material } as const;
    const { world } = createSpellWorld(area, item, { size: 20 });
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const hits = recordHits(world, [dummy], waveFrames);

    expect(hits).toEqual([[getAbilityStats(item).magic]]);
  });
});
