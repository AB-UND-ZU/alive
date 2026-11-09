# Gameplay Test Integration

The `gameplay-tests` branch from `../alive-worktree-2` was rebased onto `af1c332` and integrated into main. Both committed test batches and the uncommitted save/UI tests were preserved. Workflow conflicts retain coverage reporting and the current Wiki commands and output paths.

## Native Game Review

Source review covered the Wiki changes from `a8c460f` and the later changes after `767e346`. Combat, movement, quests, recipes and balancing rules are unchanged. Warp-map and dialog-tab extraction preserve their algorithms. The default World, Controls and Dimensions settings preserve the main game's behavior; Wiki scenes opt into their separate settings. Automatic stored-save upgrades are the intended 0.5.0 change.

The integration adds no production game behavior changes. Feature tests exercise normal systems and native data, including continued play after save restoration.

## Test Corrections

| Finding | Correction |
| --- | --- |
| UI tests treated each `.Cell` as one character and every icon as SVG. | Decode logical characters from native font runs and compose expected pixels with the existing renderer helpers. |
| Disabled button text has no selectable fallback characters. | Decode its actual native button layers; keep disabled-state and action checks. |
| An unavailable touch interaction target stays mounted. | Check visibility and action state rather than absence. |
| The storage fake skipped requests queued by success handlers. | Drain requests in order and commit staged records atomically; discard them on abort or handler failure. |
| A stale coverage exclusion named the former site folder. | Exclude `src/wiki/`; native code remains subject to the existing coverage gates. |

Core checks cover touch release/cancellation, keyboard movement after mouse release, ordinary/flipped HUD readouts and actions, and nonpersistent Wiki save isolation. Storage checks cover automatic list upgrades, unchanged progress, failed-upgrade preservation and rollback after an earlier queued write. Existing real-browser IndexedDB checks remain the authority for browser timing and concurrent transactions.

The inherited TODO for restoring an already-visible interaction prompt remains a separate existing save issue. The corresponding engine code is unchanged by the Wiki work; tests for other saved interactions exercise returning to the interaction after loading. This integration does not silently remove that TODO or claim to cover it.

## Verification

The initial rebased fast run passed all gameplay suites and exposed 22 UI failures from the stale rendering assumptions above. The corrected focused UI/World run passed 138 tests; storage passed 15 tests. TypeScript and scoped lint passed. No additional Wiki presentation tests were added.

- Full coverage run: 184 suites passed, 1,564 tests passed and the one inherited TODO remains. Statements 87.61%, branches 85.35%, functions 86.94%, lines 88.35%; all existing thresholds passed.
- Full TypeScript and lint passed.
- Wiki checks: 8 generator checks and all 88 browser checks passed.
- Production game and Wiki builds passed; 260 source types and 275 routes generated.
- Built-site checks passed 16 desktop/phone visits, including a working native movement preview. Ten additional source-page captures checked all five new articles. Technical `Infinity` uses inline code so it keeps its source meaning. Evidence: `/tmp/alive-rebase-wiki-built/` and `/tmp/alive-rebase-source-visual/`.
- The production game, without test mode, automatically upgraded the genuine 0.4.0 fixture, loaded it through Continue, moved, saved and restored the new position after reload. No runtime errors: `/tmp/alive-rebase-main-save-local.log`.
- Coverage output and logs: `/tmp/alive-rebase-coverage.log`, `/tmp/alive-rebase-coverage-summary.md`; focused UI/World checks: `/tmp/alive-rebase-ui-world-focused.log`; real-browser Wiki checks: `/tmp/alive-rebase-wiki-tests.log`.
