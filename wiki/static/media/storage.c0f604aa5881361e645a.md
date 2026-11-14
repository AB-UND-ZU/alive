# Save Storage

`storage.ts` stores saved worlds in the browser's IndexedDB database `alive`. The `summaries` store holds menu entries; `saves` holds complete snapshots. Both use the save ID as their key and are updated in one transaction.

| Function | Result |
| --- | --- |
| `loadSaveSummaries` | Upgrade older records atomically, then populate the synchronous menu cache |
| `storeGame` | Capture the world, replace its save and update the summary cache after writing |
| `restoreGame` | Read and upgrade a save, then restore its snapshot without systems |
| `eraseGame` | Delete the summary and snapshot in one transaction |

The caller installs systems and preloads a restored world. Erasing from the popup removes the cached summary separately. Storage failures reject the returned promise; World displays save failures in the pause screen.

`storeGame` requests persistent browser storage. The browser may decline; clearing site data still removes saves. See [saved games](index.md) and [snapshots](../../engine/snapshot.md).

`loadSaveSummaries` opens one readwrite transaction across both stores. Current summaries need no snapshot reads. For older summaries, the actual full record determines whether to upgrade; missing snapshots and future saves remain untouched. Upgraded worlds and summaries commit together before the cache is published. A failed upgrade aborts the transaction and rejects with the original error.

Connections are reused until IndexedDB reports an unexpected close or a version change. A failed open is not cached. If Safari has already closed a background tab's connection before its close event arrives, transaction creation reopens the database and retries once. The transaction body and committed writes are never replayed; quota errors and transaction aborts still reject normally.
