import { createAreaWorld } from "../../testing/harness";
import { BELONGABLE } from "../../engine/components/belongable";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { STATS } from "../../engine/components/stats";
import { VIEWABLE } from "../../engine/components/viewable";
import { getLevelStats } from "../../engine/systems/leveling";
import { getDialog, say, setupHero } from "./helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const area = `
|     |
| ♀   |
|     |
`;

const setup = () => {
  const world = createAreaWorld(area);
  const hero = world.assertComponents(setupHero(world), [
    BELONGABLE,
    MOVABLE,
    PLAYER,
    SPAWNABLE,
    STATS,
    VIEWABLE,
  ]);
  return { world, hero };
};

describe("stat command", () => {
  it("shows the current value of a hero stat", () => {
    const { world, hero } = setup();
    hero[STATS].power = 4;

    say(world, "/stat power");

    expect(getDialog(hero)).toEqual(["power = 4"]);
  });

  it("sets a hero stat with the short command", () => {
    const { world, hero } = setup();

    say(world, "/s armor 7");

    expect(hero[STATS].armor).toBe(7);
    expect(getDialog(hero)).toEqual([]);
  });

  it("sets and shows the defeated count of a unit type", () => {
    const { world, hero } = setup();

    say(world, "/stat dummy");
    expect(getDialog(hero)).toEqual(["dummy = 0"]);

    say(world, "/stat dummy 3");
    expect(hero[PLAYER].defeatedUnits.dummy).toBe(3);

    say(world, "/stat dummy");
    expect(getDialog(hero)).toEqual(["dummy = 3"]);
  });

  it("sets and shows the view priority", () => {
    const { world, hero } = setup();

    say(world, "/stat view 5");
    expect(hero[VIEWABLE].priority).toBe(5);

    say(world, "/stat view");
    expect(getDialog(hero)).toEqual(["view = 5"]);
  });

  it.each([
    ["/stat luck", 'No stat "luck"!'],
    ["/stat hp lots", 'No amount "lots"!'],
    ["/stat", "/stat <type> [num]"],
  ])("rejects %s", (command, error) => {
    const { world, hero } = setup();
    const stats = { ...hero[STATS] };

    say(world, command);

    expect(getDialog(hero)).toEqual([error]);
    expect(hero[STATS]).toEqual(stats);
  });
});

describe("mod command", () => {
  it("switches between flying, swimming and walking", () => {
    const { world, hero } = setup();

    say(world, "/mod fly");
    expect(hero[MOVABLE]).toMatchObject({ flying: true, swimming: false });

    say(world, "/m swim");
    expect(hero[MOVABLE]).toMatchObject({ flying: false, swimming: true });

    say(world, "/mod walk");
    expect(hero[MOVABLE]).toMatchObject({ flying: false, swimming: false });
  });

  it("switches between fighting players and only enemies", () => {
    const { world, hero } = setup();

    say(world, "/mod pvp");
    expect(hero[BELONGABLE].faction).toBe("hostile");

    say(world, "/mod pve");
    expect(hero[BELONGABLE].faction).toBe("settler");
  });

  it("maxes out stats in god mode and resets them to the class", () => {
    const { world, hero } = setup();
    const classStats = getLevelStats(
      hero[SPAWNABLE].classKey,
      hero[STATS].level
    );

    say(world, "/mod god");
    expect(hero[STATS]).toMatchObject({
      hp: 99,
      maxHp: 99,
      mp: 99,
      maxMp: 99,
      maxXp: Infinity,
      power: 99,
      armor: 99,
    });

    say(world, "/mod reset");
    expect(hero[STATS]).toMatchObject({
      hp: classStats.maxHp,
      maxHp: classStats.maxHp,
      mp: classStats.maxMp,
      xp: 0,
      maxXp: classStats.maxXp,
      power: classStats.power,
      armor: classStats.armor,
    });
  });

  it("rejects an unknown mod", () => {
    const { world, hero } = setup();

    say(world, "/mod ghost");

    expect(getDialog(hero)).toEqual(['No mod "ghost"!']);
    expect(hero[MOVABLE].flying).toBeFalsy();
  });
});
