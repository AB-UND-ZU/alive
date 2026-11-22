# Excalibur renderer

The default browser client runs an Excalibur engine and scene. Excalibur schedules the scene’s fixed updates at 30 Hz. Each update advances the Alive world once. Before drawing, the scene samples motion using Excalibur’s remaining frame time. Pausing freezes both the simulation and its motion samples. The camera and actors draw the ordered glyph stacks from `getSceneFrame` with the existing palette and font. The scene handles lighting and shadows. Alive's React interface supplies the viewport, pause state, keyboard, mouse and touch controls.

The point light and its occluders shade terrain. Wall faces and ore draw above that pass. A cached darkness mask applies the circular light radius to the world, with fog, dialogs and indicators above it. The mask updates when its lights or viewport change.

The canvas renders at the display’s physical pixel resolution. Camera zoom scales the 9 × 16 glyphs equally along both axes. Camera motion moves the tile grid in whole display pixels. Movement and bumps round only their displacement, so neighboring cells and stationary particle glyphs share an edge at fractional zoom. At fractional zoom, Excalibur’s pixel-art sampler blends glyph edges. The Canvas2D fallback uses a higher-resolution cached glyph for the same purpose.

The default game and wiki previews use this client. The Three.js reference client has its own entry point and bundle under `/three-js/`.

The JavaScript driver uses the native Excalibur API behind the typed contract in `game.d.ts`. This keeps Alive’s TypeScript 4.9 build compatible with Excalibur 1.0’s TypeScript 5 declarations.
