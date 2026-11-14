# HTML renderer

`HtmlRenderer` displays the shared scene frame in React DOM elements. It advances game time through the shared frame clock and leaves input on the surrounding terminal.

A single character uses the game's DOS font. Layered characters use `characterMarkup`, the same cached pixel composition used by wiki sprites. The SVG contains the final colored pixels rather than overlapping glyphs. Both occupy the same 9-by-16 cell. Solid block characters fill the cell background, without enlarging other glyphs.

The frame includes the game's equipment, unit backdrops, particles, fog and interior visibility. It samples engine movement and camera motion at `metadata.renderTime`. Lighting and shadows are disabled. Health bars and stack dots remain visible.

The scene moves as one camera layer, aligned to device pixels. Hidden cells remain available for 200 ms opacity transitions. Loot uses stable item keys, fades in on its first visible frame, and stays mounted for 200 ms after collection or removal. Expired entries are removed from the world-scoped cache. Homing discs keep the facing of their sampled movement until they reach a corner. Fog uses the three-quarter shade character; swimming uses the lower-half water character. Damage uses the same shake distance and timing as Three.js. Viewpoint earthquakes repeat a short outward-and-back shake until their generation ends. Stack dots draw above swimming and remains, and health fills animate over 75 ms. Suspended worlds do not draw behind the loading overlay.

Controls stay on the surrounding terminal, so mouse, keyboard and touch target the same cell coordinates for all browser renderers.
