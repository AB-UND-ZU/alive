# Character Pixels

`characterMask` rasterizes a font outline onto its native 9 by 16 grid. Coordinates are rounded to source pixels before layers are combined.

`composeCharacterPixels` applies the layers in drawing order. `characterImage` caches the resulting SVG by its layers and stack dots. The HUD, HTML scene and startup frame reuse these images. The wiki also reads the pixel grid directly for enlarged previews.
