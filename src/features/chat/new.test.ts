import {
  createAreaWorld,
  face,
  findEntityAt,
  getEntitiesAt,
  holdMove,
  step,
} from "../../testing/harness";
import { LEVEL } from "../../engine/components/level";
import { NPC } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { getDialog, say, setupHero } from "./helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const area = `
| █     |
| ♀     |
|       |
|       |
`;

const setup = () => {
  const world = createAreaWorld(area, { size: 8 });
  return { world, hero: setupHero(world) };
};

const getCell = (
  world: ReturnType<typeof setup>["world"],
  x: number,
  y: number
) => world.metadata.gameEntity[LEVEL].cells[x][y];

describe("new command", () => {
  it("builds a row of cells in a direction", () => {
    const { world, hero } = setup();

    say(world, "/new rock 2 right");

    expect(getCell(world, 2, 1)).toBe("rock");
    expect(getCell(world, 3, 1)).toBe("rock");
    expect(getCell(world, 4, 1)).toBe("air");
    expect(getEntitiesAt(world, { x: 2, y: 1 })).not.toEqual([]);

    holdMove(world, ["right"]);
    step(world, 30);
    expect(hero[POSITION]).toEqual({ x: 1, y: 1 });
  });

  it("spawns a unit in the facing direction", () => {
    const { world } = setup();
    face(world, "down");

    say(world, "/n dummy");

    expect(findEntityAt(world, { x: 1, y: 2 }, [NPC])?.[NPC].type).toBe(
      "dummy"
    );
  });

  it("turns water into deep water", () => {
    const { world } = setup();

    say(world, "/new water 1 left");

    expect(getCell(world, 0, 1)).toBe("water_deep");
  });

  it("clears the facing cell", () => {
    const { world, hero } = setup();
    face(world, "up");

    say(world, "/new");

    expect(getCell(world, 1, 0)).toBe("air");
    expect(getEntitiesAt(world, { x: 1, y: 0 })).toEqual([]);
    expect(getEntitiesAt(world, hero[POSITION])).toContain(hero);
  });

  it.each([
    ["/new lava", 'No cell "lava"!'],
    ["/new rock many", 'No number "many"!'],
    ["/new rock 1 right more", "/new [cell] [num] [dir]"],
  ])("rejects %s", (command, error) => {
    const { world, hero } = setup();

    say(world, command);

    expect(getDialog(hero)).toEqual([error]);
    expect(getCell(world, 2, 1)).toBe("air");
  });

  it("rejects an unknown direction", () => {
    const { world, hero } = setup();

    say(world, "/new rock 1 sideways");

    expect(getDialog(hero)[0]).toMatch(/^No direction /);
    expect(getCell(world, 1, 2)).toBe("air");
  });
});
