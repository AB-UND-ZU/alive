# Terminal frames

`TerminalSprite` is a positioned stack of existing character layers, with a
sprite name for semantic projection. `createTerminalFrame` sorts these by
height, snaps each position up to a whole cell and composites them into a
`TerminalFrame`, a row-major array of character/foreground/background cells.
`collectTerminalSprites` combines each entity's body, backdrop, shadow and
equipment segments before projection. Weapons therefore do not replace the
actor's character. Loot and particles remain independent. Transparent
backgrounds retain the cell below. Empty transparent sprites do
not erase the scene. Health bars and item-count dots are not projected.

`frameToAnsi` writes true-color ANSI cells at absolute row positions without
scrolling the terminal. It suppresses control characters in sprite data.
`frameToText` returns a plain text snapshot of the same frame.

<!-- source-types -->

## TerminalSprite

```ts src/renderers/terminal/frame.ts
export type TerminalSprite = {
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  sprite: { name: string };
};
```

## TerminalFrame

```ts src/renderers/terminal/frame.ts
export type TerminalFrame = TerminalCell[][];
```
