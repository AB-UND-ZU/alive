# Documentation review

Baseline: `767e346` (`Build game-style documentation with live previews and source catalogs`). Subsequent changes are uncommitted for review.

Latest fixes and evidence: [Release Visual Review](release-visual-review.md). The checks cover 270 routes and all 49 player pages. Earlier complete reviews remain below with their original scope.

## Earlier visual coverage

| Area | Routes | Screenshots | Findings |
| --- | ---: | ---: | --- |
| Gameplay | 48 | 403, plus Play checks | [Gameplay](gameplay.md) |
| Engine, Entities, Systems, Components | 137 | 347, plus navigation/table checks | [Engine](engine.md) |
| UI, Docs, Types | 57 | 233, plus mobile/manual checks | [UI](ui.md) |

Every route was loaded, scrolled and visually inspected. Wide/tall content scrollers were exercised separately. Coverage JSON files record routes, scroll positions and screenshot names. Original captures remain under `/tmp/alive-gameplay-review`, `/tmp/alive-review-engine` and `/tmp/alive-review-ui` in this workspace. These are desktop content reviews; they do not establish that every game interaction or responsive size works. Mobile samples and actual movement/copy checks are identified in the individual reports.

## Reference sites

Both wiki homepages and item articles were inspected in Chromium, including scrolling. These observations guide structure and wording; their game rules are not evidence for Alive.

- [RealmEye](https://www.realmeye.com/wiki/realm-of-the-mad-god) groups navigation by game concern. [Swords](https://www.realmeye.com/wiki/swords) states who uses the weapon and its tradeoff, explains shared behavior once, then compares named, pictured variants with consistent measurements. Alive should explain common behavior before its comparisons and label exceptions where they occur.
- [Minecraft Wiki](https://minecraft.wiki/) puts visual topic entry points near the top and separates help for players from creator material. [Sword](https://minecraft.wiki/w/Sword) starts with a concrete definition and a pictured facts panel, then separates obtaining, use and statistics. [Damage](https://minecraft.wiki/w/Damage) distinguishes the mechanic from other meanings before detailing cases. Alive should use short definitions, meaningful concept links and clearly labelled measurements rather than automatic word matches.

Keep Alive's requested comparison orientation, native font, colors, controls and Markdown sources. Do not copy wiki community/news chrome or introduce a second visual language.

## Fix order

1. **Reference semantics:** exact source/import identifiers in code, literal explicit-link labels, no links inside comments/strings, no visible link without an actual target. Keep every explicit type-index destination usable. Limit automatic gameplay decoration when a noun is ambiguous.
2. **One representation per fact:** remove duplicate component schema tables and query-only dialogs. Keep stable generated declaration anchors. Separate large loot distributions from compact property comparisons.
3. **Purpose before details:** explain verified responsibilities, inputs and observable behavior. Put common rules before variant data and relevant demonstrations last. Use specimens on renderer pages instead of descriptions of their appearance alone.
4. **Data meaning:** distinguish innate/equipped/display stats, include actual NPC services, identify inaccessible/test-only definitions, and use real material/element identities for upgrades. Keep complete lists scoped to actual gameplay sources.
5. **Shared rendering:** compact code frames, whole-letter mobile heading wrapping, CP437 aliases, attached punctuation, and supported concrete preview equipment.
6. **Local content:** correct inaccurate component/UI claims; fill engine contracts, plant coverage, objectives, construction effort, elemental effects and rendering examples from source.

Individual reports retain all baseline defects, evidence, uncertain observations and suggested changes. Fix status and final verification are recorded here after implementation.

## Earlier review results

The revised documentation has 244 routes: the original 242 plus source notes for World Plants and Cell References. All 48 Gameplay pages, 137 Engine/Entities/Systems/Components pages, and 59 UI/Docs/Types pages were visually reviewed. Full tables and code scrollers were checked; mobile views were sampled where layout changed.

| Scope | Changes and verification | Revised coverage |
| --- | --- | --- |
| Gameplay | [Gameplay fixes](gameplay-fixes.md), including findings from the second visual pass | [48 routes](gameplay-after-coverage.json) |
| Engine and ECS | [Engine fixes](engine-fixes.md) | [137 routes](engine-after-coverage.json) |
| UI and docs rendering | [UI fixes](ui-fixes.md) | [58 routes](ui-after-coverage.json), [new cell-reference page](extra-pages.json) |

Shared fixes resolve source identifiers from actual imports, preserve explicit type-index links, separate item/unit/stat namespaces, and keep literal labels intact. Automatic prose links are limited to page concepts; named entities use explicit Markdown tokens or typed native components. Punctuation stays with its final word across links, emphasis, code and game tokens. Short code frames use their content width; long headings wrap whole three-row letters; CP437 graphical aliases use the game's glyphs.

Source notes now describe actual module responsibilities, guards, ownership and contracts. Repeated field/type tables and bare query dialogs were removed. Generated declarations retain their anchors and are checked against source. Gameplay corrections include equipped/display stats, NPC services, real quest objectives, forge materials, construction work, complete plant representations, correlated loot distributions and availability distinctions. Fixture changes use real supported equipment, usable crafting/forging inputs, recipe previews, sight obstruction and house entry.

Selected screenshots are in [screenshots](screenshots): the wiki references, a before/after Map pair, compact code, a usable forge preview, the final callout and the cell-reference contract. Complete captures remain at the temporary paths recorded in the coverage files.

## Earlier verification

- `npm run check:fast`: 96 tests across 19 suites passed; typecheck and lint passed.
- `npm run docs:test`: both generator tests and 42 Chromium feature checks passed. These cover routing, native controls, focus, reset, lazy loading, pause, command completion, code selection/Copy, link identities, rich-text wrapping, tables, cell references and real Markdown hot reload.
- `npm run docs:types`: 247 declarations generated; the scoped source audit matched all 229 Engine/ECS declarations to current TypeScript.
- `npm run docs:build -- build/docs`: 244 routes built for the Pages deployment subtree.
- `npm run build`: production game build passed. It reports an existing dependency source-map warning; the fast tests also report pending timer cleanup while exiting successfully.
- Font validation was checked with a temporary unsupported character: the build rejected it with its Markdown filename. The temporary file was removed.
- The callout specimen measures one 32-pixel text row and one 32-pixel gap before its code example.

Browser audit contexts disable development reload to keep captures stable. Interaction checks also isolate reload; a separate test verifies the real reload event. One earlier Reset assertion was interrupted by a reload and passed after this isolation. No product Reset change was needed.

The requested baseline is committed as `767e346`. All review findings, evidence and subsequent fixes remain uncommitted.

The final rendered-route audit checked all 244 routes and 1693 links: zero broken internal destinations, duplicate IDs, repeated prose paragraphs, horizontal document overflow or application runtime errors. [Route measurements](route-checks.json) retain the actual links and IDs.

## Current native rendering pass

The latest pass covers all 250 routes: 203 Development pages, 33 Characters/Combat/Cells/Items/Interactions pages, 13 Play/Controls/World/Rendering pages and Welcome. Each area was scrolled and visually inspected. Final targeted captures follow shared fixes; this does not claim the entire screenshot archive was regenerated after every small change.

- [Shared changes and native Interface verification](native-review.md)
- [Development: 203 routes, 255 screenshots](development-native.md), [coverage](development-native-coverage.json)
- [Catalogs: 33 routes, 428 screenshots and 22 follow-up images](catalog-batch-review.md), [coverage](catalog-batch-coverage.json)
- [Controls, World and Rendering](controls-world-rendering-fixes.md), [preview checks](preview-fixes.md), [follow-up coverage](preview-after-coverage.json)

The implementation uses native font runs for the fixed header, native glyph cells for single-layer content and composed SVG only for stacked cells. Tables retain inner rules and natural height; their first column and divider stay together during horizontal scrolling. Count/icon prefixes stay with the first word without recoloring or underlining the prefix. All source-backed stats have anchors, with plain labels for the two stats that have no game icon.

The Interface reference now mounts the game's normal World, Stats, Terminal, Controls and camera. It is noninteractive; native systems still maintain the renderer. Full-page reference captures show the centered hero and normal controls. Chromium region/viewport captures can intermittently omit existing glyphs, SVG and Canvas content. This was isolated with unchanged DOM, player state and SVG rect counts; an immediate full-page capture restores the content. Capture limitations and the controlled comparisons are recorded in the shared reports; no opacity, filter or opaque-background workaround was added.

The baseline remains `767e346`. Every subsequent change is uncommitted.

### Final checks

- `npm run check:fast`: typecheck, lint and 128 tests across 24 suites passed.
- `npm run docs:test`: both generator tests and all 52 Chromium feature checks passed in the final complete run.
- `npm run docs:types`: 250 source declarations documented.
- `npm run docs:build -- build/docs`: 250 Markdown routes built for the Pages subtree.
- `npm run build`: production game build passed. Existing Browserslist and MediaPipe source-map notices remain.

The final rendered audit checked 250 routes and 6122 links: zero broken internal destinations, duplicate IDs, repeated prose paragraphs, document-wide horizontal overflow or application runtime errors. [Measurements](route-checks.json) retain route links and IDs.

The final full browser run includes the touch-release correction: the native queued grid step and state message may finish after release; the check then verifies the player stays stopped. No movement rule changed. The normal World-backed Interface has the same native HUD/camera construction as Play, with input disabled. The reference image and before/after Worm examples are in `screenshots/`.


## Previous verification

Current changes and source evidence are recorded in [Current Documentation Fixes](current-batch.md). All changes after `767e346` remain uncommitted.

- `npm run check:fast`: TypeScript, lint and all 214 tests across 37 suites passed.
- Slow tests: all 65 tests across 11 suites passed.
- `npm run docs:test`: all 8 Node checks and all 69 Chromium browser checks passed in the final full run.
- `npm run docs:types`: 252 source types documented.
- `npm run docs:build -- build/docs`: 270 Markdown routes built for the Pages subtree.
- `npm run build`: production game build passed; existing dependency, Browserslist and source-map notices remain.
- Production `/docs` smoke check: eight desktop/phone visits passed with no HTTP/runtime errors or page overflow. [Measurements](production-smoke.json).
- `git diff --check`: passed.

The frozen-source audit checked every one of the 270 routes, including 6,845 internal links and 5,593 anchor links. It found no broken destinations, runtime/HTTP errors, duplicate IDs/prose, document overflow or raw player markup. The native ??? Class is valid. [Route measurements](current-route-audit.json).

All 49 player pages were captured and visually inspected at desktop and phone sizes: 138 visits and 348 screenshots. [Final findings](gameplay-final-review.md) and [page coverage](gameplay-final-coverage.json) record the corrected pages and image paths. Earlier reviews above remain historical evidence, with their own scope and limits.

Run `npm run docs:dev` and open `http://127.0.0.1:4173/` to review locally. No further commit or deployment was made.

## Previous renderer follow-up verification

[Latest Documentation Fixes](latest-followup.md) records the requested maze, Touch, World, timer, source-frame and catalog corrections, plus final shared-renderer verification. All changes after `767e346` remain uncommitted.

- `npm run check:fast`: TypeScript, lint and 236 tests across 39 suites passed.
- `npm run docs:test`: 8 Node checks and all 78 Chromium checks passed.
- The targeted native Minimap slow test passed; the earlier full slow run above was not repeated in this follow-up.
- `npm run docs:types`: 252 source types documented.
- Production game and documentation builds passed; 270 static Markdown routes built under `build/docs`.
- The built `/docs` subtree passed eight desktop/phone visits, including direct routes and a real native scene, with no HTTP/runtime errors or document overflow.
- Final optimized-source audit: 270 routes, 6,720 internal links and 5,813 anchors; no broken destinations, duplicate prose/IDs, document overflow, raw player markup, raw Infinity/∞ data or HTTP/runtime errors. The native `???` Class is valid. [Measurements](current-route-audit.json).
- Final desktop/phone catalog screenshots inspect native font pixel pairs, frame borders/titles, variants and compact sources. [Visual review](catalog-final-visual.md).
- `git diff --check` passed.

Gear now renders 53.2% fewer DOM nodes and 70.6% fewer SVG drawings in the recorded fresh-page snapshots. Native mask tests establish pixel equivalence; timings are local observations, not a benchmark. [Before/after measurements](gear-performance.json).

The local preview remains available at `http://127.0.0.1:4173/`. No further commit or deployment was made.

## Latest spacing and catalog verification

[Spacing Follow-up](spacing-followup.md) records the menu/content/header alignment, green complete Contents titles, empty-index removal, adjacent acquisition frames, Golem/Limb comparison and Damage list.

- TypeScript, lint and 237 fast tests passed.
- All 8 Node documentation checks and 78 Chromium checks passed; 13 shared visual/layout checks passed again after the final title-width guard.
- 252 source types and 270 static Markdown routes built successfully.
- Desktop/phone screenshots were inspected in development and in the built `/docs` subtree. Eight static visits had no HTTP/runtime errors or page overflow.
- The 270-route audit checked 6,716 internal links and 5,809 anchors without broken destinations, duplicate prose/IDs, overflow, raw player markup, raw Infinity data or HTTP/runtime errors.
- `git diff --check` passed. All changes remain uncommitted; no deployment was made.

## Release visual review

[Release Visual Review](release-visual-review.md) records the complete 270-route inspection, phone samples, categorical fixes and follow-up evidence. Earlier statements about uncommitted work describe their original review stage.

The release pass fixes literal source constants, long technical text and plain page-link wrapping, mobile inner table dividers, the page focus-return outline and stale source/player labels. TypeScript, lint, 238 fast tests, 8 generator checks and 80 browser checks passed; the final source/focus regressions passed again afterward. Every one of 270 routes also passed the 390-pixel phone overflow/runtime audit.

A genuine 0.4.0 save was separately exercised through the production game's Continue dialog, native movement, Pause, SAVE and reload as preparation for the version upgrade verification. This baseline check does not claim the 0.5.0 release is deployed yet.
