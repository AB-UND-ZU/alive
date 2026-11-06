import { advanceUntil, giveItems, step, walk } from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { PLAYER } from "../../engine/components/player";
import { ClassKey } from "../../game/balancing/classes";
import { getLevelStats } from "../../engine/systems/leveling";
import { isDead } from "../../engine/systems/damage";
import { attackUntil, createCombatWorld, getUnit } from "./helpers";

// ♀ hero, U unit
const area = `
|         |
| ♀ U     |
|         |
`;

const setup = (classKey: ClassKey, legend: Record<string, string> = {}) => {
  const { world, hero } = createCombatWorld(area, legend);
  const unit = world.assertComponents(hero, [SPAWNABLE, PLAYER]);
  unit[SPAWNABLE].classKey = classKey;
  Object.assign(hero[STATS], getLevelStats(classKey, 1));
  hero[STATS].hp = hero[STATS].maxHp;
  hero[STATS].mp = hero[STATS].maxMp;
  return { world, hero };
};

describe("leveling", () => {
  it.each<[ClassKey, number, number]>([
    ["rogue", 1, 0],
    ["knight", 1, 0],
    ["mage", 0, 1],
  ])("raises a %s to level 2 with stat rewards", (classKey, hp, mp) => {
    const { world, hero } = setup(classKey);
    const { maxHp, maxMp } = hero[STATS];
    hero[STATS].xp = 12;

    advanceUntil(world, () => hero[STATS].maxXp === 15);
    step(world, 60);

    expect(hero[STATS]).toEqual(
      expect.objectContaining({
        level: 2,
        xp: 2,
        maxXp: 15,
        maxHp: maxHp + hp,
        maxMp: maxMp + mp,
        hp: maxHp + hp,
        mp: maxMp + mp,
      })
    );
    const { level, ...levelStats } = getLevelStats(classKey, 2);
    expect(hero[STATS]).toEqual(expect.objectContaining(levelStats));
  });

  it("doesn't level up before reaching max xp", () => {
    const { world, hero } = setup("knight");
    hero[STATS].xp = 9;

    step(world, 300);

    expect(hero[STATS].level).toBe(1);
  });

  it("never levels up a scout", () => {
    const { world, hero } = setup("scout");
    hero[STATS].xp = 99;

    step(world, 300);

    expect(hero[STATS].level).toBe(1);
  });

  it("stops at the last level", () => {
    const { world, hero } = setup("knight");
    Object.assign(hero[STATS], getLevelStats("knight", 10), { level: 10 });
    hero[STATS].xp = 99;

    step(world, 300);

    expect(hero[STATS].level).toBe(10);
    expect(hero[STATS].maxXp).toBe(Infinity);
  });

  it("caps max hp", () => {
    const { world, hero } = setup("knight");
    hero[STATS].maxHp = hero[STATS].maxHpCap;
    hero[STATS].xp = 10;

    advanceUntil(world, () => hero[STATS].level === 2);
    step(world, 60);

    expect(hero[STATS].maxHp).toBe(60);
  });

  it("adds up rewards of all previous levels", () => {
    expect(getLevelStats("knight", 4)).toEqual(
      expect.objectContaining({ maxHp: 35, maxMp: 6, maxXp: 30 })
    );
  });

  it("collects xp dropped by a defeated prism", () => {
    const { world, hero } = setup("knight", { U: "prism" });
    const prism = getUnit(world, area, "U");
    walk(world, "right");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => isDead(world, prism));
    advanceUntil(world, () => hero[STATS].xp === 1);
  });

  it("levels up after collecting enough xp from a defeated unit", () => {
    const { world, hero } = setup("knight", { U: "prism" });
    const prism = getUnit(world, area, "U");
    walk(world, "right");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);
    hero[STATS].xp = 9;

    attackUntil(world, "right", () => isDead(world, prism));
    advanceUntil(world, () => hero[STATS].level === 2);

    expect(hero[STATS].maxXp).toBe(15);
  });
});
