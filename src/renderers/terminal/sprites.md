# Terminal sprite cells

`TerminalCell` contains one Unicode character, a foreground color and an
optional background color. An absent background lets the cell beneath show.
`projectSprite` selects the sprite's optional `terminal` layers with the same facing and amount rules. These are ordinary stacked character layers, stored beside the browser sprite. Without a terminal variant, it projects the normal layers;
`projectLayers` also accepts layers already selected by the shared scene. `projectTerminalLayers` keeps explicit terminal characters and their foreground/background colors through inventory, shop and dialog composition.

Layered sprites are reduced to one of their existing characters and colors.
The closest source layer is measured against the final stacked pixels. Full
fills use the background color; text and half-block artwork keep their glyphs.
Results are cached by sprite name and layers.

A few composites need a recognizable single-cell form: people use `♀`, eyes
use `o` asleep and `ô` awake, keys use `╒`, and shots keep their arrow direction. Terrain retains
patterns from the level legends, including sand, paths and water. Buildings use silver backgrounds with maroon single wall lines and double roof lines. Doors show their key over the door color; opened doors leave the ground visible. Trees have a maroon background, berry fruit stays visible, and deep water uses a plain navy background. Beam endpoints retain their box-drawing shape; moving bolts use a visible dot
in the source center color. Dash marks use `^`, `>`, `v` and `<`; dormant traps use `x`. Warning lines and the
activated trap frame retain their directional source characters and spell colors.
Dialog selections invert their existing character against the selection background.

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
