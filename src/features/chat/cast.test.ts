import {
  advanceUntil,
  createAreaWorld,
  face,
  findEntityAt,
  findInArea,
} from "../../testing/harness";
import { CASTABLE } from "../../engine/components/castable";
import { NPC } from "../../engine/components/npc";
import { STATS } from "../../engine/components/stats";
import { getDialog, say, setupHero } from "./helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const area = `
|       |
| ♀ D   |
|       |
`;

const setup = () => {
  const world = createAreaWorld(area, { legend: { D: "dummy" }, size: 10 });
  const hero = setupHero(world);
  const dummy = findEntityAt(world, findInArea(area, "D"), [NPC, STATS])!;
  face(world, "right");
  return { world, hero, dummy };
};

describe("cast command", () => {
  it.each(["/cast beam", "/c beam iron fire", "/cast wand"])(
    "%s hits a unit in the facing direction without an item or mana",
    (command) => {
      const { world, hero, dummy } = setup();
      const hp = dummy[STATS].hp;
      hero[STATS].mp = 0;

      say(world, command);

      expect(getDialog(hero)).toEqual([]);
      advanceUntil(world, () => dummy[STATS].hp < hp, 3000);
    }
  );

  it.each([
    ["/cast nothing", 'No item "nothing"!'],
    ["/cast sword", 'Can\'t cast "sword"!'],
    ["/cast zap", 'Can\'t cast "zap"!'],
    ["/cast block", 'Can\'t cast "block"!'],
    ["/cast beam paper", 'No material "paper"!'],
    ["/cast beam iron ice", 'No element "ice"!'],
    ["/cast", "/cast <item> [mat] [ele]"],
  ])("rejects %s", (command, error) => {
    const { world, hero } = setup();

    say(world, command);

    expect(getDialog(hero)).toEqual([error]);
    expect(world.getEntities([CASTABLE]).length).toBe(
      world.getEntities([CASTABLE, NPC]).length
    );
  });
});
