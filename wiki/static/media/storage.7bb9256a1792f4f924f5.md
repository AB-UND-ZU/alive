# Save Storage

`storage.ts` stores saved worlds in the browser's IndexedDB database `alive`. The `summaries` store holds menu entries; `saves` holds complete snapshots. Both use the save ID as their key and are updated in one transaction.

| Function | Result |
| --- | --- |
| `loadSaveSummaries` | Run pending release upgrades, then cache the summaries for the menu |
| `storeGame` | Capture the world, replace its save and update the summary cache after writing |
| `restoreGame` | Read a save and restore its snapshot without systems |
| `eraseGame` | Delete the summary and snapshot in one transaction |

Class and Island unlocks are stored separately from saves. Deleting a slot keeps both.

The caller installs systems and preloads a restored world. Erasing from the popup removes the cached summary separately. Storage failures reject the returned promise; World displays save failures in the pause screen.

`storeGame` requests persistent browser storage. The browser may decline; clearing site data still removes saves. See [saved games](index.md) and [snapshots](../../engine/snapshot.md).

On the first writable launch of a release, the upgrade reads saved worlds one at a time. Updated snapshots and summaries commit together. A failure leaves the last completed version unchanged so the next launch retries. Ordinary menu loads and wiki previews read only summaries.

Connections are reused until IndexedDB reports an unexpected close or a version change. A failed open is not cached. If Safari has already closed a background tab's connection before its close event arrives, transaction creation reopens the database and retries once. The transaction body and committed writes are never replayed; quota errors and transaction aborts still reject normally.
