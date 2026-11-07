# Font outlines

`font.json` is the source copy of `public/fonts/MostPerfectDOSVGA.json` used by the HTML character compositor. Keep both files identical when replacing the font. The public copy is loaded by the game's Three.js renderer; the source copy can be bundled by the React build.

Glyphs use a native 9 by 16 grid. The compositor uses their outlines directly, so character sprites have the same shapes in HTML and the game renderer.
