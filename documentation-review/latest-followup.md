# Latest Documentation Fixes

Baseline: `767e346`. All subsequent changes remain uncommitted. Nothing was deployed.

The next spacing, Contents and Golem adjustments are recorded in [Spacing Follow-up](spacing-followup.md), including its newer verification results.

| Area | Changes | Evidence |
| --- | --- | --- |
| Movement | Native fog, Apple pickup and an open exit. Autoplay follows native paths through the maze, tolerates interrupted input and stops outside. | [Preview review](ui-fixes.md), [scene tests](../src/documentation/scenes.test.ts), [browser checks](../scripts/docs/tests/previews.spec.cjs) |
| Touch | The desktop reference follows the cursor; touch devices show all arrows. Native drag input stops on release, departure or lost focus. Instructions remain outside the frame on whole text rows. | [Preview review](ui-fixes.md) |
| World | Shared Dungeon corners, Waves label and rooms in natural order. All four Minimap zooms use one explored Island, with the hero away from POI markers. | [World review](world-sources-update.md) |
| Timers | World reference followed by Haste −1 through 5. Multiline `const tickMs` source formula; zero Haste remains visible. | [World review](world-sources-update.md) |
| Item sources | Compact titled frames for every source kind: native Drop entities, Buy/Sell prices, green level references with biome, fishing levels/chances and separate ingredient recipes. | [Acquisition sources](../src/documentation/AcquisitionSources.tsx), [source coverage](world-sources-update.md) |
| Catalogs | One Damage row, a separate Adds group, Sign in Units, all supported tree/palm bodies and remains, full Rotten portrait, and all Torch/Boots accessory upgrades. | [Catalog review](catalog-latest-review.md), [final visual review](catalog-final-visual.md) |
| Shared presentation | Green Contents frames, aligned first-row groups and gaps between stacked rows. Native tab gaps, compact drop frames, native Gear specimen on Slots, and the active-cell Aura explanation. | [Layout checks](../scripts/docs/tests/layout.spec.cjs) |
| Counts and code | Unbounded amounts display 99+ with the native ninePlus sprite. Damage uses a TypeScript fence containing the actual calculation. | [Visual primitives](../src/documentation/visuals.tsx), [Damage](../docs/damage.md) |
| Rendering cost | Complementary pixel halves use batched native font runs. Transparent crop spaces no longer force documentation frame borders and titles into SVG. Both transformations preserve the native pixel masks. | [Row tests](../src/components/Row/index.test.tsx), [pixel tests](../src/components/Row/characters.test.ts), [measurements](gear-performance.json) |

Gear's fresh-page snapshot fell from 268,326 to 125,553 DOM nodes and from 10,526 to 3,098 SVG drawings. Route readiness measured 8.495 seconds before and 2.628 seconds after. These are local snapshots, not a controlled timing benchmark. The two catalog browser checks that previously exceeded their time limit pass with the renderer changes.

Final catalog captures inspect desktop and phone Contents frames, enlarged pixel portraits, source/drop frames, accessories, Sign and Golem Limb. Original screenshots remain under `/tmp/alive-catalog-final-font-visual`. The world/source review adds 38 desktop/phone captures; the preview review covers native maze navigation, cursor-following reference and resized Touch notes. Earlier complete page reviews remain linked from the review index; these follow-up captures do not claim every old screenshot was regenerated.

The world-source cache records real occurrences from one generated Island, supplemented by native spawn distributions. It does not prove every rare random placement. No unsupported plant body or recipe was invented.

## Verification

- `npm run check:fast`: TypeScript, lint and all 236 fast tests across 39 suites passed.
- `npm run docs:test`: all 8 Node checks and all 78 Chromium checks passed in the final complete run.
- The targeted native Minimap slow test passed, verifying one Island generation for the cached views. The earlier full 65-test slow run remains historical evidence; it was not repeated in this follow-up.
- `npm run docs:types`: 252 source types documented.
- `npm run build` and `npm run docs:build -- build/docs` passed; the static documentation contains 270 Markdown routes.
- The built `/docs` subtree passed eight desktop/phone visits, including direct routes, Classes through Level 10 and the real Movement scene. No HTTP/runtime errors or document overflow: [production measurements](production-smoke.json).

The final optimized-source audit checked all 270 routes, 6,720 internal links and 5,813 anchors. It found no broken destinations, duplicate prose/IDs, document overflow, raw player markup, raw Infinity/∞ data or HTTP/runtime errors. The sole unknown-name candidate is the valid native `???` Class. [Route measurements](current-route-audit.json) retain coverage and findings. This structural check complements the visual review and does not execute every game interaction.

`git diff --check` passed.

Builds retain the existing Browserslist, Babel dependency and missing MediaPipe source-map notices. Some targeted native Jest runs report pending timer cleanup after passing their assertions.

Preview locally with `npm run docs:dev` at `http://127.0.0.1:4173/`.
