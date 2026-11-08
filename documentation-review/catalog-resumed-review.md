# Catalog checks

The current catalog changes use native item, unit and class data. No game rules changed.

- Classes: one Level row contains levels 1–10, lime labels, two-character padded HP/MP counts before their native icons and one blank character between HP and MP. Extra stats use the class balancing data and stay on one line per stat. Scout remains excluded from the playable class comparison.
- Equipment: an Equipped row appears only when native equipment adds a visible segment to Scout. The isolated fixture calls `createItemInInventory` and `getSegments`; it does not draw a replacement character.
- Sources: drop probabilities, distinct recipe ingredients, harvest targets, NPC rewards and natural pickups are grouped by action. There is no invented Test Mode source. Missing source data stays empty. Generic source labels are not repeated.
- Units: HP follows Faction; damage rows say Damage. Empty drop outcomes do not create empty frames. The Oak Boss's actual `vanish.cells` output appears under Spawns. Rotten uses all three actual cell-factory fragments.
- Taxonomy: ordinary Plants has Cactus 1/2, Hedge 1/2 and Tumbleweed; Oak Hedges, Tulips and Lilies belong to Enemies. Totems belong to Skills; Rotten belongs to Plants; Sign belongs to Structures. Units keeps attackable buildable objects. Gear has a Utility family for Torch, Compass, Map and Boots.
- Grounds includes native snow, rubble and planting soil. Building requirements use the native Building stat rather than character Level.

## Verification

The four scoped Jest suites passed 36 tests; the final CatalogEntry rerun also passed its six tests, including the added empty-drop regression. The five catalog Playwright tests passed after the compact class and acquisition updates. Scoped lint passed. A temporary StructureOverview type error was fixed by its owner; root runs the final aggregate checks after shared-source changes settle.

Visual inspection covered 22 desktop/phone visits to Classes, Plants, Units, Structures, Gear, Consumables, Resources, Skills, Bosses and Building, including horizontal comparison endpoints. There were no browser runtime errors. Images and coverage are in `/tmp/alive-catalog-resumed-visual`; all seven contact sheets were inspected. The final Classes images confirm that bonus counts no longer wrap away from their names. Earlier Rotten images show the empty 30% outcome that was subsequently removed and covered by a regression test.

Source coverage is limited to engine-supported records: literal NPC rewards are extracted during the build; dynamic quest behavior is not guessed. Recipe availability is a supported transformation, not a claim that every ingredient is obtainable in normal play. The complete generated island and its location distribution remain on the World pages. Structure factory media and native farming progression are handled by the corresponding parallel changes.

The final Classes clarification is verified by two scoped browser tests: only levels 1–10 are shown. Every one of the 40 rows has a 54px HP group, an 18px blank character, a 54px MP group and equal top alignment. The level-10 values match the native leveling data.
