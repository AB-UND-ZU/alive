# Font outlines

`font.json` is the source copy of `public/fonts/MostPerfectDOSVGA.json` used by the HTML character compositor. Keep both files identical when replacing the font. The public copy is loaded by the game's Three.js renderer; the source copy can be bundled by the React build.

Glyphs use a native 9 by 16 grid. Single-layer HTML cells use the bundled DOS WOFF font. Stacked cells combine the JSON outlines on that grid before drawing one SVG; the Three.js renderer uses the public JSON copy.
