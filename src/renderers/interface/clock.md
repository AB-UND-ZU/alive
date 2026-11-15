# Simulation clock

`createFrameClock(world)` accepts a world with `update(deltaMs)` and elapsed/render time metadata. `advance(deltaMs, paused)` runs 30 Hz updates and returns the interpolated render time. It limits incoming catchup time to 15 frames and retains one initial update, matching the browser loop.

For a network world, `advance` calls the replica presentation renderer once and never runs gameplay systems or advances authoritative time. Pausing suspends presentation. All three renderers use this clock.

`reset()` keeps the remainder between render and simulation time. Call it when pausing so time spent outside the game is not replayed on resume. Update errors propagate after render time and the reentry guard are restored.
<!-- source-types -->

## FrameWorld

```ts src/renderers/interface/clock.ts
export type FrameWorld = {
  metadata: {
    elapsed: number;
    renderTime: number;
    network?: { render: (delta: number) => void };
  };
  update: (delta: number) => void;
};
```
