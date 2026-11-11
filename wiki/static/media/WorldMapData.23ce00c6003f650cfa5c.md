# Island Map Data

`prepareIslandMaps` generates the same seeded Island as the playable wiki preset. It packs repeated native sprites into a shared palette for the committed `island.json` reference.

Town bounds come from the generated Earth Town and Fire Haven NPC sequence memory. The Fire Haven view also includes its generated palisade extension and the jetty connected to the harbor guard. Every cell in each cutout is initialized. `worldRows` uses the native inside rendering for every building, revealing facades and roofs without moving or duplicating their contents. The legend includes NPCs and Bench, Anvil and Kettle stations in those bounds. Unit sprites use the native complete portrait, including backdrops and equipment.

Run `npm run wiki:world` to rebuild this seeded reference explicitly. Normal builds reuse it.
