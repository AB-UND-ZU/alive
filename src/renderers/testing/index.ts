import { createFrameClock, FrameWorld, systemsFrame } from "../interface/clock";

export const createTestingRenderer = (world: FrameWorld) => {
  const clock = createFrameClock(world);
  // Tests request exact steps rather than the browser's initial update.
  clock.reset();

  const step = (frames = 1) => {
    for (let frame = 0; frame < frames; frame += 1) {
      clock.advance(systemsFrame);
    }
    return world.metadata.renderTime;
  };

  return { ...clock, step };
};
