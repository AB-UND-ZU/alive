# Character pixels

`characterMask` rasterizes the bundled font outlines onto their native 9 × 16 grid. Coordinates are rounded to source pixels; no browser text layers overlap.

`composeCharacterPixels` applies sprite layers in order, then stack dots. `characterMarkup` caches the composed pixel rectangles. Each cell draws one SVG with those rectangles; no character layers overlap. `Cell` displays it at the current cell dimensions and retains one transparent character for text selection.
