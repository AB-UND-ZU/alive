# Character Pixels

`characterMask` rasterizes a font outline onto its native 9 by 16 grid. Coordinates are rounded to source pixels before layers are combined.

`composeCharacterPixels` and `characterMarkup` support the wiki's enlarged sprite previews and joystick images. The shared `Row` and `Cell` components render font layers directly.
