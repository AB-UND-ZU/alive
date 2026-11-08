# 0.5.0 Release Checks

## Save Compatibility

The native 0.4.0 tutorial save comes from `a8c460f0aa80a4d2ab4b3a77c1f460d7dad01812`. Its provenance and checksum live beside the compressed fixture in `src/game/saves/fixtures/`. Native V8 serialization preserves Infinity and shared references.

Loading the save list upgrades older stored worlds and summaries in one IndexedDB transaction, before publishing the menu cache. The 0.5.0 snapshot schema is unchanged. Current records avoid full-world reads; future, missing and incomplete worlds are preserved. Failed writes roll back without publishing a partial cache.

Eight real-browser storage tests cover the historical fixture, unchanged snapshots and progress, restoration, current saves, stale summaries, future versions, missing records, transaction rollback and concurrent writes.

The actual production game was also checked without test mode: seed the genuine 0.4.0 save, reload, verify both persisted records become 0.5.0 before selecting a save, open Continue, load, move, pause and save, then reload and Continue again. The original identity and progress survive; movement and the new save persist. No runtime errors occurred. Measurements and screenshots: `/tmp/alive-main-save-0.5.0-local/`.

## Local Verification

| Check | Result |
| --- | --- |
| TypeScript and lint | Passed |
| Fast tests | 238 across 39 suites |
| Full game tests | 303 across 50 suites |
| Wiki generator checks | 8 passed |
| Wiki browser checks | 88 passed, including 8 save-storage tests |
| Source declarations | 252 generated |
| Production game build | Passed |
| Wiki build | 270 static routes under `build/wiki` |
| Title assets | Both sizes regenerated with V0x05 |

After building the game and Wiki, four direct-route visits checked Welcome and the Wiki app source page at 1440 and 390 pixels. WIKI/V0x05, fonts, heading wrapping and table layout were visually inspected; no document overflow or runtime errors occurred. Evidence: `/tmp/alive-050-wiki-visual/`.

The complete pre-release visual review and all-route phone audit are recorded in [Release Visual Review](release-visual-review.md). Additional independent phone inspection: [Gameplay A](release-gameplay-phone-a-visual.md). Deployment checks follow the release push; the checks above are local production checks.
