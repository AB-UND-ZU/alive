# Gameplay wiki review

Baseline: 767e346. Research only; no repository edits.

Capture directory: `/tmp/alive-gameplay-review/`. Coverage JSON will be consolidated after every route is captured and visually inspected. Each page is scrolled from top to bottom; comparison tables are scrolled in both axes. Contact sheets retain the screenshot filenames and offsets.

## Confirmed findings

### G01 — S2 — Interface displays missing equipment sprites

- Route: `game-design/controls/interface.html`.
- Screenshot: `/tmp/alive-gameplay-review/02-001-page.png` (and `02-contact-00.png`). The equipped row shows a sword followed by two missing-sprite marks.
- Evidence: `src/wiki/InterfaceDiagram.tsx:84` and `:86` pass torch and map without material. `src/game/assets/utils.ts:1151` resolves items without material/element only through stackable/stat, so these accessories return the missing sprite. `src/game/assets/commands.ts:131` supplies actual defaults (torch Wood, map Gold).
- Scope: local hard-coded diagram data, distinct from the canonical catalog fixes.
- Fix: use the actual command item definitions for those two diagram icons, or the hero's equipped items.

### G02 — S3 — Keyboard/Mouse repeats its action-selection explanation

- Route: `game-design/controls/keyboard-mouse.html`.
- Screenshot: `/tmp/alive-gameplay-review/03-000-page.png` and `03-001-page.png`.
- Evidence: `wiki/keyboard-mouse.md:3` says nearby objects/equipped items determine actions; `:25` repeats the same fact before the button table.
- Scope: local writing flow.
- Fix: keep the opening movement instruction and the concrete mouse/dialog instructions; remove the repeated generic sentence.

### G03 — S3 — Movement key alternatives break awkwardly

- Route: `game-design/controls/keyboard-mouse.html`.
- Screenshot: `/tmp/alive-gameplay-review/03-000-page.png`, first table row. The arrow keys occupy one row; `or W A S` wraps and D sits alone underneath.
- Evidence: `wiki/keyboard-mouse.md:7` places both alternatives in one inline cell. Shared table sizing counts text rather than the intended grouping of keyboard controls.
- Scope: local content grouping with a shared table-layout contribution.
- Fix: render the arrow-key sequence and WASD sequence as two explicit rows inside the same cell, each kept together.

## Review notes awaiting synthesis

- Welcome has a clear visual flow but no player-facing premise or first action; its opening immediately gives implementation libraries. Root is independently reviewing the welcome flow and reference wikis.
- Keyboard/Mouse ends in two unlabelled demonstrations (movement and crafting) after the Pause explanation; the second demonstrator is not identifiable until it opens a crafting dialog. This is a relevance/placement concern rather than a factual defect.

### G04 — S3 — Automatic stat decoration changes a geographic term

- Route: `game-design/world/map.html`.
- Screenshot: `/tmp/alive-gameplay-review/05-001-page.png`: “mountain Range” includes the attack-range sprite and stat coloring.
- Evidence: `wiki/map.md:9` uses “mountain range” geographically. `src/wiki/App.tsx:221` registers every stat as a global decoration; `src/wiki/references.tsx:50` matches tokens without semantic context.
- Scope: systematic automatic decoration; this is one verified false positive.
- Fix: keep ordinary prose intact and make ambiguous stat decorations explicit, or suppress decoration for the phrase “mountain range”. Link the geographic concept to Terrain when helpful.

### G05 — S3 — Levels repeats the same progression and leaves “Vision” ambiguous

- Route: `game-design/world/levels.html`.
- Screenshot: `/tmp/alive-gameplay-review/06-contact-00.png`.
- Evidence: `wiki/levels.md:3` explains Menu → Dungeon → Island, the overview table repeats those levels, and the framed `LEVELS.TXT` repeats the chain again before a second level table. `src/wiki/Widgets.tsx:321` labels `levelConfig.vision` simply Vision; `src/engine/systems/visibility.ts:161` adds entity vision to this value, so Island 0 is not a statement that the player sees nothing.
- Scope: local page composition and a shared data-widget label.
- Fix: combine the overview and numeric table, omit the redundant one-line code frame, and call the numeric field Base Vision if it remains player-facing.

### G06 — S2 — NPC catalog omits the actual NPC services and progression

- Route: `game-design/characters/npcs.html`.
- Screenshots: `/tmp/alive-gameplay-review/11-001-page.png` through `11-005-page.png`; complete visual coverage `11-contact-00.png` and `11-contact-01.png`.
- Evidence: `wiki/npcs.md:3` only gives a generic Enter instruction. `src/wiki/CatalogEntry.tsx:259` renders faction, combat stats, patterns, gear and drops, but no service/quest role. The actual Earth Smith unlocks the anvil's Forge tab in `src/game/assets/npcs.ts:1824`; Earth Druid unlocks brewing recipes at `:1635`; Fire Smith offers target quests at `:2265`. These differences are absent while identical HP and gear receive full comparison blocks.
- Scope: systematic unit comparison schema used on a page whose purpose is interaction.
- Fix: add a concise service/interaction row with feature links to each NPC family/variant; retain stats without letting them replace the gameplay role. Source the descriptions from the actual NPC sequence, not the role name alone.

### G07 — S3 — Inventory descriptions repeat stats already shown in comparison rows

- Routes: Animals and item catalogs (systematic).
- Screenshots: `/tmp/alive-gameplay-review/12-002-page.png` and `12-004-table.png`: Salmon HP 5, Tuna HP 8, and other effects appear once in numeric rows and again at the end of Info.
- Evidence: `src/wiki/CatalogEntry.tsx` adds consumption/balancing values as stat rows and then renders all `getItemDescription` rows; the inventory descriptions include their own `createCountable` rows. Example `src/game/assets/descriptions.ts` food descriptions use narrative rows plus the numeric effect row.
- Fix: keep narrative/purpose text in Info and omit standalone inventory stat lines when those same values already have comparison rows. Preserve inline item/sprite references and actual sentences.

### G08 — S2 — Summoned banners are classified as conversational NPCs

- Route: `game-design/characters/npcs.html`.
- Screenshot: `/tmp/alive-gameplay-review/11-006-page.png`, Banner family: five totem portraits, faction only, no NPC interaction.
- Evidence: `src/wiki/catalog.ts:38` classifies every tribe-faction unit as NPC. `src/game/balancing/units.ts:887` defines totems with settler faction and no stats, equipment, drops or behavior. `src/engine/systems/magic.ts:235` selects these definitions for summoned totems and `:269` uses `createTotem`, not a conversational character factory.
- Scope: systematic classification by faction alone.
- Fix: give summoned totems a canonical location under Skills/Totem or Units; keep an NPC index link only if the broader category intentionally includes summoned allies. Document their actual aura function instead of an empty faction-only NPC comparison.

### G09 — S2 — Unit comparisons show unlabeled innate values, not combat values

- Routes: NPCs, Enemies, Bosses and other unit families (systematic).
- Screenshots: `/tmp/alive-gameplay-review/11-004-page.png` (Earth Guard has gear but no armor row), `/tmp/alive-gameplay-review/13-002-page.png` (Prism has no attack row or visible weapon), and the comparison contact sheets.
- Evidence: `src/wiki/CatalogEntry.tsx:242` derives rows only from `unitDefinitions.stats`. `src/engine/systems/damage.ts:301` computes equipped attribute bonuses using NPC caster context, and `:322` adds these to innate stats. Earth Guard equips a Wood Shield (`src/game/balancing/units.ts:295`), which gives Armor 1 (`src/game/balancing/equipment.ts:115`), but no raw armor is defined. Prism's amount-0 hidden sword (`units.ts:1234`) still supplies attacks through `damage.ts:843`; its caster override is Melee 1 (`equipment.ts:262`), unlike the player Iron Sword's default Melee 4. The catalog hides that weapon and has no derived attack row.
- Additional display distinction: the game Stats dialog uses `getEntityDisplayStats` (`src/game/assets/sequences.ts:4500`), which adds 3 to Haste and Vision (`damage.ts:373`). Raw class/stat chart values therefore do not match those displayed numbers unless labeled.
- Fix: explicitly separate innate and equipped totals, and add real caster-aware attack/ability values through engine helpers. Do not infer NPC damage from a link to a player equipment variant.

### G10 — S2 — Command-only stat aliases appear as ordinary consumable items

- Route: `game-design/items/consumables.html` (capture pending fresh-browser retry).
- Evidence: `src/game/assets/commands.ts:137` creates an item alias for every `unitStats` field. `src/wiki/catalog.ts:156` accepts every non-material alias without production-reference filtering. `Widgets.tsx:513` renders all such aliases as player catalog entries. A TypeScript AST scan of production `src/game`, `src/engine` and `src/bindings` found no item literals for maxHpCap, maxMpCap, maxXp or maxXpCap. The only dynamic item-counter construction uses actual consumption counters (`consume.ts:193`); the dynamic visibleStats occurrence is a description lookup, not item creation (`sequences.ts:4558`).
- These fields have generic display sprites (`descriptions.ts:904`, `:919–922`) but no normal gameplay source. Test-menu stat pickups (`src/game/levels/menu/index.ts:100`) must also be distinguished from ordinary obtainable pickups.
- Fix: derive the player pickup catalog from production grants/drops/recipes, and keep arbitrary `/give` aliases in command/development wiki. Retain every command alias in command search.

### G11 — S3 — The class Level 11 row needs an explicit capped/non-playable label

- Route: `game-design/characters/classes.html`.
- Screenshot: `/tmp/alive-gameplay-review/10-003-table.png` and `10-004-table.png`.
- Evidence: `getLevelStats` (`src/engine/systems/leveling.ts:89`) can calculate a level-11 lookup by saturating the last threshold. Actual leveling clamps to the final configured level (`:142–145`, level 10 for Rogue/Knight/Mage and 1 for Scout/Unknown). `wiki/classes.md:7` already says experience stops at level 10 and higher Scout/Unknown rows repeat, so the numbers are not fabricated; however, the green Level 11 row looks equally playable. Normal leveling clamps HP/MP to class caps (`src/game/assets/sequences.ts:3674`), and current level-10 values match those caps.
- Fix: retain the requested level-11 comparison but mark it as the capped lookup/non-playable row; say “Leveling stops at 10” rather than implying XP collection itself stops.

### G12 — S2 — Long loot bundles turn comparison tables into mostly empty scroll areas

- Route: `game-design/cells/containers.html`; similar patterns occur in enemy/drop tables.
- Screenshots: `/tmp/alive-gameplay-review/19-008-table.png` through `19-013-table.png`. At the far-right chest columns and lower vertical offsets, nearly the entire table body is empty because the Wood/Iron Chest loot lists determine the height of one enormous Drops row. The Drops row label scrolls away as well.
- Evidence: `src/wiki/CatalogEntry.tsx` places every weighted bundle into one Drops cell per unit; `src/game/balancing/units.ts:655` onward gives Wood/Iron Chest long distributions. The captured chest table is 1908×1600 inside a 1026×840 viewport. All source distributions sum to 100; the issue is representation, not wrong percentages.
- Scope: systematic tall-cell comparison design.
- Fix: keep the compact combat/property comparison, then represent full loot bundles as structured rows or a separate complete loot section. Preserve each bundle's items and probability together. Avoid a single multi-screen cell that forces empty columns across the comparison.

### G13 — S3 — An invisible internal resource is presented as a standalone visual unit

- Route: `game-design/cells/units.html`.
- Screenshot: `/tmp/alive-gameplay-review/18-006-page.png`: Rotten has a blank Sprite row, HP 1 and worm/no-drop probabilities, with no explanation of what the player can see or harvest.
- Evidence: `src/game/balancing/units.ts:1213` defines Rotten with `sprite: none`, harvestable rotten, and HP 1. It is a shared resource definition rather than its own visible creature portrait; the world uses composed rotten tree cell types in `src/bindings/creation.ts`.
- Fix: document the actual rotten-tree/harvesting representation and link to it; omit an all-empty Sprite row rather than implying a missing standalone portrait.

### G14 — S2 — Plants is complete for selected unit definitions, not for the world's plants

- Route: `game-design/cells/plants.html`.
- Screenshots: `/tmp/alive-gameplay-review/22-contact-00.png` and `22-contact-01.png`: only Cactus, Tumbleweed/Bush, Hedge, Rose, Violet, Clover, Ilex Tulip and Oak Lily families appear.
- Evidence: `src/wiki/catalog.ts:42` defines the plant predicate only over `unitDefinitions` and a name regex; `Widgets` selects only those definitions. Ordinary tree, palm, grass, bush and crop/flower world cells are constructed separately in `src/bindings/creation.ts` and therefore cannot enter this catalog. These are central visible plants used by harvesting/farming, not future design plans.
- Fix: derive the plant index from actual cell/plant creation data as well as unit definitions, showing their real composed world representations. Keep farming growth and harvesting recipe details canonical on their existing pages and link to them.

### G15 — S3 — Structures lacks a representation of its documented visibility change

- Route: `game-design/cells/structures.html`.
- Screenshot: `/tmp/alive-gameplay-review/21-contact-00.png`.
- Evidence: `wiki/structures.md` only contains door/key instructions, a two-row Outside/Inside visibility table and a Building link. Its own roof/interior mechanic has no image, ASCII diagram or scene, while the Construction page covers a different interaction.
- Fix: add one concise outside/inside visual pair or actual-engine house example that shows the disappearing roof and hidden outside cells. Keep construction instructions on Building.

Additional G04 example: Terrain prose/table links ordinary “water” to the elemental Water concept. In `wiki/terrain.md:3` and its Shallow/Deep Water rows, the word denotes world terrain, not an elemental spirit. Automatic noun mapping needs context, not a single global destination for every occurrence.

### G16 — S2 — Worm Boss is shown without an availability distinction

- Route: `game-design/characters/bosses.html`.
- Screenshot: `/tmp/alive-gameplay-review/14-004-page.png`, Worm Boss alongside the reachable boss entries.
- Evidence: a Worm Boss definition, AI pattern and `createCell` branch exist (`src/game/balancing/units.ts:1997`, `src/engine/systems/ai.ts:4304`, `src/bindings/creation.ts:4025`). However, no production level places `worm_boss`, and there is no character legend mapping to it. The generated worm area (`src/game/levels/island/areas.ts:56`, inserted in `island/index.ts:1060`) contains W bait and w sign, mapped to `worm_bait`/`worm_sign` (`creation.ts:932`), not the boss. The boss NPC sequence call is commented out (`creation.ts:4086`).
- Fix: identify it as an implemented/test-spawned encounter unavailable in normal world generation, or keep its implementation details in Development. Do not present its existence in the definitions table as proof of a normal encounter.

### G17 — S2 — Elements shows spirit inventory metadata but not element effects

- Route: `game-design/items/elements.html`.
- Screenshot: `/tmp/alive-gameplay-review/24-contact-00.png`.
- Evidence: `wiki/elements.md` promises elements change spell/equipment effects, but the widget renders only each spirit's Sprite, Material Wood, Element and “used for forging” Info. It never explains Burn, Freeze, Drain/Heal or Air bonuses. Real effect definitions are in `src/game/balancing/equipment.ts` (e.g. Sword fire Burn 3, water Freeze 2, earth Drain 2, air Power 1) and `balancing/abilities.ts`, with context-specific spell differences.
- Scope: local content gap caused by reusing an inventory-item table for an elemental game mechanic.
- Fix: put a concise effect table or meaningful cross-item examples on Elements. Treat Wood on a spirit as engine schema metadata, not the main player-facing property. Link to concrete spell/gear comparisons for variable values.

### G18 — S3 — Rich description punctuation can wrap onto a row by itself

- Routes: Elements and other colored/sprite-rich Info cells.
- Screenshot: `/tmp/alive-gameplay-review/24-003-page.png`, Earth Info ends with a lone period on its own row; Water has the same effect in `24-001-page.png`.
- Evidence: `CatalogDescription` joins source rows but emits separate `ReferenceText` runs for the differently colored element word and the trailing punctuation. The shared Text renderer creates independently wrapping word spans, so the punctuation can break away despite there being no logical space before it.
- Scope: systematic rich inline layout across color/link boundaries.
- Fix: preserve logical words plus attached punctuation as one wrapping unit across styled runs. Keep text selectable and colors/sprites intact.

### G19 — S2 — Wand comparison omits its contact attack, and hybrid actions lack explanation

- Route: `game-design/items/gear.html` (Spear/Wand).
- Screenshots: `/tmp/alive-gameplay-review/26-030-table.png` and `26-035-table.png` show Wand Magic/Time/Range but no contact True damage; the Spear tables show melee stats but do not explain the separate active thrust action.
- Evidence: `CatalogEntry.tsx:144` uses only `getItemStats`. That helper (`src/game/balancing/equipment.ts:350`) intentionally chooses ability stats for Wand and equipment stats for Spear. Spear's active action is `triggerSpear` (`damage.ts:145`), invoked by `castSkill` (`trigger.ts:1122`), and reuses weapon stats rather than a separate ability-stats definition. Wands also have contact True 1 (`equipment.ts:110–112`), and actual contact attacks use `getEquipmentStats` (`damage.ts:843`). The hybrid nature is real: commandItems gives both weapon and skill properties to Spear/Wand, and Slots lists them under both.
- Fix: compare the Wand's two existing attack modes using `getAbilityStats` and `getEquipmentStats`; explain Spear's active thrust separately without inventing an ability-stat schema. Retain one canonical family table and include meaningful mode-specific rows instead of treating inventory display stats as the complete combat model.

### G20 — S2 — Play presets create missing accessory sprites

- Route: `intro/play.html`, Dungeon preset.
- Screenshots: `/tmp/alive-gameplay-review/play-dungeon-loaded.png` and `play-dungeon-focused.png` were inspected at full resolution. Loading Dungeon shows “Equipped ??????” and “SPACE ??????” despite the real engine and movement working.
- Evidence: `src/wiki/presets.ts:92–93` creates Map and Compass accessories without materials. The same invalid item lookup described in G01 applies: material-bearing accessories require their supported material. Actual command defaults define a Gold Map; reuse existing concrete defaults rather than making partial accessory records.
- Scope: every non-Menu preset, since these accessories are populated unconditionally. This is not the intentionally named Unknown character class.
- Fix: use supported actual Map and Compass item definitions. Verify all preset HUD actions after loading.

### G21 — S2 — Building plans have no readable names or work requirement

- Route: `game-design/interactions/building.html`.
- Screenshot: `/tmp/alive-gameplay-review/42-contact-00.png` (all six captured positions inspected). The Structure column contains only a tiny glyph; rows for fence, gate, chair, jetty and other structures cannot be identified reliably.
- Evidence: `src/wiki/Widgets.tsx:662–671` renders only `p.sprite` in the first cell and omits `p.effort`. `src/game/balancing/building.ts:36–47` defines variants, description and effort, with real fence effort 10 at line 66 and gate effort 15 at line 89. The introductory sentence says structures need work without giving its amount.
- Fix: keep the sprite and add the normalized construction name/link; show required work from `effort`. Include actual construction description where it distinguishes otherwise similar glyphs. Keep full plan coverage.

### G22 — S2 — Forging omits upgrade identities and most material stages

- Route: `game-design/interactions/forging.html`.
- Screenshots: `/tmp/alive-gameplay-review/38-contact-00.png` and `38-contact-01.png`, including every inner-scroll position.
- Evidence: `src/wiki/Widgets.tsx:735–752` calls `getForgeOptions` only with `material: "wood"`. It therefore lists Wood→Iron but not later actual material stages. `src/game/balancing/forging.ts:34` derives allowed materials from `materials.slice(0, -1)` and each config provides its material/element rules. Both Base and Result use ItemView's normalized short sprite name (Sword→Sword), and elemental additions all read Spirit, leaving color as the only distinction.
- Fix: derive the complete supported upgrade edges from the real forge helper; show explicit material/element identifiers alongside the ordinary sprite/name. Avoid repeating equivalent rows from command aliases.

### G23 — S2 — Quests lists implementation sequence names rather than playable objectives

- Route: `game-design/interactions/quests.html`.
- Screenshot: `/tmp/alive-gameplay-review/35-contact-00.png`.
- Evidence: `src/wiki/Widgets.tsx:390–411` enumerates exports from `game/assets/quests.ts` and labels raw names such as north2East1Quest. Actual town progression is in NPC sequences outside that module: `src/game/assets/npcs.ts:1619` Earth Druid, `:1809` Earth Smith and `:2245` Fire Smith. The eight export rows are not a complete list of player quests. The page's generic state table describes implementation progression rather than how to complete an available task.
- Fix: document available tasks by NPC/location, prerequisite, objective and reward/unlock, drawing these facts from NPC sequences. Link to NPC entries; keep raw sequence identifiers in Development.

### G24 — S3 — ThreeJS page repeats Development material in Game Design

- Route: `game-design/rendering/threejs.html`.
- Screenshot: `/tmp/alive-gameplay-review/45-contact-00.png`.
- Evidence: `wiki/threejs.md:3–18` covers React, entity geometry, instance buffers, generations and cached geometry. None describes a player-visible feature or interaction; all already have linked implementation pages. The repeated “camera follows viewpoint” statement occurs in the intro, table and final link sentence.
- Fix: retain only useful visible rendering behavior here, with one implementation link. Keep the full renderer pipeline description next to its source.

## Visual observations needing targeted interaction before classification

- Shops (`34-contact-00.png`), Brewing (`37-002-page.png`) and Forging (`38-002-page.png`) render actual popup chrome but empty offer/recipe panes at capture time. These are not reported as confirmed data bugs because the captures may coincide with reveal/initialization timing. Crafting's final screenshot is still a blank framed world. Recheck these scenes after a stable wait and after focusing; verify they demonstrate an actual offer/recipe, not just a dialog shell. The source fixtures create stations and populate ingredients in `scenes.ts:179–187,226–249`.
- Light's demo is still a blank framed world at the two captured offsets (`44-contact-00.png`). The text explains shadow/roof behavior but the scene needs a stable visual check before accepting it as an illustration.
- Actual Play movement was checked: Menu loaded, Dungeon Load changed the preview URL, ArrowRight changed the hero position from (0,0) to (1,0). Escape did not unfocus the full game; this is expected because `preview.tsx` returns early for the full game and retains normal game controls. Do not report that as a snippet Escape regression.

## Coverage and limits

All 48 Gameplay routes were captured and visually inspected through their meaningful window scroll positions. Every oversized comparison table was captured across both axes, including all 76 Gear screenshots and all 55 Spells screenshots. All 403 primary screenshots were visually inspected through labelled contact sheets; selected detailed screenshots and both supplemental Play screenshots were opened separately. The machine-readable record is `/tmp/alive-review-gameplay-coverage.json`. This review used desktop 1440×1000; it does not claim a separate mobile sweep. The shared UI reviewer is auditing responsive behavior. No source files were edited, no tests were rerun, and the repository remained clean at the end of this read-only audit.
