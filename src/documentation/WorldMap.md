# World Map

`WorldMap` draws the Island's regions and landmarks with the game's terrain and map-marker sprites. The character grid is a schematic, not a saved Island. `generateIsland` rotates the mainland, varies its shoreline and places the settlements for each new game.

The jungle and desert are separated by a mountain range through Oak's arena. The passage crosses the range near the center. The glacier lies across the wrapping map boundary from the mainland; small islands fill the surrounding ocean. The diagram leaves discovery fog out so the regions remain visible.

The Map page imports the diagram with a `world-map` widget. The shared `Pixels` renderer keeps the glyphs selectable and aligned with the documentation's normal character cells. The diagram scrolls horizontally on narrow screens.
