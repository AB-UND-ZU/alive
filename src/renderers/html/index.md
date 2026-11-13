# HTML renderer

`HtmlRenderer` displays the shared scene frame in React DOM elements. It advances game time through the shared frame clock and leaves input on the surrounding terminal.

A single character uses the game's DOS font. Layered characters use `characterMarkup`, the same cached pixel composition used by wiki sprites. The SVG contains the final colored pixels rather than overlapping glyphs. Both occupy the same 9-by-16 cell. Solid block characters fill the cell background, without enlarging other glyphs.

The frame includes the game's equipment, unit backdrops, particles, fog and interior visibility. It samples engine movement and camera motion at `metadata.renderTime`. Lighting and shadows are disabled. Health bars and stack dots remain visible.

The scene moves as one camera layer, aligned to device pixels. Hidden cells remain available for 200 ms opacity transitions. Fog uses the three-quarter shade character; swimming uses the lower-half water character. Damage uses the same shake distance and timing as Three.js. Suspended worlds do not draw behind the loading overlay.

Controls stay on the surrounding terminal, so mouse, keyboard and touch target the same cell coordinates for all browser renderers.
