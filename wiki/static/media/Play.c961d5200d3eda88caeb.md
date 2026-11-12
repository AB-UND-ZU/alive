# Play and Scenario Pages

Each page shows its game preview above a scenario table. Every row contains the linked level, area or boss, the hero's level and native equipment/inventory with material, element and potion type, and a Load button. Play keeps its optional Test Mode lever. Menu, Dungeon, Island and Bosses reuse the same table with their relevant scenarios.

`getPresetLoadout` supplies both the table and `createPresetWorld`; the UI does not copy equipment or leveling rules. Presets use native generators, item factories and class leveling. See [preset creation](presets.md). All previews keep native font and sprite dimensions.

Scenario links include a `scenario-` fragment so their destination loads the requested world into its top preview. Loading updates that fragment for reloads and sharing.
