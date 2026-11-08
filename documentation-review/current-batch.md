# Current Documentation Fixes

Baseline: `767e346`. All later changes remain uncommitted; nothing was deployed. The subsequent fixes and final checks are recorded in [Latest Documentation Fixes](latest-followup.md).

| Area | Current behavior | Evidence |
| --- | --- | --- |
| Text and code | Continuous selectable text; normal word selection and clipboard content. Single glyphs use the font; only stacked sprites use composed drawings. Code has one selectable source tree. Unicode aliases reuse native glyphs. | [Text tests](../scripts/docs/tests/text.spec.cjs), [Row source](../src/components/Row/index.tsx) |
| Controls and previews | Native engine, input, camera, dialogs and scene controls. Unused HUD rows are removed without clipping the frame or stats. Popup autoplay waits for native readiness. | [UI review](ui-fixes.md), [final page review](gameplay-final-review.md) |
| World | Restored Island schematic; adjacent compact Dungeon rooms; native green warp frames with exactly aligned data rows. Four Minimap zooms share one explored Island. | [World review](world-fixes.md) |
| Classes | Levels 1–10. Padded values precede native HP/MP icons, separated by one character. | [Catalog review](catalog-resumed-review.md), [class browser checks](../scripts/docs/tests/catalogs.spec.cjs) |
| Items and units | Native portraits, backdrops, equipped Scout examples, proper category ownership, compact stat and drop comparisons, actual Oak Boss chest spawn. | [Catalog review](catalog-resumed-review.md) |
| Obtaining items | Native drops, harvesting, natural pickups, shops, quests and ingredient recipes. Sources use grouped frames; unsupported Test Mode obtaining rows are omitted. | [Source groups](../src/documentation/AcquisitionSources.md), [source metadata](../src/documentation/itemSources.md) |
| Maps | The Map item keeps its native yellow sprite. Levels and world-map concepts use the green warp icon. | [Reference tests](../src/documentation/references.test.tsx) |
| Farming and structures | Actual dry-soil-to-Wheat progression; native Wood House and Desert Fort exterior/interior views; Portal, Lever and Sign details. | [Crop growth](../src/documentation/FarmingProgression.md), [structure media](../src/documentation/StructureOverview.md) |
| Dialogs and commands | Native popup specimens, direct command execution, search and native completion. | [Flow review](final-flow-review.md), [dialog sources](../src/documentation/DialogSnapshot.md) |

All 49 player pages were visually inspected on desktop and phone. The review records 348 screenshots across 138 visits, with later corrections captured separately. [Page coverage](gameplay-final-coverage.json) and [findings](gameplay-final-review.md) distinguish final images from earlier references. Existing Chromium capture omissions are recorded; screenshots do not establish every item interaction or audible speaker output.

Verification from the preceding complete pass:

- TypeScript, lint and 214 fast tests passed across 37 suites.
- All 65 slow tests passed across 11 suites.
- `npm run docs:test`: 8 Node checks and all 69 Chromium checks passed in the final full run.
- `npm run docs:types`: 252 source types documented.
- Production game build and documentation build passed; the Pages subtree contains 270 Markdown routes.
- All 270 routes were audited: 6,845 internal links and 5,593 anchors; no broken destinations, runtime/HTTP errors, duplicate IDs/prose, document overflow or unrendered player markup. [Measurements](current-route-audit.json).
- Built `/docs` subtree smoke check passed on eight desktop/phone visits, including direct routes, Class rows and a live native scene. No HTTP/runtime errors or page overflow. [Production checks](production-smoke.json).
- `git diff --check` passed.

Builds retain the existing Browserslist, Babel dependency and missing MediaPipe source-map notices. Jest reported open-timer teardown warnings; all test assertions passed.

Preview locally with `npm run docs:dev` at `http://127.0.0.1:4173/`.
