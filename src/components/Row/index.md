# Character rendering

`Row/index.tsx` draws the HTML rows used by the game's UI. A sprite is an ordered list of colored character layers. Each layer occupies the same cell; later layers cover earlier ones.

## Font and palette

The game bundles Most Perfect DOS VGA and uses sixteen terminal colors from `game/assets/colors.ts`. The custom font maps some game characters beyond ordinary ASCII. Keep the bundled font when rendering those sprites; a system monospace font can produce different shapes.

`getFacingLayers` selects directional or amount variants. Use it instead of reading `sprite.layers` directly when facing or stack size matters. Item display sprites come from `getItemSprite`.

## HTML and Three.js

The main world uses React Three Fiber. UI rows use HTML cells and absolutely positioned spans. Stack dots and health bars are separate shapes. The documentation uses plain HTML with the same font and sprite layers; its small worlds are a view of ECS positions, not a replacement for the game's lighting, camera, fog, or animation renderer.

## Visual checks

Compare a reference capture with the running game and docs. Check character proportions, layering, colors, borders, and text at desktop and touch widths. Use screenshots as evidence and inspect them; a successful DOM test cannot establish visual correctness.
