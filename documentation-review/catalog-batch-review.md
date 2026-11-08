# Catalog and gameplay review

33 pages in Characters, Combat, Cells, Items and Interactions were opened at 1440 × 1000 and 390 × 844. Each desktop page was scrolled to its end. Wide tables were scrolled across every column, then down their full natural height. All 428 captures were visually inspected. Coverage and screenshot filenames are in `catalog-batch-coverage.json`; images remain in `/tmp/alive-catalog-review`.

No captured route raised a runtime error or caused horizontal document overflow at either viewport. Tables and long headings retain local horizontal scrolling.

| Check | Result | Source |
| --- | --- | --- |
| Class choices | Rogue, Knight, Mage and ??? match the native selector. Scout is excluded. Extra stats use the selector descriptions. Eleven compact HP/MP rows use real leveling data. | `Widgets.tsx`, `game/assets/pixels.ts`, `engine/systems/leveling.ts` |
| Stat references | Numeric properties use native amount, icon and name. Every visible stat has a Stats anchor, including equipment parameters. | `Widgets.tsx:379`, `CatalogEntry.tsx`, shared `StatLabel` |
| Factions | All ten factions appear in a directional hit matrix, with native hit and ghost symbols. | `Widgets.tsx`, `engine/systems/damage.ts:isFriendlyFire` |
| Preview alignment | Variants share source pixel crop bounds; small sprites keep their actual height. | `LargePreview.tsx`, `CatalogEntry.tsx:380` |
| Plant fruit | Actual factory entities are rendered through worldRows, preserving inventory resource sprites, quantity/facing layers and native ordering. | `WorldPlants.tsx`, `WorldDiagram.tsx` |
| Drops | All probability bundles remain inside their entity comparison columns in native frames. Boss Chest is excluded. | `CatalogEntry.tsx:517`, `catalog.ts:isDocumentedUnit` |
| Elements | The effect overview reads gearStats and abilityStats. Element cells link the actual spirit. Lookup-only Wood material and repeated Element rows are omitted for spirits. | `Widgets.tsx:660`, `CatalogEntry.tsx` |
| Item defaults | Bare material-dependent references use the command template. All referenced production items resolve to a native item or direct-cast effect sprite. | `catalog.ts:92`, `catalog.ts:141` |
| Trading | Shops contains the complete current price data and actual dialog scene. Trading is retained only as an alias. | `docs/shops.md`, `Widgets.tsx` |
| Keyboard text | Owned gameplay pages use control tables or isolated key paragraphs rather than 48px keys inside prose. | Gameplay Markdown |

## Findings addressed during inspection

| Finding | Evidence | Fix |
| --- | --- | --- |
| Frame probability and Respawn filename were accessible labels only. | `17-000-page.png`, `13-003-page.png` | Shared Frame gained a visible native title tab. Callers now pass RESPAWN.TXT and actual probability. Fresh screenshots pending. |
| Worm/Golem factory diagram included fixture ghost or lacked oriented fragments. | `13-010-page.png`, `14-005-page.png` | Root removed the fixture hero immediately, gave Worm native facing and cropped unassigned-room diagrams to occupied cells. Fresh screenshots pending. |
| Golem Limb used the humanoid balancing icon although the factory makes rock segments. | `13-010-page.png`; `bindings/creation.ts:3170` | Portrait now uses the factory's exact mergeSprites(shadow, rock1). |
| Spear/Wand descriptions repeated native blocked Slot metadata in prose. | `25-002-page.png`, `25-004-page.png`; `game/assets/descriptions.ts:1121` | The description normalizer omits only the negative Slot metadata row. Useful narrative and action costs remain. |
| Diamond/Ruby descriptions claimed a Mine and rendered a missing Mine icon. | `26-013-page.png`; `descriptions.ts:1638`, `harvesting.ts:88` | Omitted that false location row for Diamond/Ruby resources. Native colored forging description remains; real Gold Mine unchanged. |
| Some bare consumables had no material default. | Key references on Structures; native command templates | Central previewItem covers consumables and spells. ItemView now shares it. Explicit materials are preserved. |
| Forging material/element lines used plain element words. | `37-001-page.png` | Base/result element lines now use actual native linked Spirit components. |
| Numeric quest XP rewards used a separate number and inferred label. | `34-002-page.png` | Explicit counted XP references now preserve native amount/icon/name ordering. |

The full native item probe found only two raw getItemSprite missing results: bound Wood Bolt and Iron Bolt NPC effects. They have no inventory sprite. The existing Parts helper intentionally renders their real particle templates through getEffectSprite, and the final regression checks that rendered choice.

## Shared follow-up

- Terrain and Harvesting frozen first columns use long native labels. Phone screenshots `20-004-mobile-data.png` and `38-007-mobile-data.png` show too little remaining data space. Reported to the shared table owner for whole-word wrapping.
- Native one-word three-line headings scroll locally on phones. The shared heading owner added an element key to reset title scroll between routes. No midword breaking or altered font scale was added.
- Forge autoplay ended on an invalid second Sword addition in `37-035-page.png`. Reported to the scene owner for correction and a fresh scene capture.
- Shared glyph paint investigation was active after the initial capture. Fresh representative screenshots are required after that fix settles.

## Checks

- 31 catalog, native description and large-preview Jest tests passed.
- TypeScript, scoped ESLint and diff whitespace checks passed after the Golem Limb/sprite wording adjustment. The final blocked-slot change also passed scoped ESLint and all31 focused tests; the root task runs aggregate checks.
- Five catalog/comparison browser regressions passed. The command frame regression passed after replacing an obsolete row selector with exact native text matching.
- `git diff --check` passed before the last small edits; the root task runs the final aggregate check.

All changes remain uncommitted.

## Final native rendering pass

Eleven targets were recaptured after the shared native font correction: Respawn, Elements overview, Spirit details, Diamond resource, Golem, Worm, Sword, Slash, Containers, Terrain and Harvesting. All22 desktop/phone images were inspected. The actual `.CellGlyph` computed smoothing was `none` before capture. No runtime errors or horizontal document overflow occurred.

Visible RESPAWN.TXT and probability tabs now use the native frame. Spirit values and native stat amounts are linked. Diamond no longer advertises a nonexistent Mine. Worm and Golem show actual factory fragments without a fixture ghost; Golem Limb shows its actual rock sprite. Slash's previously empty row now reads Knock with its real value. Terrain and Harvesting phone labels wrap between whole words, leaving room for data columns.

One remaining shared frame issue was reported: a counted Nugget token overruns a narrow DropDialog's right rule by about one character (`final-drops-desktop.png`). The shared table/frame owner is adding the native frame padding to the measured child minimum. Forge was not captured in this pass because the lazy frame had not mounted before the target selector waited; the scene owner took the browser slot for its final live probe. Classes is also queued with that owner after the shared compact Level fix.
