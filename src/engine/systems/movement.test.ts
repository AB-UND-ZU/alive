import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  findInArea,
  FRAME,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
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
