# Play and Scenario Pages

Shows the game before its scenario selector. Selecting a scenario remounts the frame; its normal game controls remain active. Play keeps its optional Test Mode lever and links every scenario to the level or boss page. Menu, Dungeon and Island pages expose their relevant scenarios. Bosses has one preview and a short load table for its four encounters.

Presets use native generators, item factories and class leveling. See [preset creation](presets.md). All previews keep native font and sprite dimensions.

Scenario links include a `scenario-` fragment so their destination page loads the requested world directly into its top preview. Choosing a scenario also updates that fragment for reloads and sharing.
