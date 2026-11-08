# World documentation

## Changes

- World navigation begins with Levels, followed by Minimap, Savegames, Tick Timers and Sounds. `docs/map.md` remains the Minimap source. Flat and nested Map URLs redirect to the canonical Minimap route.
- Levels combines the native portal-map background with native green selection frames. The adjacent table reads sizes and onward destinations from `levelConfig`; the gameplay popup retains its normal current/available/locked colors. Portal information is now on Levels.
- The Dungeon diagram uses the actual tutorial room layout and wave sprites in a compact 13 by 13 cell drawing with adjacent shared borders and no connectors. Its compact right-hand table identifies all seven numbered rooms.
- Minimap shows all four native zooms from one generated Island. Static captures use the visible phase of the native marker blink, so the hero is identifiable in every view. Native pathfinding and visibility explore 119 steps from spawn to Earth Town. Hidden and remembered terrain remain. `displayPopup` renders each native map popup; documentation does not implement another minimap renderer.
- The documentation build caches those four popup snapshots in `src/documentation/minimap.json`. A hash of relevant native source, fixtures and the cache script invalidates the sample. Browsing the Minimap never generates another Island. Levels retains the schematic Island terrain overview with native POI icons, a Boat, and a right-hand size/landmark legend; it does not substitute the minimap popup.
- Sounds derives its complete default-preset list from the native sound class. Each Play button resumes native audio and calls native playback. No copied sound-name list or added audio library is used.
- Tick Timers includes the current movement reference-tick formula in a named code block.

## Verification

- Focused native tests: 5 suites, 10 tests passed. This includes one real Island generation, all four native map zooms, a reachable exploration route, retained fog, the cache render, all sound controls, native portal states and Dungeon geometry.
- Browser regression: `scripts/docs/tests/maps.spec.cjs`, 3 tests passed. Checks the visible Levels table beside the map, compact Dungeon geometry, direct/legacy Minimap routing, all four popup previews, mobile page width and actual sound playback dispatch.
- TypeScript and scoped ESLint passed. The follow-up lint run also checked the modified test files and Widgets imports.
- Production game build passed. Documentation type generation and build passed; the latest produced 267 Markdown routes at this checkpoint.
- Desktop 1440×1000 and phone 390×844: four routes, eight base visits, 32 screenshots plus eight final detail captures. No runtime errors or document overflow. Coverage: [world-after-coverage.json](world-after-coverage.json). Screenshots: `/tmp/alive-world-review-adjacent/` for Levels; `/tmp/alive-world-review-final/` for Minimap, Sounds and Timers. Final visible-marker and preserved landmark-color captures are in `/tmp/alive-world-marker-review/`.

## Visual findings

The first capture revealed a zero-width table wrapper beside the portal map: inline-size containment suppressed its intrinsic flex width. The Levels wrapper now has a native 26-column width, and the shared table containment was corrected separately by the parent agent. The final screenshots show the table beside the overview. A later user refinement aligns all three table content rows with the native five-cell green frames, using their source offsets (2, 8 and 14 cells). The browser regression now measures the wrapper, rather than only its overflowing child table.

Inspected native green portal frames, readable Level/Size/Exit cells, aligned Dungeon rooms and labels, four distinct minimap zooms and native popup borders, Sound buttons at the start and end of the list, and the named timer code fence. Large diagrams retain local horizontal scrolling on phones rather than shrinking game cells. The code fence also retains its local horizontal scroll.

Reference/result examples: `levels-1440-2.png` (portal map and data), `levels-1440-4.png` (adjacent Dungeon), `minimap-1440-4.png` (four native zooms), `sounds-1440-1.png` (last native sound controls), `levels-390-2.png` (horizontal diagram/data viewport), `timers-390-1.png` (formula frame).

## Limits

The complete documentation browser suite is coordinated by the parent agent. A follow-up run of World, inline-text and visual component browser regressions passed all 15 tests (59.2 seconds). Native source tests after the adjacent-room refinement passed (8 tests across 3 suites in 2.8 seconds, then the stronger Dungeon numbering test passed in 1.7 seconds). Two further Minimap tests passed in 23.9 seconds, verifying one real generation and a native player marker in every stored zoom. The Sounds test now skips unnecessary accessibility visibility/name calculations while enumerating controls, avoiding its previous timeout under parallel test load. Playback dispatch and successful native audio startup were tested; captured screenshots do not establish speaker output. Chromium occasionally skipped painting text on a subsequent screenshot of an unchanged viewport in the initial capture; the final inspected result captures contain the relevant text and native sprites.

Final detail inspection confirmed one native green player marker at every zoom, gray named-landmark links alongside unchanged sprite colors, and phone horizontal scrolling that reveals the Island legend. No browser remains open.
