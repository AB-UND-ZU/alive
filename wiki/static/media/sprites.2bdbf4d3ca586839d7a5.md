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
use `O` asleep and `Ö` awake, keys use `╒`, and shots keep their arrow direction. Terrain retains
patterns from the level legends, including sand, paths and water. Houses use silver interiors with outward maroon half-block sides and black windows and role plates. Roof surfaces use red quarter shading over maroon, inside connected single red lines. Lower roof corners use `├` and `┤` to continue down the house sides. Fortress sprites retain their own outlines. Doors show their key over the door color; opened doors leave the ground visible. Trees have a maroon background, berry fruit stays visible, and deep water uses a plain navy background. Beam endpoints retain their box-drawing shape; beam interiors use `:` in the source center color. Dash marks use `^`, `>`, `v` and `<`; dormant traps use `%`. Warning lines and the
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

Explicit Terminal control-picture glyphs remain visible on black dialog backgrounds. The game font atlas stores those glyphs at private code points, so its missing Unicode pixel mask must not erase the native character.

Explicit one-character Terminal sprites retain their glyph and background through dialog composition without font-pixel matching. Upper halves use their color as the background and draw the lower half with `▄`, including a black lower half for upper-only artwork.
