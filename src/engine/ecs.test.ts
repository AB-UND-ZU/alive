import {
  advance,
  createAreaWorld,
  findInArea,
  getHero,
  step,
  walk,
} from "../testing/harness";
import { LEVEL } from "./components/level";
import { REFERENCE } from "./components/reference";
import { RENDERABLE } from "./components/renderable";
import { VIEWABLE } from "./components/viewable";
import { getCellEntities } from "./systems/map";
import { isCollision, isWalkable } from "./systems/movement";

// ♀ hero, █ mountain, # tree, ~ shallow water, " " air
const area = `
|████████████|
|█    #     █|
|█  ♀    ~~ █|
|█     #    █|
|████████████|
`;

const size = 48;

describe("bootstrap", () => {
  it("spawns the hero at its area position", () => {
    const world = createAreaWorld(area, { size });
    const hero = getHero(world);

    expect(hero).toBeDefined();
    expect(hero!.POSITION).toEqual(findInArea(area, "♀"));
    expect(world.assertComponents(hero!, [VIEWABLE])[VIEWABLE].active).toBe(
      true
    );
    expect(getCellEntities(world, hero!.POSITION)).toContain(hero);
  });

  it("creates entities for each cell of the area", () => {
    const world = createAreaWorld(area, { size });
    const blocked = (char: string) =>
      isCollision(world, findInArea(area, char));

    expect(blocked("█")).toBe(true);
    expect(blocked("#")).toBe(true);
    expect(blocked("~")).toBe(false);
    expect(isWalkable(world, { x: 2, y: 2 })).toBe(true);
    expect(world.metadata.gameEntity[LEVEL].walkable.length).toBeGreaterThan(0);
  });

  it("loads the viewport at once, then new cells progressively", () => {
    const world = createAreaWorld(area, { size });
    const { initialized } = world.metadata.gameEntity[LEVEL];
    const { renderedColumns, renderedRows } = world.metadata.dimensions;
    const count = () => initialized.flat().filter(Boolean).length;

    // first frame on a new level initializes the whole viewport at once
    const initial = count();
    expect(initial).toBeGreaterThanOrEqual(renderedColumns * renderedRows);
    expect(initial).toBeLessThan(size * size);

    // moving down reveals a new row which is loaded over multiple frames
    walk(world, "down");
    step(world, 1);
    expect(count()).toBeGreaterThan(initial);
    expect(count()).toBeLessThan(initial + size);

    step(world, 60);
    expect(count()).toBe(initial + size);
  });

  it("keeps running for 10s of game time", () => {
    const world = createAreaWorld(area, { size });
    const game = world.metadata.gameEntity;
    const start = game[RENDERABLE].generation;

    advance(world, 10000);

    const ticks = Math.floor(10000 / game[REFERENCE].tick);
    expect(game[RENDERABLE].generation - start).toBeGreaterThanOrEqual(
      ticks - 1
    );
    expect(getHero(world)?.POSITION).toEqual(findInArea(area, "♀"));
  });
});
