import { createTestingRenderer } from ".";
import { systemsFrame } from "../interface/clock";
import { assertHero, createAreaWorld, holdMove } from "../../testing/harness";
import { POSITION } from "../../engine/components/position";

it("moves the hero with fixed simulation steps without mounting a visual renderer", () => {
  const world = createAreaWorld(
    `
|████████|
|█ ♀    █|
|████████|
`,
    { size: 32 }
  );
  const hero = assertHero(world);
  const { advance, step } = createTestingRenderer(world);
  const before = { ...hero[POSITION] };
  const elapsed = world.metadata.elapsed;

  holdMove(world, ["right"]);
  advance(10_000, true);
  expect(hero[POSITION]).toEqual(before);
  expect(world.metadata.elapsed).toBe(elapsed);

  step(10);
  holdMove(world, []);
  expect(hero[POSITION]).toEqual({ x: before.x + 1, y: before.y });
  expect(world.metadata.elapsed - elapsed).toBeCloseTo(systemsFrame * 10);
  expect(world.metadata.renderTime).toBeCloseTo(world.metadata.elapsed);
});
