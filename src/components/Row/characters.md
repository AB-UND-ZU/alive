# Character Pixels

`characterMask` rasterizes a font outline onto its native 9 by 16 grid. Coordinates are rounded to source pixels before layers are combined.

```text cell-composition.txt
font masks + sprite colors
  -> composeCharacterPixels
  -> stack dots
  -> cached SVG rectangles
  -> one Cell
```

`characterMarkup` caches the final rectangles. For stacked sprites, `Cell` scales that single drawing without selectable fallback text. Single-layer glyphs use the actual DOS font instead.
