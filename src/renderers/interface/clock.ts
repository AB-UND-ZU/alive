export const systemsFrame = 1000 / 30;
const catchupFrames = 15;

export type FrameWorld = {
  metadata: { elapsed: number; renderTime: number };
  update: (delta: number) => void;
};

export const createFrameClock = (world: FrameWorld) => {
  let elapsed = systemsFrame;
  let running = false;

  const reset = () => {
    elapsed = Math.max(0, world.metadata.renderTime - world.metadata.elapsed);
  };

  const advance = (deltaMs: number, paused = false) => {
    if (running) return world.metadata.renderTime;
    if (paused) {
      reset();
      return world.metadata.renderTime;
    }

    elapsed += Math.min(deltaMs, systemsFrame * catchupFrames);
    running = true;
    try {
      while (elapsed >= systemsFrame) {
        elapsed -= systemsFrame;
        world.update(systemsFrame);
      }
    } finally {
      world.metadata.renderTime = world.metadata.elapsed + elapsed;
      running = false;
    }
    return world.metadata.renderTime;
  };

  return { advance, reset };
};
