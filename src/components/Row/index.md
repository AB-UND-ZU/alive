# Character rows

`Row` lays out fixed-size `Cell` elements. `characters.ts` reads the bundled font outlines and composites sprite layers into one pixel drawing per cell. This avoids antialiasing seams between overlapping text glyphs.

Each cell retains a transparent text character for selection and copying. Cell width and height come from the dimensions provider; documentation uses integer 18 by 32 pixel cells.
<!-- source-types -->

## CellSprite

```ts src/components/Row/index.tsx
export type CellSprite = Sprite & { stackableAmount?: number };
```
