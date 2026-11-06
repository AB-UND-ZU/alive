import { STATS } from "../../engine/components/stats";
import { getAbilityStats } from "../../game/balancing/abilities";
import { getEntityStats } from "../../engine/systems/damage";
import { getIdentifier } from "../../engine/utils";
import { TypedEntity } from "../../engine/entities";
import { World } from "../../engine";
import { castAs, createSpellWorld, getUnit, recordHits } from "./helpers";

// blasts are only cast by the oak boss
const blast = { spell: "blast", material: "gold" } as const;
const { magic } = getAbilityStats(blast, "oakBoss");
const blastFrames = 150;

const createBlastWorld = (area: string) => {
  const { world } = createSpellWorld(area, undefined, {
    legend: { A: "dummy", B: "dummy", C: "dummy", E: "dummy", R: "rose" },
    size: 30,
  });
  const boss = getIdentifier(world, "oak_boss") as TypedEntity<"POSITION">;
  return { world, boss };
};

const getUnits = (world: World, area: string, chars: string) =>
  chars.split("").map((char) => getUnit(world, area, char));

describe("blast spell", () => {
  it("sweeps a band three cells wide in the facing direction", () => {
    const area = `
|                    |
|  E      O          |
|                    |
|                    |
|                    |
|         D          |
|        A  C        |
|          B         |
|                    |
|                  ♀ |
`;
    const { world, boss } = createBlastWorld(area);
    const units = getUnits(world, area, "DABCE");
    const damage = magic - getEntityStats(world, units[0]).resist;

    castAs(world, boss, blast, "down");
    const hits = recordHits(world, units, blastFrames);

    expect(hits[0][0]).toBe(damage);
    expect(hits[1][0]).toBe(damage);
    expect(hits[2][0]).toBe(damage);
    expect(hits[3]).toEqual([]);
    expect(hits[4]).toEqual([]);
  });

  it("hits units repeatedly while it passes over them", () => {
    const area = `
|                    |
|         O          |
|                    |
|                    |
|                    |
|                    |
|         D          |
|                    |
|                  ♀ |
`;
    const { world, boss } = createBlastWorld(area);
    const dummy = getUnit(world, area, "D");

    castAs(world, boss, blast, "down");
    const [hits] = recordHits(world, [dummy], blastFrames);

    expect(hits.length).toBeGreaterThan(1);
    hits.forEach((hit) => expect(hit).toBe(magic));
  });

  it("spares units allied with the caster", () => {
    const area = `
|                    |
|         O          |
|                    |
|                    |
|                    |
|                    |
|         R          |
|                    |
|                  ♀ |
`;
    const { world, boss } = createBlastWorld(area);
    const rose = getUnit(world, area, "R");

    castAs(world, boss, blast, "down");

    expect(recordHits(world, [rose], blastFrames)).toEqual([[]]);
    expect(rose[STATS].hp).toBe(rose[STATS].maxHp);
  });
});
