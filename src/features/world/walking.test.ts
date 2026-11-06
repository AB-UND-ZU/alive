import {
  advanceUntil,
  createAreaWorld,
  findEntityAt,
  FRAME,
  giveItems,
  step,
  trigger,
  countItems,
} from "../../testing/harness";
import { LOCKABLE } from "../../engine/components/lockable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { getHasteInterval } from "../../engine/systems/movement";
import { assertUnit, hold, measureSteps, tryMove } from "./helpers";

// ♀ hero
const openArea = `
|           |
|           |
|  ♀        |
|           |
|           |
`;

describe("walking", () => {
  it("walks faster with more haste", () => {
    const world = createAreaWorld(openArea);
    const hero = assertUnit(world);
    const normal = getHasteInterval(world, 0);
    const fast = getHasteInterval(world, 5);

    // first steps include time spent standing still
    const normalSteps = measureSteps(world, "right", 5).slice(2);
    hero[STATS].haste = 5;
    const fastSteps = measureSteps(world, "right", 5).slice(2);

    normalSteps.forEach((frames) =>
      expect(frames * FRAME).toBeCloseTo(normal, -2)
    );
    fastSteps.forEach((frames) => expect(frames * FRAME).toBeCloseTo(fast, -2));
    expect(fastSteps.reduce((a, b) => a + b)).toBeLessThan(
      normalSteps.reduce((a, b) => a + b)
    );
  });

  it("turns to a blocked direction without moving", () => {
    const world = createAreaWorld(`
|       |
|  ♀█   |
|       |
`);
    const hero = assertUnit(world);
    const position = { ...hero[POSITION] };

    tryMove(world, "down", 1);
    tryMove(world, "up", 1);
    tryMove(world, "right");

    expect(hero[POSITION]).toEqual(position);
    expect(hero[ORIENTABLE].facing).toBe("right");
  });

  it("takes the next held direction if the first one is blocked", () => {
    const world = createAreaWorld(`
|       |
|  ♀█   |
|       |
`);
    const hero = assertUnit(world);

    hold(world, ["right", "down"]);
    advanceUntil(world, () => hero[POSITION].y === 2, 1000);
    hold(world, []);

    expect(hero[POSITION]).toEqual({ x: 2, y: 2 });
  });

  it.each([
    ["mountains", "█"],
    ["granite", "X"],
    ["trees", "#"],
    ["rocks", ">"],
    ["fences", "±"],
    ["palisades", "î"],
  ])("is blocked by %s", (_, obstacle) => {
    const world = createAreaWorld(`
|       |
|  ♀${obstacle}   |
|       |
`);
    const hero = assertUnit(world);

    tryMove(world, "right");

    expect(hero[POSITION]).toEqual({ x: 2, y: 1 });
  });

  it("is blocked by units when walking unarmed", () => {
    const world = createAreaWorld(`
|       |
|  ♀Ω   |
|       |
`);
    const hero = assertUnit(world);
    const dummy = findEntityAt(world, { x: 3, y: 1 }, [STATS])!;

    tryMove(world, "right");

    expect(hero[POSITION]).toEqual({ x: 2, y: 1 });
    expect(dummy[STATS].hp).toBe(dummy[STATS].maxHp);
  });

  it("does not walk through a locked door", () => {
    const world = createAreaWorld(
      `
|       |
|  ♀D   |
|       |
`,
      { legend: { D: "wood_door" } }
    );
    const hero = assertUnit(world);

    tryMove(world, "right");

    expect(hero[POSITION]).toEqual({ x: 2, y: 1 });
  });

  it("slides through an opened door onto the next cell", () => {
    const world = createAreaWorld(
      `
|       |
|  ♀D   |
|       |
`,
      { legend: { D: "wood_door" } }
    );
    const hero = assertUnit(world);
    const door = findEntityAt(world, { x: 3, y: 1 }, [LOCKABLE])!;

    step(world, 15);
    trigger(world, "interact");
    advanceUntil(world, () => !door[LOCKABLE].locked, 3000);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    hold(world, []);
    step(world, 30);

    expect(hero[POSITION]).toEqual({ x: 4, y: 1 });
  });

  it("picks up items in the way before walking on", () => {
    const world = createAreaWorld(`
|       |
|  ♀≡   |
|       |
`);
    const hero = assertUnit(world);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 2000);
    hold(world, []);
    step(world, 30);

    // the first stick becomes a wooden sword
    expect(countItems(world, hero, { weapon: "sword", material: "wood" })).toBe(
      1
    );
  });

  it("keeps the armed hero in place while attacking", () => {
    const world = createAreaWorld(`
|       |
|  ♀Ω   |
|       |
`);
    const hero = assertUnit(world);
    const dummy = findEntityAt(world, { x: 3, y: 1 }, [STATS])!;
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 2 }]);

    tryMove(world, "right");

    expect(hero[POSITION]).toEqual({ x: 2, y: 1 });
    expect(dummy[STATS].hp).toBeLessThan(dummy[STATS].maxHp);
  });
});
