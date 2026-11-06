import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { rage } from "../../game/assets/ui";
import { advanceUntil, holdMove } from "../../testing/harness";
import {
  createCreatureWorld,
  distanceBetween,
  getCreature,
  getSpells,
  toughen,
  trace,
} from "./helpers";

const setup = (area: string) => {
  const { world, hero } = createCreatureWorld(area, { O: "orb" });
  toughen(hero);
  const orb = getCreature(world, "orb");
  return { world, hero, orb };
};

describe("orb", () => {
  it("charges with rage while facing the hero in a straight line", () => {
    const { world, orb } = setup(`
|♀      O|
`);

    advanceUntil(world, () => orb[TOOLTIP].idle === rage, 3000);

    expect(orb[ORIENTABLE].facing).toBe("left");
  });

  it("casts a beam after charging that hurts the hero", () => {
    const { world, hero, orb } = setup(`
|♀      O|
`);

    advanceUntil(world, () => getSpells(world, orb).length > 0, 3000);
    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 3000);
  });

  it("waits without casting while the standing hero is off its lines", () => {
    const { world, orb } = setup(`
|♀     |
|      |
|      |
|     O|
`);
    const start = { ...orb[POSITION] };

    const idles = trace(world, 8, () => orb[TOOLTIP].idle);

    expect(idles).not.toContain(rage);
    expect(getSpells(world, orb)).toHaveLength(0);
    expect(orb[POSITION]).toEqual(start);
  });

  it("aims ahead of a hero walking across its line", () => {
    const { world, hero, orb } = setup(`
|  ♀     |
|        |
|        |
|        |
|        |
|        |
|       O|
`);
    holdMove(world, ["down"]);

    advanceUntil(world, () => orb[TOOLTIP].idle === rage, 3000);

    expect(orb[ORIENTABLE].facing).toBe("left");
    expect(hero[POSITION].y).toBeLessThan(orb[POSITION].y);
  });

  it("retreats from a hero that comes too close", () => {
    const { world, hero, orb } = setup(`
|         |
|    ♀ O  |
|         |
`);
    const start = distanceBetween(world, orb[POSITION], hero[POSITION]);

    advanceUntil(
      world,
      () => distanceBetween(world, orb[POSITION], hero[POSITION]) > start,
      3000
    );
  });

  it("does not charge while the hero is beyond beam range", () => {
    const { world, orb } = setup(`
|♀           O|
`);

    const idles = trace(world, 6, () => orb[TOOLTIP].idle);

    expect(idles).not.toContain(rage);
  });
});
