# Terminal frames

`TerminalSprite` is a positioned stack of existing character layers, with a
sprite name for semantic projection. `createTerminalFrame` sorts these by
height, snaps each position up to a whole cell and composites them into a
`TerminalFrame`, a row-major array of character/foreground/background cells.
`collectTerminalSprites` combines each entity's body, backdrop, shadow and
equipment segments before projection. Weapons therefore do not replace the
actor's character. Upper and lower title blocks at the same position and depth
are composed together so neither half overwrites the other. Loot and particles remain independent. Transparent
backgrounds retain the cell below. Empty transparent sprites do
not erase the scene. Health bars and item-count dots are not projected.

Fog uses a dark gray background, including empty unexplored air. Bright terrain
colors darken without brightening already dark characters; squiggly fog is black.
Floating and opaque bodies keep their sprite colors above fog. World particles
inherit the ground background when their own background is black. Tooltips and
interaction text keep their original colors. Focus outlines remain below them.

The hero and other units stay above world effects, except for x/X hit markers.
Hits color the hero red, freeze uses an aqua background and burn uses maroon.
Dialogs remain on top. Explicit terminal layers are selected by the shared frame
from each sprite's facing and amount; equipment does not replace a unit's glyph.
`shakeTerminalFrame` shifts the complete frame one cell for 100 ms after new damage,
then restores it. Existing damage on loading does not shake the screen.

`frameToAnsi` writes standard 16-color ANSI cells at absolute row positions without
scrolling the terminal. It resets colors on every row and suppresses control characters in sprite data.
`frameToText` returns a plain text snapshot of the same frame.
<!-- source-types -->

## TerminalSprite

```ts src/renderers/terminal/frame.ts
export type TerminalSprite = {
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  terminalLayers?: Layer[];
  unit?: boolean;
  floating?: boolean;
  sprite: { name: string };
  fog?: boolean;
  overlay?: boolean;
  ui?: boolean;
  hero?: { hit: boolean; ghost?: boolean; background?: string };
};
```

## TerminalFrame

```ts src/renderers/terminal/frame.ts
export type TerminalFrame = TerminalCell[][];
```

## TerminalState

```ts src/renderers/terminal/frame.ts
export type TerminalState = SceneState & {
  receivedDamage?: number;
  shake?: { until: number; x: number; y: number };
};
```
