# Engine documentation fixes

Scope: 137 Development routes: Engine 23, Entities 2, Systems 36, Components 76. Baseline findings and screenshots are in [Engine review](engine.md); the baseline is `767e346`.

| Finding | Resolution | Source evidence |
| --- | --- | --- |
| E03 — Incorrect component roles | Corrected Shootable, Fishable, Liquid, Buildable and Warpable. Marked Spikable as legacy data, not the current damage source. Also clarified Coverable, Blockable, Collectable, Melee and Rechargable. | Current consumers in Ballistics, AI, Water, Build, Enter, Spike and Damage; Spikable history `e7bea9e` and `af803c3`. |
| E04 — Filename-only contracts | Authored the 15 bare Engine pages and Entity Factories. Contract tables cover their public functions/registries, state or coordinate conventions, setup and meaningful failure cases. The generator now rejects missing module documentation before writing any files. | Hooks, WFC, descriptions, NPC sequences, templates, asset helpers, building/classes/forging/harvesting/unit data, matrix/std/tracing, sound and entity factories. |
| E05 — Query dumps without behavior | Rewrote all 36 Systems pages around resulting behavior, eligibility guards, state changes and significant ordering/dependencies. Removed query-only code frames. Kept examples where they demonstrate an actual contract. | Each page checked against its corresponding system and `ecs.ts:createSystems`; ECS order includes Freeze/AI before Trigger and Push/Spike/Damage before Movement. |
| E06 — Repeated schema tables | Removed Field/Type copies from all 76 component pages. Each generated declaration remains once, with its existing type anchor. Retained compact meaning/unit/ownership tables only where they add information. Removed Sequencable's serialized state field cell. | All 229 scoped top-level declarations match current TypeScript after whitespace normalization. |
| E07 — Tests presented as installed systems | Removed grep-like Systems lists, including seven lists containing test modules. Added explicit relative Markdown links to actual writers/readers and documented ownership where useful. | The actual system registry in `ecs.ts`; Position links to map registration/movement helpers rather than tests. |
| E10 — Ambiguous names | Replaced Index pages with Sprite Templates and Sound; authored WFC, AI, World Hooks, Entity Factories and other meaningful titles. Shared title normalization preserves acronyms. | Markdown page titles and generated navigation. |

E01/E02 reference resolution and E08/E09 glyph/code-frame rendering were corrected by shared UI changes; their final checks are recorded in the main review report.

The 284 explicit Markdown links in scoped authored prefixes identify the intended source module, rather than depending on automatic matches for words such as map, trigger or action. Schema declarations are generated; the purpose, contracts and meaning tables are authored. Re-running the generator preserves authored code examples and stable type anchors.

## Verification

- `node --test scripts/docs/types.test.mjs`: both feature tests passed. They check authored-example retention, schema refresh, stable anchors, idempotence, and rejecting missing contracts without partial updates.
- `npm run docs:types`: 247 source declarations generated.
- `npm run docs:build`: 243 routes built.
- All 137 scoped source pages scanned: no Queries sections, duplicate Field/Type schema tables, or test-module Systems lists. All 229 scoped type/interface/enum declarations match source.
- Scoped `git diff --check`: clean.


## Revised browser coverage

**137/137 routes** were loaded in Chromium at 1440×1000 and scrolled through their full window content: 357 scroll steps. All 333 main screenshots were visually inspected through 28 labelled contact sheets. The four navigation screenshots were inspected as a separate sheet. All 56 overflowing code/table regions were exercised; the ten tall API tables received 20 additional middle/bottom screenshots, inspected through four sheets. Sticky headings, complete final rows, internal scrolling, font cells, dialog edges and navigation were checked.

The scan recorded 77 tables, 236 code frames and 819 rendered links, with **zero page/runtime errors and zero horizontal page overflow**. These are observed link counts, not proof that every link was clicked; the shared link audit covers destination validity. [Route coverage](engine-after-coverage.json) records every route, measurements, source, links and screenshot paths. Captures remain under `/tmp/alive-review-engine-after/`; image files are not checked in.

Sequencable decreased from 33,672px to 18,464px at the same viewport. Its field-meaning table has three rows; the complete generated state declarations remain below, with no giant serialized field row. All component schema tables were removed; useful meaning tables remain. The ten tall tables now document actual public contracts rather than duplicate type syntax.

Fresh screenshots checked the final Shootable wording, POI acronym and representative Engine links after the shared metadata changes. The Shootable first sentence still described shooting in the initial revised scan; visual inspection caught it and it was corrected to explain stuck-arrow recovery. A redundant full reload timed out during this final recheck under concurrent browser load; subsequent screenshot capture reached the corrected pages. The primary 137-route pass completed without timeouts.

The generated Sequencable state family remains long because every actual type and anchor is retained. This review covers desktop source documentation and its scroll regions; it does not claim every engine interaction or responsive size was tested.
