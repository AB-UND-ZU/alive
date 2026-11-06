import {
  advanceUntil,
  createAreaWorld,
  findEntityAt,
  giveItems,
  step,
} from "../../testing/harness";
import { World } from "../../engine";
import { DISPLACABLE } from "../../engine/components/displacable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { assertUnit, hold, tryMove } from "./helpers";

// ■ box
const getBox = (world: World, x: number) =>
  findEntityAt(world, { x, y: 1 }, [DISPLACABLE, POSITION, STATS])!;

describe("pushing boxes", () => {
  it("pushes a box into the free cell behind it", () => {
    const world = createAreaWorld(`
|          |
|  ♀■      |
|          |
`);
    const hero = assertUnit(world);
    const box = getBox(world, 3);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    hold(world, []);
    step(world, 15);

    expect(box[POSITION]).toEqual({ x: 4, y: 1 });
    expect(findEntityAt(world, { x: 4, y: 1 }, [DISPLACABLE])).toBe(box);
  });

  it("keeps pushing the box while walking", () => {
    const world = createAreaWorld(`
|          |
|  ♀■      |
|          |
`);
    const hero = assertUnit(world);
    const box = getBox(world, 3);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 5, 2000);
    hold(world, []);
    step(world, 15);

    expect(box[POSITION]).toEqual({ x: 6, y: 1 });
  });

  it.each([
    ["a wall", "█"],
    ["another box", "■"],
  ])("cannot push a box into %s", (_, blocker) => {
    const world = createAreaWorld(`
|          |
|  ♀■${blocker}     |
|          |
`);
    const hero = assertUnit(world);
    const box = getBox(world, 3);

    tryMove(world, "right");

    expect(hero[POSITION]).toEqual({ x: 2, y: 1 });
    expect(box[POSITION]).toEqual({ x: 3, y: 1 });
  });

  it("pushes a box without breaking it while armed", () => {
    const world = createAreaWorld(`
|          |
|  ♀■      |
|          |
`);
    const hero = assertUnit(world);
    const box = getBox(world, 3);
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 2 }]);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    hold(world, []);
    step(world, 15);

    expect(box[POSITION]).toEqual({ x: 4, y: 1 });
    expect(box[STATS].hp).toBe(box[STATS].maxHp);
  });

  it("slides a pushed box over ice", () => {
    const world = createAreaWorld(`
|            |
|  ♀■%%%     |
|            |
`);
    const box = getBox(world, 3);

    hold(world, ["right"]);
    advanceUntil(world, () => box[POSITION].x === 4, 1000);
    hold(world, []);
    step(world, 90);

    expect(box[POSITION]).toEqual({ x: 7, y: 1 });
    expect(assertUnit(world)[POSITION]).toEqual({ x: 3, y: 1 });
  });
});
