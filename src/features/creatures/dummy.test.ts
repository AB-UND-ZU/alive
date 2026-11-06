import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { advanceUntil, holdMove } from "../../testing/harness";
import {
  advanceTicks,
  attackUntilDead,
  countDrops,
  createCreatureWorld,
  getCreature,
  giveSword,
  toughen,
} from "./helpers";

const setup = () => {
  const { world, hero } = createCreatureWorld(`
|♀Ω  |
`);
  toughen(hero);
  giveSword(world, hero);
  const dummy = getCreature(world, "dummy");
  return { world, hero, dummy };
};

describe("training dummy", () => {
  it("stands still and never fights back", () => {
    const { world, hero, dummy } = setup();
    holdMove(world, ["right"]);

    advanceUntil(world, () => dummy[STATS].hp < dummy[STATS].maxHp, 3000);
    holdMove(world, []);
    advanceTicks(world, 4);

    expect(dummy[POSITION]).toEqual({ x: 1, y: 0 });
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  });

  it("waits a while after a hit before it regenerates to full health", () => {
    const { world, dummy } = setup();
    holdMove(world, ["right"]);
    advanceUntil(world, () => dummy[STATS].hp < dummy[STATS].maxHp, 3000);
    holdMove(world, []);
    const hp = dummy[STATS].hp;

    advanceTicks(world, 8);
    expect(dummy[STATS].hp).toBe(hp);

    advanceUntil(world, () => dummy[STATS].hp === dummy[STATS].maxHp, 15000);
  });

  it("drops a coin and xp when destroyed", () => {
    const { world, dummy } = setup();

    attackUntilDead(world, dummy, "right");
    advanceUntil(world, () => countDrops(world, { stackable: "coin" }) > 0);

    expect(countDrops(world, { stackable: "coin" })).toBe(1);
    expect(countDrops(world, { stat: "xp" })).toBe(1);
  });
});
