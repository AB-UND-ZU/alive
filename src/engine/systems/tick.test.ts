import { createWorld } from "..";
import { createLevel } from "../ecs";
import { REFERENCE } from "../components/reference";
import { RENDERABLE } from "../components/renderable";
import setupTick from "./tick";
import { FRAME } from "../../testing/harness";

// bare world without level generation: only the game and frame references
const setup = () => {
  const world = createWorld();
  const game = createLevel(world, "LEVEL_MENU", 8);
  const tick = setupTick(world);
  const reference = game[REFERENCE];
  const generation = () => game[RENDERABLE].generation;
  const run = (frames: number) => {
    for (let frame = 0; frame < frames; frame += 1) tick.onUpdate(FRAME);
  };

  return { tick, reference, generation, run };
};

describe("tick system", () => {
  it("ticks a reference exactly once per interval and keeps the remainder", () => {
    const { reference, generation, run } = setup();
    const start = generation();

    // 350ms world tick: 10 frames = 333ms, 11 frames = 367ms
    run(10);
    expect(generation()).toBe(start);

    run(1);
    expect(generation()).toBe(start + 1);
    expect(reference.delta).toBeCloseTo(11 * FRAME - reference.tick);

    run(210); // 7 more seconds
    expect(generation() - start).toBe(Math.floor((221 * FRAME) / 350));
  });

  it("processes at most one tick per update on long frames", () => {
    const { tick, reference, generation } = setup();
    const start = generation();

    tick.onUpdate(reference.tick * 5);

    expect(generation()).toBe(start + 1);
  });

  it("suspends after the suspension counter runs out and freezes delta", () => {
    const { reference, generation, run } = setup();
    reference.suspensionCounter = 1;

    run(11); // first tick, counter 1 -> 0
    expect(reference.suspended).toBe(false);
    const ticked = generation();

    run(11); // second tick suspends instead of ticking
    expect(reference.suspended).toBe(true);
    expect(generation()).toBe(ticked);

    const frozen = reference.delta;
    expect(frozen).toBeGreaterThanOrEqual(reference.tick);
    run(100);
    expect(generation()).toBe(ticked);
    expect(reference.delta).toBe(frozen);

    // resuming processes the pending frame on the very next update
    reference.suspended = false;
    reference.suspensionCounter = -1;
    run(1);
    expect(generation()).toBe(ticked + 1);
  });
});
