import { materials } from "../../engine/components/item";
import { getAbilityStats } from "../../game/balancing/abilities";
import {
  cast,
  createArea,
  createSpellWorld,
  getUnit,
  recordHits,
} from "./helpers";

const beam = { spell: "beam", material: "wood" } as const;
const { magic, range } = getAbilityStats(beam);
const beamFrames = 120;

describe("beam spell", () => {
  it("hits hostile units in a line in the facing direction only", () => {
    const area = `
|        |
|   A    |
| B ♀ C E|
|   F    |
|        |
`;
    const legend = {
      A: "dummy",
      B: "dummy",
      C: "dummy",
      E: "dummy",
      F: "dummy",
    };
    const { world } = createSpellWorld(area, beam, { legend, size: 30 });
    const [up, left, right, farRight, down] = ["A", "B", "C", "E", "F"].map(
      (char) => getUnit(world, area, char)
    );

    cast(world, "right");
    const hits = recordHits(world, [up, left, right, farRight, down], 30);

    expect(hits[0]).toEqual([]);
    expect(hits[1]).toEqual([]);
    expect(hits[2]).toContain(magic);
    expect(hits[3]).toContain(magic);
    expect(hits[4]).toEqual([]);
  });

  it("reaches units at its range and spares units beyond", () => {
    const hero = { x: 1, y: 1 };
    const area = createArea(range + 4, 3, {
      "♀": hero,
      A: { x: hero.x + range, y: hero.y },
      B: { x: hero.x + range + 1, y: hero.y },
    });
    const { world } = createSpellWorld(area, beam, {
      legend: { A: "dummy", B: "dummy" },
      size: 40,
    });
    const inRange = getUnit(world, area, "A");
    const beyond = getUnit(world, area, "B");

    cast(world, "right");
    const hits = recordHits(world, [inRange, beyond], beamFrames);

    expect(hits[0].length).toBeGreaterThan(0);
    expect(hits[1]).toEqual([]);
  });

  it("hits units repeatedly while they stay in the beam", () => {
    const area = `
|       |
| ♀ D   |
|       |
`;
    const { world } = createSpellWorld(area, beam, { size: 30 });
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const [hits] = recordHits(world, [dummy], beamFrames);

    expect(hits.length).toBeGreaterThan(1);
    hits.forEach((hit) => expect(hit).toBe(magic));
  });

  it("stops hitting once the beam has ended", () => {
    const area = `
|       |
| ♀ D   |
|       |
`;
    const { world } = createSpellWorld(area, beam, { size: 30 });
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    recordHits(world, [dummy], beamFrames);

    expect(recordHits(world, [dummy], 60)).toEqual([[]]);
  });

  it("does not harm friendly units in its line", () => {
    const area = `
|       |
| ♀ N D |
|       |
`;
    const { world } = createSpellWorld(area, beam, {
      legend: { N: "guide" },
      size: 30,
    });
    const guide = getUnit(world, area, "N");
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const hits = recordHits(world, [guide, dummy], beamFrames);

    expect(hits[0]).toEqual([]);
    expect(hits[1].length).toBeGreaterThan(0);
  });

  it.each(materials)("deals the damage of a %s beam per hit", (material) => {
    const area = `
|       |
| ♀ D   |
|       |
`;
    const item = { spell: "beam", material } as const;
    const { world } = createSpellWorld(area, item, { size: 30 });
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const [hits] = recordHits(world, [dummy], 30);

    expect(hits[0]).toBe(getAbilityStats(item).magic);
  });
});
