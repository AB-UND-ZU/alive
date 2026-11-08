# Minimap Data

Creates one native Island and prepares exploration using the game's playable path matrix, pathfinder, entity movement and visibility system. Routes visit Earth Town, Fire Haven and the Nomad. The final viewpoint lies on the explored route away from POI markers. Unexplored fog remains; each zoom uses the same hero, world and exploration state.

Native popup rendering captures all four zooms at the visible phase of the player-marker blink. The documentation build stores those rows in `minimap.json`; the browser never generates this world.

After capturing the maps, `islandItemSources` initializes one real occurrence of each cell/object and biome pattern. It records unbound items, native actor drops and loot cells created when actors vanish. These observed level/biome sources share the same generated world. Sampling does not prove every possible rare placement; `itemSources` separately uses native NPC distributions where they establish possible biome drops.
