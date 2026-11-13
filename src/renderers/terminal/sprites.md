# Terminal sprite cells

`TerminalCell` contains one Unicode character, a foreground color and an
optional background color. An absent background lets the cell beneath show.
`projectSprite` selects the normal facing/amount layers before projection;
`projectLayers` also accepts layers already selected by the shared scene.

Layered sprites are reduced to one of their existing characters and colors.
The closest source layer is measured against the final stacked pixels. Full
fills use the background color; text and half-block artwork keep their glyphs.
Results are cached by sprite name and layers.

A few composites need a recognizable single-cell form: people use `♀`, eyes
use `ô`, keys use `╒`, and shots keep their arrow direction. Terrain retains
patterns from the level legends, including sand, paths and water. Building
edges keep their original box-drawing direction and color. Dialog selections
invert their existing character against the selection background.

See [Terminal renderer](./index.md). No sprite assets or engine rules are
changed by this projection.
<!-- source-types -->

## TerminalCell

```ts src/renderers/terminal/sprites.ts
export type TerminalCell = {
  char: string;
  foreground: string;
  background?: string;
};
```
