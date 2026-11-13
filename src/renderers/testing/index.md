# Testing renderer

`createTestingRenderer(world)` runs the shared simulation clock without mounting a visual scene. `step(frames)` advances exactly that many 30 Hz updates; `advance(deltaMs, paused)` and `reset()` expose the same timing controls as the browser clock. It starts without the browser's initial update.

The deterministic helpers in `src/testing/harness.ts` use this adapter for game rules, interactions and timing tests. Tests of Three.js object placement and browser UI use their corresponding rendering helpers.
