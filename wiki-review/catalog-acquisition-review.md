# Catalog and Item Source Review

Reviewed all 16 affected catalog pages at 1440 × 1000 and 390 × 844, scrolling their full content and equipment comparison columns. Inspected 513 full-pass screenshots and six final source-row screenshots in `/tmp/alive-catalog-final`; coverage is recorded in `catalog-acquisition-coverage.json`. Screenshots stay outside the repository.

| Feature | Result | Game source |
| --- | --- | --- |
| Classes | Plain Class header; native Extra stats without gaps; one aligned progression row with eleven HP/MP lines | `classes.ts`, `leveling.ts`, native class descriptions |
| Factions | Actual exported kills sprite; friendly cells empty | `sprites/terrain.ts`, `isFriendlyFire` |
| Fish | Native Consume effects and sell prices | `consume.ts`, `trading.ts`, fishing distribution |
| Elemental equipment | Shared Extra stats row; no fabricated default Fire element | `equipment.ts`, `abilities.ts`, unit equipment definitions |
| Potions | Native Consume amounts and cooldowns; removed redundant Stat row | `consumptionConfigs` |
| Totem | One native Aura row with four colored bonuses | `abilities.ts`, exported Aura sprite |
| Slash | Visible native Knock value | `abilities.ts` |
| Enemies | Related overview columns; Rose, Violet and Clover under Enemies | Current unit definitions and AI patterns |
| Plants | Actual factory fruit/inventory layering and common portrait bounds | `createCell`, `worldRows`, harvest configuration |
| Golem | Native dormant/awake factory and AI composition; one-cell native limb icon | `creation.ts`, Golem AI, `getUnitSprite` |
| Drops | Native chance frames with counted item references, no list gaps or wrapping | Actual unit drop distributions |
| Resources and food | Complete focused families, canonical cross-page links | Command definitions, actual recipes and fishing items |

Every item comparison now lists acquisition sources by full item identity, preserving material, element and potion stat. These come from unit drops, harvest yields, real factory plant inventories, crafting, brewing, forge options, shop stock, fishing catches, native Dungeon generation, literal NPC reward items and natural AI output. The build extracts NPC rewards and natural Chick eggs into metadata, retaining source lines and rejecting unresolved reward expressions. No item is declared normally available solely because its sprite exists.

Recipe availability follows obtainable ingredients. Unsupported Diamond/Ruby resources and Fire/Water spirits remain marked Test Mode, while real Earth/Air sources and reachable upgrades stay available. Pearl appears in a habitat configuration and Menu specimens, but the actual fishing outcome tables contain no Pearl; it therefore retains Test Mode.

The visual/source review found and fixed these additional issues:

| Finding | Fix and evidence |
| --- | --- |
| Wood Sword incorrectly marked Test Mode | Executed native `addToInventory` on the temporary Dungeon hero with an actual Stick; the engine creates the Sword when unarmed (`collect.ts:349–385`). Source reads Collect unarmed: Stick. |
| Resources crashed when displaying natural Berry/Flower sources | Added the actual `berry_one` and `flower_one` cell mappings, matching `WorldPlants` and the cell factory. Native cell-reference regressions cover every natural plant pickup. |
| Visible rocks produced empty source names | Shared UnitView uses source-name fallback only for visible unnamed sprites. Invisible Rotten remains plain text. |
| Native underscore names were not capitalized | Shared UnitView normalizes actual source names, preserving native sprite and color. |
| Charge only listed Shops | Executed native `dropEntity` using the real charged-target state; source also lists Combat (`damage.ts:949`, `drop.ts:282–315`, invincible AI drop phase). |
| Filled Bucket incorrectly marked Test Mode | Executed native `refillWater` using the existing crafted Bucket definition. Its source reads Fill at Water and requires an obtainable empty Bucket (`harvest.ts:672`). |

Verification completed by this task: 37 focused catalog/preview/acquisition Jest tests; four metadata extraction Node tests; five focused Chromium comparison tests; global TypeScript; scoped ESLint; and a successful wiki build of 257 Markdown routes. The final Charge and refill additions each passed the acquisition test again. Root runs the final combined wiki/browser checks.

The capture log preserves one historical Resources error from before the cell mapping fix. Resources rendered successfully on the following full pass. Capture retries also handled a development rebuild navigation abort and a transient font wait; these did not reproduce as page errors. Native popups and previews are additionally covered by the root agent's focused review. Wide comparisons scroll locally; their partial edge columns in intermediate screenshots are expected native scrolling, not word wrapping.

The final six screenshots (`source-sword-*`, `source-charge-*`, `source-bucket-*`) verify the pickup, Combat and Water refill source rows at both widths. Their browser pass reported no runtime errors or page overflow. The final global TypeScript and scoped ESLint checks also passed after these additions. All owned source edits are frozen and uncommitted.
