import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  findInArea,
  findEntityAt,
  FRAME,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { LOCKABLE } from "../components/lockable";
import { openDoor } from "./trigger";
import { MOVABLE } from "../components/movable";
import { POSITION } from "../components/position";
import { REFERENCE } from "../components/reference";
import { getEntityStats } from "./damage";
import { getHasteInterval } from "./movement";
import { getCellEntities } from "./map";

// ♀ hero, █ mountain, ≈ deep water, ~ shallow water, " " air
const openArea = `
|       |
|       |
|   ♀   |
|       |
|       |
`;

const wallArea = `
|         |
| ♀   █   |
|         |
`;

const lakeArea = `
|  ~≈≈≈≈ |
|  ~≈≈≈≈ |
| ♀~≈≈≈≈ |
|  ~≈≈≈≈ |
|  ~≈≈≈≈ |
`;

describe("movement", () => {
  it("moves the hero one cell per haste interval while holding a direction", () => {
    const world = createAreaWorld(openArea);
    const hero = assertHero(world);
    const interval = getHasteInterval(world, getEntityStats(world, hero).haste);
    const start = findInArea(openArea, "♀");

    holdMove(world, ["down"]);
    const first = advanceUntil(world, () => hero[POSITION].y !== start.y);
    expect(first).toBe(Math.ceil(interval / FRAME));

    // subsequent steps are paced by the same interval
    advance(world, interval);
    holdMove(world, []);

    expect(hero[POSITION]).toEqual({ x: start.x, y: start.y + 2 });
    expect(getCellEntities(world, hero[POSITION])).toContain(hero);
    expect(getCellEntities(world, start)).not.toContain(hero);
  });

  it("stops on release and suspends the hero reference frame", () => {
    const world = createAreaWorld(openArea);
    const hero = assertHero(world);
    const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
      REFERENCE,
    ])[REFERENCE];

    walk(world, "right", 2);
    const stopped = { ...hero[POSITION] };
    advance(world, 2000);

    expect(hero[POSITION]).toEqual(stopped);
    expect(reference.suspended).toBe(true);
  });

  it.each(["wood_door", "wood_entry", "entry"])(
    "continues through an opened %s after releasing movement",
    (cell) => {
      const world = createAreaWorld(
        `
|         |
|  ♀D     |
|         |
`,
        { legend: { D: cell } }
      );
      const hero = assertHero(world);
      const door = findEntityAt(world, { x: 3, y: 1 }, [LOCKABLE])!;
      openDoor(world, door);

      holdMove(world, ["right"]);
      advanceUntil(world, () => hero[POSITION].x === 3);
      holdMove(world, []);
      advance(world, 1200);

      expect(hero[POSITION]).toEqual({ x: 4, y: 1 });
      expect(hero[MOVABLE].momentum).toBeUndefined();
      const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
        REFERENCE,
      ])[REFERENCE];
      expect(reference.suspended).toBe(true);
    }
  );

  it.each([
    ["%%% ", 6],
    ["%%%█", 5],
  ])(
    "continues over ice %s after release and stops at the next obstacle or solid ground",
    (terrain, x) => {
      const world = createAreaWorld(`
|           |
|  ♀${terrain}    |
|           |
`);
      const hero = assertHero(world);
      holdMove(world, ["right"]);
      advanceUntil(world, () => hero[POSITION].x === 3);
      holdMove(world, []);
      advance(world, 2000);

      expect(hero[POSITION]).toEqual({ x, y: 1 });
      expect(hero[MOVABLE].momentum).toBeUndefined();
      expect(hero[MOVABLE].orientations).toEqual([]);
    }
  );

  it("wraps around the edges of the map", () => {
    const world = createAreaWorld(openArea);
    const hero = assertHero(world);

    // 7 wide map: 3 -> 2 -> 1 -> 0 -> 6
    walk(world, "left", 4);

    expect(hero[POSITION]).toEqual({ x: 6, y: 2 });
  });

  it("is blocked by collidable entities", () => {
    const world = createAreaWorld(wallArea);
    const hero = assertHero(world);

    walk(world, "right", 3);
    expect(hero[POSITION]).toEqual({ x: 4, y: 1 });

    holdMove(world, ["right"]);
    step(world, 60);
    holdMove(world, []);

    expect(hero[POSITION]).toEqual({ x: 4, y: 1 });
  });

  it("wades through shallow water but not into deep water", () => {
    const world = createAreaWorld(lakeArea);
    const hero = assertHero(world);

    walk(world, "right");
    expect(hero[POSITION]).toEqual({ x: 2, y: 2 });

    // deep water is only impassable when surrounded by water
    holdMove(world, ["right"]);
    step(world, 60);
    holdMove(world, []);

    expect(hero[POSITION]).toEqual({ x: 2, y: 2 });
  });
});
