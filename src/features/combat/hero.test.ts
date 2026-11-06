import { advanceUntil, giveItems, holdMove, step } from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { MOVABLE } from "../../engine/components/movable";
import { isDead } from "../../engine/systems/damage";
import { createCombatWorld, getUnit } from "./helpers";

// ♀ hero, U prism facing the hero
const area = `
|     |
|♀U   |
|     |
`;

const setup = (hp = 10) => {
  const { world, hero } = createCombatWorld(area, { U: "prism" }, hp);
  const prism = world.assertComponents(getUnit(world, area, "U"), [
    MOVABLE,
    STATS,
  ]);
  prism[MOVABLE].orientations = ["left"];
  return { world, hero, prism };
};

describe("hero taking damage", () => {
  it("loses hp when hit by a prism", () => {
    const { world, hero } = setup();

    advanceUntil(world, () => hero[STATS].hp < 10);

    expect(hero[STATS].hp).toBe(9);
    expect(hero[PLAYER].receivedStats.melee).toBe(1);
  });

  it("takes reduced damage with a shield", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { offhand: "shield", material: "iron", amount: 1 },
    ]);

    advanceUntil(world, () => hero[STATS].hp < 10);

    expect(hero[STATS].hp).toBeCloseTo(10 - 1 / 3);
  });

  it("dies when hp reaches zero", () => {
    const { world, hero } = setup(2);

    advanceUntil(world, () => isDead(world, hero));

    expect(hero[STATS].hp).toBe(0);
    expect(hero[PLAYER].receivedStats.melee).toBe(2);
  });

  it("can't attack once dead", () => {
    const { world, hero, prism } = setup(1);
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);
    prism[STATS].hp = prism[STATS].maxHp = 50;

    advanceUntil(world, () => isDead(world, hero));
    const hp = prism[STATS].hp;
    holdMove(world, ["right"]);
    step(world, 30);

    expect(prism[STATS].hp).toBe(hp);
  });
});
