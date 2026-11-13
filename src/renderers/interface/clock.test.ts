import { createFrameClock, systemsFrame } from "./clock";

const createWorld = () => {
  const metadata = { elapsed: 0, renderTime: 0 };
  return {
    metadata,
    update: jest.fn((delta: number) => {
      metadata.elapsed += delta;
      metadata.renderTime = metadata.elapsed;
    }),
  };
};

describe("simulation clock", () => {
  it("starts with one update and interpolates between fixed updates", () => {
    const world = createWorld();
    const clock = createFrameClock(world);

    expect(clock.advance(systemsFrame / 2)).toBeCloseTo(systemsFrame * 1.5);
    expect(world.update).toHaveBeenCalledTimes(1);
    expect(world.update).toHaveBeenLastCalledWith(systemsFrame);
    clock.advance(systemsFrame / 2 + 1);
    expect(world.update).toHaveBeenCalledTimes(2);
    expect(world.metadata.elapsed).toBeCloseTo(systemsFrame * 2);
  });

  it("limits catchup after a stalled render frame", () => {
    const world = createWorld();
    const clock = createFrameClock(world);
    clock.advance(0);
    world.update.mockClear();

    clock.advance(60_000);

    expect(world.update.mock.calls.length).toBeGreaterThanOrEqual(14);
    expect(world.update.mock.calls.length).toBeLessThanOrEqual(15);
    expect(world.metadata.renderTime).toBeCloseTo(systemsFrame * 16);
  });

  it("does not accumulate paused time and preserves interpolation on resume", () => {
    const world = createWorld();
    const clock = createFrameClock(world);
    clock.advance(systemsFrame / 2);
    const { renderTime } = world.metadata;
    const updates = world.update.mock.calls.length;

    expect(clock.advance(60_000, true)).toBe(renderTime);
    expect(world.update).toHaveBeenCalledTimes(updates);
    clock.advance(systemsFrame / 2 + 1);
    expect(world.update).toHaveBeenCalledTimes(updates + 1);
  });

  it("synchronizes reset with the world's current interpolation remainder", () => {
    const world = createWorld();
    const clock = createFrameClock(world);
    clock.reset();
    clock.advance(0);
    expect(world.update).not.toHaveBeenCalled();

    world.metadata.renderTime = 10;
    clock.reset();
    expect(clock.advance(0)).toBe(10);
    expect(world.update).not.toHaveBeenCalled();
  });

  it("ignores reentrant frames and remains usable after an update fails", () => {
    const world = createWorld();
    const clock = createFrameClock(world);
    const failure = new Error("failed update");
    world.update.mockImplementationOnce(() => {
      clock.advance(systemsFrame);
      throw failure;
    });

    expect(() => clock.advance(systemsFrame)).toThrow(failure);
    expect(world.update).toHaveBeenCalledTimes(1);
    expect(world.metadata.renderTime).toBeCloseTo(systemsFrame);
    clock.advance(0);
    expect(world.update).toHaveBeenCalledTimes(2);
    expect(world.metadata.elapsed).toBeCloseTo(systemsFrame);
  });
});
