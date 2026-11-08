# Gameplay review fixes

Reviewed baseline: `767e346`. Changes below are uncommitted. The original findings and source evidence are in [gameplay.md](gameplay.md). Reference screenshots remain in `/tmp/alive-gameplay-review/`; revised screenshots are in `/tmp/alive-gameplay-after/`. PNGs are not copied into the repository.

| Finding | Status | Change and source proof |
| --- | --- | --- |
| G01 Interface equipment sprites | Fixed | `InterfaceDiagram.tsx:85–87` imports actual command defaults for Torch and Map. |
| G02 Repeated keyboard introduction | Fixed | `wiki/keyboard-mouse.md` states the nearby/equipped action rule once. |
| G03 Movement key wrapping | Fixed | Arrow keys and WASD occupy separate meaningful Move rows. |
| G04 Geographic Range decoration | Fixed in shared references | `references.tsx:96` distinguishes ordinary lowercase nouns from explicit stat labels. Root owns the corresponding App inference changes. |
| G05 Repeated Levels progression / ambiguous vision | Fixed | `wiki/levels.md` has one progression description and one generated table. `Widgets.tsx:324` labels Base vision; the page explains the modifier. |
| G06 Missing NPC services | Fixed | `wiki/npcs.md` lists character, location and actual service. Earth Druid/Smith unlocks and Fire quests are checked against `game/assets/npcs.ts`. |
| G07 Numeric description duplication | Fixed | `CatalogEntry.tsx:70` removes numeric inventory rows only when their stat is already shown in the comparison. Unique currency values and negative action costs remain. Potion amount/cooldown use `consumptionConfigs` at line 206. |
| G08 Totems listed as conversational NPCs | Fixed | `catalog.ts` routes Totems to Units; `wiki/units.md` explains their summoned aura and links the Totem skill. |
| G09 Innate unit values presented as full stats | Fixed | `catalog.ts:240` uses `generateUnitData`, real equipment slots, `getEntityDisplayStats` and `getEntityEquipmentStats`. NPC-specific item attacks use `getEquipmentStats` / `getItemStats`; Prism's hidden weapon override is tested. `wiki/stats.md:5` states precisely what the values mean. |
| G10 Command-only stat aliases in normal consumables | Fixed | `itemVariants` requires production references for stat pickups. Full aliases remain searchable in Chat's command registry; exact command keys are printed separately from native item names. |
| G11 Level 11 availability | Fixed | `wiki/classes.md:3` distinguishes capped lookup values from playable levels, and Scout/Unknown's level-one cap. |
| G12 Giant container loot row | Fixed | `CatalogEntry.tsx:456` renders complete correlated loot bundles as probability rows below the family comparison. Short variant columns no longer share one huge Drops cell. |
| G13 Invisible Rotten preview | Fixed | Rotten omits its empty Sprite row; `wiki/units.md` identifies it as the invisible harvestable part of a fallen tree. |
| G14 Missing factory-created flora | Fixed | `WorldPlants.tsx` calls real `createCell` factories for Tree/Apple, Palm/Banana/Coconut, Oak, Bush/Berry and Grass/Flower. It renders actual sprites/inventory overlays and imports tool/work/yield data. The Plants overview includes these families before combat plants. |
| G15 No roof/interior illustration | Fixed with root scene | `wiki/structures.md` embeds the actual `structures` scene, which unlocks and enters a real house. Root verified the structure layer transition. |
| G16 Worm Boss availability | Fixed | `wiki/bosses.md:5` says it does not spawn in normal generation and can be test-spawned. |
| G17 Missing elemental effects | Fixed | `wiki/elements.md` describes the actual sword effects and context-dependent spell effects, with Gear/Spells links. It retains the full spirit comparisons. |
| G18 Punctuation alone after colored text | Fixed with shared UI agent | `CatalogDescription` groups logical words before color runs, keeping punctuation attached across style/link boundaries. |
| G19 Hybrid weapon modes | Fixed | Wand shows contact True damage from `getEquipmentStats`; normal ability values remain from `getItemStats`. `wiki/gear.md` explains Wand contact/cast and Spear contact/thrust. |
| G20 Missing preset accessories | Fixed by root | `presets.ts:90–91` uses actual Map/Compass command defaults. |
| G21 Unnamed Building plans / missing work | Fixed | `Widgets.tsx:660` shows normalized plan names and `effort`, alongside all real parts/grounds/levels. |
| G22 Incomplete / ambiguous Forge paths | Fixed | `Widgets.tsx:736` derives every reachable plain material base through `itemVariants` and `getForgeOptions`, with explicit material/element identities. `wiki/forging.md:5` explains preservation of an existing element, avoiding repeated equivalent elemental material edges. |
| G23 Implementation IDs instead of playable quests | Fixed | `wiki/quests.md` documents actual tutorial flow, Earth Chief progression, Druid/Smith requests, Fire Haven requests, Nomad schema and grave recovery. Objectives/rewards were checked against NPC sequences, including each random request option. |
| G24 Repeated ThreeJS implementation material | Fixed | `wiki/threejs.md` states visible orthographic/sprite/camera behavior, then links the detailed implementation. The repeated pipeline and buffer table are removed. |

Additional changes from the review:

- Damage now follows rules and formula → Calculate A Hit → Contact Attack.
- The Stats table has explicit `stat-*` anchors and real `StatLabel` rows, separating stat concepts from collectible items.
- Chat's alias search uses the full command registry, matches case-insensitively, identifies aliases with identical native display names, uses real Bolt/Blast particle sprites, and avoids missing artwork for the generic Resource alias.
- The Light page uses an actual occlusion scene instead of movement. Root verified the scene and the real House entry example.

Verification:

- Targeted catalog and preview suites passed: 23 tests, including equipped defense, NPC contact damage, canonical Totems, obtainable stat pickups, real fruit trees/Oak cells, multi-cell Oak alignment, numeric description filtering retained Ingot currency values, native material links and stat-property destinations.
- Type checking and lint passed after the gameplay changes; the root agent is running the final combined checks.
- `npm run wiki:build` passed and produced 244 Markdown routes, including the new adjacent World Plants implementation page.
- Selected revised desktop screenshots and a 390px Plants screenshot were inspected: Interface, flora, container comparison, Prism attack values, consumable descriptions, Forge identities, player quests and NPC locations.
- All 48 revised gameplay pages were scrolled and visually inspected: 430 screenshots across 94 labelled contact sheets, including horizontal and vertical comparison-table scrolling. Capture recorded zero runtime errors and zero document overflow. The machine-readable result is [gameplay-after-coverage.json](gameplay-after-coverage.json).

New visual observations:

- The first expanded Forge implementation repeated elemental material edges and made the table much longer without adding a new rule. It was compacted to all plain material bases plus the verified element-preservation rule before the final capture.
- The real Oak factory refuses an occupied sample cell. The flora fixture clears only its sample position through map helpers before calling `createCell(..., false)`. The fruit-tree and two-cell Oak representations are tested.
- Initial blank station snapshots were loading/initialization states, not proof of missing recipe data. Root's stable checks now show actual Craft/Brew/Forge dialogs and executable offers; the fixtures contain the required materials.

## Findings from the revised pages

| Finding | Source and observed problem | Resolution |
| --- | --- | --- |
| G25 — S2 — Tick Timers labels raw Haste as displayed Haste | `Widgets.tsx` TimerData passed 0/1/5 to `getHasteInterval`; the native Stats display adds 3 through `getEntityDisplayStats`. Screenshot `08-contact-00.png`. | Labelled the values Base Haste; intervals remain source-derived. |
| G26 — S2 — Class attribute rows use raw Haste/Vision | `Widgets.tsx` Classes read classDefinitions.stats directly for these rows while other character tables use the native display helper. Screenshot `10-contact-00.png`. | Attribute rows now use `getEntityDisplayStats`; HP/MP progression still uses `getLevelStats`. |
| G27 — S2 — Loot variant names disappear through native name normalization | `CatalogEntry.tsx` sent Wood Chest/Ilex Chest/etc through ReferenceText, which correctly chose the shared native name Chest but lost the variant identity. Screenshot `19-contact-01.png`. | Uses native UnitView plus an explicit plain second-line variant label. Variant header keeps the frozen column narrow. |
| G28 — S2 — Berry/Flower carrier overlays missing | Some `createCell` pickup entities store POSITION on ITEM.carrier. WorldPlants skipped those entities, producing plain Bush/Grass variants with empty pickups. Screenshot `22-contact-00.png`. | Resolves the actual carrier position; tests now assert Berry and Flower pickup records. Empty pickup rows are omitted for flora with none. |
| G29 — S2 — Item/unit registry collision | Root identified item golem (native Head) being overwritten by unit golem in the flat reference registry. | Root introduced typed item/unit reference keys and updated native ItemView/UnitView links. |
| G30 — S3 — Head wording and quantity repeat native data | Quest text said “Bring 3 [Head] heads”; other amounts preceded uncounted tokens. | Uses counted item tokens, including `[[item:3 golem]]`, preserving the native count/sprite/name order. |

The Elements effect table identifies Fire, Water, Earth and Air as element types, rather than displaying four inventory items all named Spirit. Native spirit portraits remain in their full entries.

### G31 — Multi-cell tree alignment

The full-resolution revised Plants capture (`22-002-page.png`) showed an Oak trunk shifted left because each cell was cropped independently. `LargePreview` now accepts a vertical sprite stack, composes the actual pixel grids, and crops the combined result once. A native Oak canopy/trunk test checks that the trunk retains black margins on both sides. Single-cell callers retain their original path.

### Drop-layout scope

Every non-container drop array in `game/balancing/units.ts` was checked, with no dynamic/unknown arrays. The largest is Orb at line 1356: three probability bundles and eight item lines, or eleven rendered lines (about 352px). Clover has ten lines; Gold/Diamond Orb eight; Prism/Eye seven. These fit within the 840px desktop table viewport and were visually inspected. The separate complete probability table remains specific to containers, whose lists caused the multi-screen row. The AST count evidence remains `/tmp/alive-gameplay-after/noncontainer-loot.json`.

### G32 — Preserve unique numeric descriptions

The revised Resources screenshots showed Ingot and Nugget descriptions ending at “worth”: the first numeric-row filter also removed currency values that had no matching table row. `CatalogEntry.tsx:70–98` now checks for a stat sprite actually present among the comparison rows before removing a numeric description. The Ingot regression test preserves its 1000 Coin value. Final `27-contact-01.png` visibly shows 1000 Coin and 10 Coin in the descriptions.

### Final shared-text observations

- G33 — S2: `wiki/light.md:3` uses “block” as a verb, but inference linked it to the Block skill in `44-contact-00.png`. Fixed centrally: ordinary prose infers feature concepts only; actual items and units use typed components or explicit Markdown tokens. Final Light screenshots retain the ordinary verb without a skill image/link.
- G34 — S3: Gear's first paragraph (`wiki/gear.md:3`) placed its final period alone on the next line at 1440px, in `26-000-page.png`. Fixed centrally with attached inline suffix handling. Final Gear screenshot keeps the period with “item.”
- G35 — S3: Harvesting prints source category identifiers such as `desert_husk` and `footing` through ReferenceText (`Widgets.tsx:694`), and non-crop Farming results print `c.cell` (`Widgets.tsx:717`). The lists and values are complete and source-derived, but these targets lack consistent native names and sprite illustrations. The map agent replaced these keys with native UnitView / ItemView and real factory-backed CellReference entries, including every matching variant. Construction plots use the exact performPlot sprite. Two browser regressions passed. Final desktop table scrolls show the complete native target/result columns, including layered Oak, all matching Hedge/Cactus variants, construction remains and grown fruit trees. First 390px viewports also passed visual inspection with no document overflow.

The final screenshot pass checked every page's reading flow and table contents. The additional screenshot findings above are separate from runtime/link validation; a valid destination alone does not prove that automatic inference chose the right concept.


### Explicit entity references

After shared inference was limited to page concepts, all 48 gameplay Markdown sources were checked for named entities. Sixteen pages now use explicit item/unit tokens for references such as Spear, Wand, Torch, Hammer, Hook, Sign, Worm, fish catches, Worm Boss and NPC quest participants/rewards. Chick/Rotten keep plain prose because their native names are empty. Potion alternatives carry their own count before the native sprite/name. A filled Bucket explicitly uses Iron/Water, matching its illustrated state. Generic equipment/material prose remains conceptual; direct command names `bolt` and `blast` use code text, while their existing dedicated effect comparisons use real particle templates.


### Final reference verification

The final shared-reference change was checked on 18 affected gameplay routes: 71 supplemental screenshots, including their first 390px viewports and full updated target tables. Six additional screenshots verify the last Animals/Chat prose corrections, typed Material/Stat cells and final Gold harvest row. All were inspected. Supplemental captures recorded no runtime errors or mobile document overflow. The original 430 screenshots retain complete page/table scrolling coverage for all 48 gameplay pages.

G36 — Native catalog property references: Material cells had implicitly depended on item-name inference. They now render typed resource ItemView entries. Potion Stat cells use StatLabel, separating a stat definition from a collectible HP/MP drop. Two component regressions prove native Wood artwork/item links and HP stat-definition links. Element property labels are capitalized concept references.

G37 — Blank native names: Chick and Rotten have empty native display names. Their prose remains plain “Chicks” / “Rotten”; their existing catalog representations are unchanged. This avoids a sentence beginning with an unlabeled icon or a fabricated native label.


The final Gold harvesting row is reachable through the table's own vertical scroll. At scrollTop 2040 of 2880px content, its complete row occupies y936–968 in the 1000px viewport, exactly at the table bottom. `harvesting-gold-bottom.png` and the adjacent geometry JSON record this check. There is no remaining truncated category entry.

Final gameplay visual evidence totals 507 screenshots: 430 complete page/table captures, 71 focused final-reference captures and six last checks. All were inspected. Source edits remain uncommitted.
