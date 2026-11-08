# Boss Diagrams

Uses the actual Ilex, Oak and Dungeon room legends and cell factories. Multi-cell bodies retain all factory fragments; Golem shows its dormant stone formation beside its unfolded body. `createBossWorld` keeps its native AI through preparation: full HP reaches the neutral dormant phase, then one point of damage starts unfolding. The active fixture stops once the extended body and arms queue the fighting phase, before an attack. All patterns are then cleared for the static snapshot. The Worm encounter has no generated room, so its test-spawned body is shown without an invented arena.

Room rendering uses `worldRows`, including native backdrops, equipment and facing. No combat simulation runs while reading a diagram. `bossDiagrams` renders the prepared world within its room bounds, cropping empty space for encounters without a room. Other bosses keep their existing fixture setup.
