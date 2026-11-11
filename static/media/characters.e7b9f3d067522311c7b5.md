# Character Pixels

`characterMask` rasterizes a font outline onto its native 9 by 16 grid. Coordinates are rounded to source pixels before layers are combined.

`composeCharacterPixels` and `characterMarkup` support the wiki's enlarged sprite previews and joystick images. The shared `Cell` also uses `characterMarkup` to resolve multiple layers into one SVG; single-layer characters keep using the font.
