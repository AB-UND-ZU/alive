import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { advanceUntil, face, giveItems, trigger } from "../../testing/harness";
import {
  attackUntilDead,
  countDrops,
  createCreatureWorld,
  distanceBetween,
  getCreature,
  giveSword,
  toughen,
  trace,
} from "./helpers";

const setup = (area: string) => {
  const { world, hero } = createCreatureWorld(area, { F: "fairy" });
  toughen(hero);
  const fairy = getCreature(world, "fairy");
  return { world, hero, fairy };
};

describe("fairy", () => {
  it("flies away from an approaching hero", () => {
    const { world, hero, fairy } = setup(`
|          |
|♀   F     |
|          |
`);
    const start = distanceBetween(world, fairy[POSITION], hero[POSITION]);

    advanceUntil(
      world,
      () => distanceBetween(world, fairy[POSITION], hero[POSITION]) > start + 2,
      5000
    );
  });

  it("hovers in place while the hero is far away", () => {
    const { world, fairy } = setup(`
|♀              F|
`);
    const start = { ...fairy[POSITION] };

    trace(world, 6, () => null);

    expect(fairy[POSITION]).toEqual(start);
  });

  it("dodges an arrow flying towards it", () => {
    const { world, hero, fairy } = setup(`
|            |
|            |
|♀          F|
|            |
|            |
`);
    giveItems(world, hero, [
      { skill: "bow", material: "wood", amount: 1 },
      { stackable: "arrow", amount: 10 },
    ]);
    const row = fairy[POSITION].y;
    face(world, "right");
    trigger(world, "skill");

    advanceUntil(world, () => fairy[POSITION].y !== row, 3000);

    expect(fairy[STATS].hp).toBe(fairy[STATS].maxHp);
  });

  it("drops air wood when caught and defeated", () => {
    const { world, hero, fairy } = setup(`
|███|
|♀F█|
|███|
`);
    giveSword(world, hero);

    attackUntilDead(world, fairy, "right");
    advanceUntil(
      world,
      () => countDrops(world, { stackable: "resource", element: "air" }) > 0
    );

    expect(countDrops(world, { stat: "xp" })).toBe(3);
  });
});
