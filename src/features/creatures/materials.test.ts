import { NpcType } from "../../engine/components/npc";
import { ORIENTABLE } from "../../engine/components/orientable";
import { STATS } from "../../engine/components/stats";
import { advanceUntil, holdMove } from "../../testing/harness";
import { isDead } from "../../engine/systems/damage";
import {
  countDrops,
  createCreatureWorld,
  distanceBetween,
  getCreature,
  giveSword,
  toughen,
  trace,
} from "./helpers";
import { POSITION } from "../../engine/components/position";

const fightPrism = (type: NpcType) => {
  const { world, hero } = createCreatureWorld(
    `
|█████|
|█♀ M█|
|█████|
`,
    { M: type }
  );
  toughen(hero);
  giveSword(world, hero);
  const prism = getCreature(world, type);
  prism[ORIENTABLE].facing = "left";

  holdMove(world, ["right"]);
  const frames = advanceUntil(world, () => isDead(world, prism), 20000);
  holdMove(world, []);
  return { world, hero, frames };
};

const firstBeamDamage = (type: NpcType) => {
  const { world, hero } = createCreatureWorld(
    `
|♀      M|
`,
    { M: type }
  );
  toughen(hero);
  advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 5000);
  return hero[STATS].maxHp - hero[STATS].hp;
};

describe("material variants", () => {
  it("takes longer to defeat a prism at each material tier", () => {
    const iron = fightPrism("prism");
    const gold = fightPrism("goldPrism");
    const diamond = fightPrism("diamondPrism");

    expect(gold.frames).toBeGreaterThan(iron.frames);
    expect(diamond.frames).toBeGreaterThan(gold.frames);
  });

  it("rewards a gold prism with three coins and two xp", () => {
    const { world } = fightPrism("goldPrism");

    advanceUntil(world, () => countDrops(world, { stat: "xp" }) > 0);

    expect(countDrops(world, { stackable: "coin" })).toBe(3);
    expect(countDrops(world, { stat: "xp" })).toBe(2);
  });

  it("hits for five damage with a diamond orb beam", () => {
    expect(firstBeamDamage("diamondOrb")).toBe(5);
  });

  it.each(["goldEye", "diamondEye"] as const)(
    "lets %s chase the hero",
    (type) => {
      const { world, hero } = createCreatureWorld(
        `
|♀    E|
`,
        { E: type }
      );
      toughen(hero);
      const eye = getCreature(world, type);
      const distances = trace(world, 4, () =>
        distanceBetween(world, eye[POSITION], hero[POSITION])
      );

      expect(distances[distances.length - 1]).toBeLessThan(distances[0]);
    }
  );
});
