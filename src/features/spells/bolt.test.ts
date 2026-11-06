import { NPC } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { advanceUntil } from "../../testing/harness";
import { getAbilityStats } from "../../game/balancing/abilities";
import {
  castAs,
  createArea,
  createSpellWorld,
  getUnit,
  recordHits,
} from "./helpers";

// bolts are only cast by units, e.g. violets and oak towers
const bolt = { spell: "bolt", material: "wood" } as const;
const { magic, range } = getAbilityStats(bolt, "violet");
const boltFrames = 60;

// keep the hero out of the violet's sight
const createBoltWorld = (area: string) =>
  createSpellWorld(area, undefined, {
    legend: { V: "violet", A: "dummy", R: "rose", T: "oakTower" },
    size: 30,
  });

describe("bolt spell", () => {
  it("flies in the facing direction and hits the first hostile unit", () => {
    const area = `
|                  ♀|
|  V  D  A          |
|                   |
|  A                |
`;
    const { world } = createBoltWorld(area);
    const units = [getUnit(world, area, "D"), getUnit(world, area, "A")];
    const below = world
      .getEntities([NPC, STATS, POSITION])
      .find((unit) => unit[POSITION].x === 2 && unit[POSITION].y === 3)!;

    castAs(world, getUnit(world, area, "V"), bolt, "right");
    const hits = recordHits(world, [...units, below], boltFrames);

    expect(hits).toEqual([[magic], [], []]);
  });

  it("reaches distant units later than near ones", () => {
    const frames = [1, range].map((distance) => {
      const area = createArea(range + 4, 5, {
        V: { x: 1, y: 1 },
        A: { x: 1 + distance, y: 1 },
        "♀": { x: range + 3, y: 4 },
      });
      const { world } = createBoltWorld(area);
      const dummy = getUnit(world, area, "A");
      castAs(world, getUnit(world, area, "V"), bolt, "right");
      return advanceUntil(world, () => dummy[STATS].hp < dummy[STATS].maxHp);
    });

    expect(frames[0]).toBeLessThan(frames[1]);
  });

  it("reaches units at its range and spares units beyond", () => {
    const violet = { x: 1, y: 1 };
    const marks = {
      V: violet,
      A: { x: violet.x + range, y: violet.y },
      "♀": { x: range + 3, y: 4 },
    };
    const inRange = createArea(range + 4, 5, marks);
    const beyond = createArea(range + 4, 5, {
      ...marks,
      A: { x: violet.x + range + 1, y: violet.y },
    });

    const hits = [inRange, beyond].map((area) => {
      const { world } = createBoltWorld(area);
      castAs(world, getUnit(world, area, "V"), bolt, "right");
      return recordHits(world, [getUnit(world, area, "A")], boltFrames)[0];
    });

    expect(hits).toEqual([[magic], []]);
  });

  it("passes friendly units and hits the hostile unit behind", () => {
    const area = `
|                  ♀|
|  V R A            |
|                   |
`;
    const { world } = createBoltWorld(area);
    const units = [getUnit(world, area, "R"), getUnit(world, area, "A")];

    castAs(world, getUnit(world, area, "V"), bolt, "right");
    const hits = recordHits(world, units, boltFrames);

    expect(hits).toEqual([[], [magic]]);
  });

  it("does not cost a hostile caster mana", () => {
    const area = `
|                  ♀|
|  V  D             |
|                   |
`;
    const { world } = createBoltWorld(area);
    const violet = getUnit(world, area, "V");
    const mp = violet[STATS].mp;

    castAs(world, violet, bolt, "right");

    expect(violet[STATS].mp).toBe(mp);
  });

  it("heals allied units when cast as an earth bolt by an oak tower", () => {
    const area = `
|                  ♀|
|  T  D             |
|                   |
`;
    const { world } = createBoltWorld(area);
    const tower = getUnit(world, area, "T");
    const dummy = getUnit(world, area, "D");
    const healBolt = { spell: "bolt", element: "earth" } as const;
    dummy[STATS].hp = 10;

    castAs(world, tower, healBolt, "right");
    recordHits(world, [dummy], boltFrames);

    expect(dummy[STATS].hp).toBe(
      10 + getAbilityStats(healBolt, "oakTower").heal
    );
  });
});
