# Island Maps

Displays the Island schematic with the existing terrain sprites, landmark icons and region labels. The seeded playable preview and settlement cutouts use seed 2026.

Earth Town and Fire Haven use `WorldMapData` and `worldRows` with the native inside flag. Regular tables underneath list NPCs and crafting, forging and brewing stations. NPC icons use the shared unit renderer, including their backdrops. Every map uses standard 18 by 32 pixel cells; large cutouts scroll without scaling.

The separate Minimap page keeps its committed discovered-world popup examples. Run `wiki:world` explicitly to refresh town references; it does not modify `minimap.json`.
