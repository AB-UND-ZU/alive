# Renderer interface

The engine owns entities, rules, fog visibility and animation time. Renderers read that state and present the same game through their own React host. Lighting and shadows are optional presentation features; fog visibility remains part of the game.

`createFrameClock(world)` advances the simulation in fixed 30 Hz steps. `advance(deltaMs, paused)` accepts milliseconds, limits catchup to 15 frames of incoming time, and returns `metadata.renderTime` for animation sampling. The first running frame includes one initial update, matching the Three.js loop. Paused frames do not accumulate time. `reset()` restores the interpolation remainder from the world's elapsed and render times.

`collectScene(world, viewport, stickyCastables)` enumerates the cells around the viewpoint, including motion overscan, wrapped map copies, projectiles and viewpoint-anchored effects. Keep the projectile quadrant record across frames so a moving projectile does not jump between wrapped copies. Renderers decide how to present each returned entity and its fog state.

The testing renderer exposes the same clock and `step(frames)`. It starts without the browser's initial update so each requested step advances exactly once. Logic tests can run the world without mounting React, WebGL or a visual renderer. Tests of visual placement, controls and host rendering remain with the corresponding renderer.

## Shared data

`dimensions.ts` owns cell proportions and viewport calculations without React. Browser sizing supplies the screen dimensions; imports without a browser use an 80 by 24 character screen. `platform.ts` exposes touch detection without requiring `window`.

Keyboard layout and package version text live in `game/assets/keyboard.ts` and `game/assets/version.ts`. Engine code imports these data modules rather than the browser keyboard or world components. `segments.ts` owns sprite composition and draw heights shared by renderers. Motion configuration still uses spring types, with no runtime Three.js import.
