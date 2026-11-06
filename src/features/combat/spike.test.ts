import { giveItems, holdMove, step, walk } from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { POSITION } from "../../engine/components/position";
import { isDead } from "../../engine/systems/damage";
import { attackUntil, createCombatWorld, getUnit } from "./helpers";

// ♀ hero, U spiked unit
const area = `
|         |
| ♀ U     |
|         |
`;

const setup = (unit: string, hp = 10) => {
  const { world, hero } = createCombatWorld(area, { U: unit }, hp);
  walk(world, "right");
  return { world, hero, unit: getUnit(world, area, "U") };
};

describe("spikes", () => {
  it("sting the hero walking into a cactus", () => {
    const { world, hero, unit } = setup("cactus");

    attackUntil(world, "right", () => hero[STATS].hp < 10);

    expect(hero[STATS].hp).toBe(10 - unit[STATS].spike);
    expect(hero[POSITION]).toEqual({ x: 2, y: 1 });
    expect(unit[STATS].hp).toBe(10);
  });

  it("are reduced by the hero's resist", () => {
    const { world, hero, unit } = setup("cactus");
    hero[STATS].resist = 1;

    attackUntil(world, "right", () => hero[STATS].hp < 10);

    expect(hero[STATS].hp).toBe(11 - unit[STATS].spike);
  });

  it("sting on every sword hit against a cactus", () => {
    const { world, hero, unit } = setup("cactus", 20);
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => unit[STATS].hp < 10);

    expect(unit[STATS].hp).toBe(10 - (4 - unit[STATS].armor));
    expect(hero[STATS].hp).toBe(20 - unit[STATS].spike);
  });

  it("sting attackers of a barrier", () => {
    const { world, hero, unit } = setup("barrier");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => unit[STATS].hp < 50);

    expect(unit[STATS].hp).toBe(49);
    expect(hero[STATS].hp).toBe(9);
  });

  it("kill an attacker with 1 hp before the sword hits", () => {
    const { world, hero, unit } = setup("cactus", 1);
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    holdMove(world, ["right"]);
    step(world, 30);

    expect(isDead(world, hero)).toBe(true);
    expect(unit[STATS].hp).toBe(10);
  });

  it("stop once the cactus is destroyed", () => {
    const { world, hero, unit } = setup("cactus", 20);
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => isDead(world, unit));
    const hp = hero[STATS].hp;
    holdMove(world, ["right"]);
    step(world, 60);

    expect(hero[STATS].hp).toBe(hp);
  });
});
