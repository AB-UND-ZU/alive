# Catalog checks

The latest catalog changes are uncommitted.

| Change | Native source |
| --- | --- |
| One Damage row with counted Melee, Magic and effect stats | `unitComparisonStats`, equipment helpers and NPC caster overrides |
| Adds separated from roaming enemies and Elites | Ilex Tulip, Oak Tower, Oak Lily and Oak Hedge creation in `engine/systems/ai.ts`; Golem Limb factory in `bindings/creation.ts` |
| Sign under Units | Explicit requested taxonomy; the Sign definition remains unchanged |
| Enlarged Rotten body | All three fragments from `createCell("rotten_stem_right")`, composed by `worldRows` and `previewGridRows` |
| Complete ordinary Tree and Palm body variants | Existing `tree1`/`tree2` and `palm1`/`palm2` factory choices; Apple, Banana and Coconut keep native inventory layers |
| Torch and Boots under Accessories, with all upgrades | Native forge traversal and Wood/Iron/Gold equipment stats |
| Compact drop bundles | Shared native Frame with intrinsic compact sizing; empty outcomes remain omitted |
| Nonfinite effect-item counts | Shared Count renderer, including the native ninePlus glyph |

Golem Limb has a separate comparison family so its shared Golem sprite name does not merge an Add into the elite body comparison. Ordinary plant Hedges stay on Plants; boss-created Oak Hedges stay under Adds.

Verification passed: 38 Jest tests in catalog, LargePreview and CatalogEntry; six catalog browser tests; TypeScript; scoped lint; documentation build with 270 routes. Tests cover native mixed damage, exact accessory tiers, actual plant variants, complete multi-cell pixel positioning, Sign routing, separate Golem/Limb entries and existing class spacing.

Visual inspection covered 20 desktop/phone visits across Plants, Enemies, Gear, Units and Containers. Every saved contact sheet was inspected, including horizontal comparison endpoints. No runtime errors were observed. Checked green Contents group alignment, body/fruit layering, the large Rotten portrait, native one-cell Limb, accessory upgrades, narrow layouts and compact frame edges. Images and coverage remain in `/tmp/alive-catalog-new-visual`; the coverage list is copied beside this report.

The final plant-state audit also adds both native Stump, Husk and Desert Husk variants, plus Oak Root. These are actual cell-factory choices in `bindings/creation.ts:1857`; they retain their native slotShadow, Shovel requirement, one unit of work and Stick yield. No living Desert Palm body or factory exists in current source, so no extra body was invented. The Oak Root is offset one cell below the canopy, matching the native tree structure. The updated catalog suite passes 27 tests; typecheck, scoped lint and diff checks pass. Desktop and phone remains screenshots are in `/tmp/alive-plant-remains-visual`, including individual narrow-view checks of every new remains variant.
