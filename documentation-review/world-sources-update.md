# World and Item Sources

The current changes are uncommitted. Source is frozen for the final shared checks.

## Changes

- Dungeon frames merge native border layers at shared corners. Opaque number labels remain readable without the half-cell masks that erased junctions. The legend follows rooms 1–7; room 5 is Waves.
- One generated Island supplies all four native minimap zooms. Native pathfinding and visibility explore connected routes through Earth Town, Fire Haven and the Nomad. The final player viewpoint stays away from their markers. The cached sample records 467 route steps, 4,133 remembered FOG entities, 19,454 hidden FOG entities and 126 visible FOG entities. The browser generates no Island.
- Timers shows the World reference, Haste −1 through 5, system updates and sequence time. The formula is a multiline `const tickMs` assignment using the native calculation. Haste 0 remains visible.
- Every acquisition source uses a compact native frame. Drop lists every producing entity in one frame, without probability groups or summaries. Shops shows native Buy and Sell prices on separate lines. Fishing lists each native fishing level and chance. Levels uses the green world-map sprite and links to the corresponding level. Recipe alternatives have separate titled frames and one counted ingredient per line.
- Level sources combine actual unbound dungeon items, the shared Island sample and native NPC biome distributions. Runtime inventory excludes bound items. Native drop definitions omit `bound`; their generated drops are unbound. Sampling one actual cell/object pattern per biome establishes those occurrences, not every rare world outcome. This limitation is documented beside `itemSources` and `MinimapData`.

## Verification

- TypeScript and scoped ESLint passed (empty logs `/tmp/alive-world-sources-typecheck.log` and `/tmp/alive-world-sources-lint.log`).
- Four fast suites passed: nine tests covering source identity/prices/fishing/biomes, Dungeon geometry, Minimap caching and Timers. Acquisition rendering passed two further tests, including every coin-producing native entity. Logs: `/tmp/alive-world-newbatch-jest-final.log`, `/tmp/alive-acquisition-render-jest.log`.
- The native Minimap slow test passed in 33.7 seconds and verifies a single Island generation: `/tmp/alive-world-newbatch-slow.log`.
- Six focused Chromium tests passed: native maps, minimap aliases/zooms, Sounds playback, compact acquisition frames/prices/links, timer rows/formula and Dungeon ordering. Log: `/tmp/alive-world-sources-browser.log`.
- `docs:types` generated 252 declarations; `docs:build` built 270 routes. Log: `/tmp/alive-world-newbatch-build-final.log`.
- Visually inspected 38 screenshots at 1440×1000 and 390×844, covering Levels, Minimap, Timers, Resources, Consumables, Animals and Gear. Six contact sheets cover the first 34 screenshots; four additional timer screenshots inspect the full table and formula. Shared frame titles, borders, native icons, counted ingredients, prices and player markers remain readable. Phone tables and code scroll locally rather than breaking reference/value lines. No page errors or document overflow occurred in these visits.

Screenshots and machine-readable visits: `/tmp/alive-world-sources-visual/`. Reproduce with `/tmp/alive-world-sources-capture.cjs` and `/tmp/alive-timers-final-capture.cjs`. Captures are local artifacts, not repository files. The two initial timer code targets used an obsolete selector and were replaced by the four explicit table/code captures.

The final all-route audit is recorded separately in `current-route-audit.json`; this visual review does not claim to execute every possible source interaction or prove exhaustive random Island placements.

## Final Route Audit

The structural pass was rerun on the frozen source after the shared native font/frame optimization and covered all 270 canonical routes, including all 49 Gameplay pages: 6,720 internal links and 5,813 anchors; no broken links, runtime/HTTP errors, document overflow, duplicate IDs, duplicate prose, raw inline markup or unformatted Infinity/∞ data outside code/font atlas. `???` is the valid native hidden class name. Results and complete route coverage are in `current-route-audit.json`. Gameplay pages used fresh browser pages after the earlier cumulative SPA pass timed out entering Gear. Native frame titles now contribute DOM text; their repeated labels are expected, while duplicate prose checks apply to paragraphs outside table cells. The optimized-source rerun finished successfully and its browser closed. Log: `/tmp/alive-final-optimized-route-audit.log`.

## Performance Snapshot Before Shared Optimization

Before the shared frame/font optimization, a separate fresh Gear load measured 2.638 seconds to DOMContentLoaded and 8.495 seconds until the active route rendered. It contained 268,326 DOM nodes (265,429 in main), 233 source frames, 10,526 SVGs and 209,180 SVG rects; all counted SVGs/rects were under `.SpriteCell`. Heap use was 77.84 MB and no runtime errors occurred. This exposed a real catalog rendering cost; fresh-page auditing alone did not fix it. These figures describe that earlier source snapshot, not the current optimized implementation or a controlled benchmark. The parent review records the later shared optimization in `gear-performance.json`. Original measurements: `/tmp/alive-gear-performance.json`. The browser was closed after measurement.

## Final Source Review

A later read-only review confirmed the requirements below against the frozen source. No new tests, builds or browser runs were made for this review.

| Requirement | Source evidence |
| --- | --- |
| Every acquisition kind has a compact native frame | `AcquisitionSources.tsx`; `Frame` uses native `pixelFrame` borders and whole-cell intrinsic measurement in `visuals.tsx` |
| Individual reference/value lines stay intact | `.CompactFrame .FrameInner` uses intrinsic width and nowrap; native text preserves spaces in `visuals.css` |
| One Drop frame lists all documented producing entities | `itemSources.ts` indexes native positive drops; `AcquisitionSources.tsx` groups them without summaries or probability headings |
| Native Buy and Sell lines | `getItemBuyPrice`, `getItemSellPrice`, native purchasable items and actual NPC buy deals feed the Shops frame |
| Levels and Fishing sources | Cached actual Island/dungeon sources and native NPC biome distributions; green Levels sprite/anchors; all native fishing level/chance pairs |
| Recipe options and counted ingredients | Native crafting, brewing and forging helpers; one titled frame per option and one ingredient per line |
| Dungeon order and connected corners | `tutorialRooms` supplies ascending legend order; room 5 is Waves; native frame layers merge at shared junctions |
| More realistic Minimap exploration | One native Island, native pathfinding/visibility through three landmarks, off-POI final viewpoint, four cached native zooms with player markers |
| Timer calculation and rows | Multiline `const tickMs` in `docs/timers.md`; `TimerData` calls `getHasteInterval` for World and Haste −1 through 5, including visible Haste 0 |

The source sampler still establishes observed native cell/object/biome occurrences rather than exhaustive random placement coverage. The invisible Rotten actor uses its real fallen-tree cell. The intentionally unspawned `chestBoss` remains excluded consistently with the documented unit catalog. No concrete implementation mismatch was found in this review.
