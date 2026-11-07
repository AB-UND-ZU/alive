# Save Storage

`storage.ts` stores saved worlds in the browser's IndexedDB database `alive`. The `summaries` store holds menu entries; `saves` holds complete snapshots. Both use the save ID as their key and are updated in one transaction.

| Function | Result |
| --- | --- |
| `loadSaveSummaries` | Read summaries into the synchronous menu cache |
| `storeGame` | Capture the world, replace its save and update the summary cache after writing |
| `restoreGame` | Read and upgrade a save, then restore its snapshot without systems |
| `eraseGame` | Delete the summary and snapshot in one transaction |

The caller installs systems and preloads a restored world. Erasing from the popup removes the cached summary separately. Storage failures reject the returned promise; World displays save failures in the pause screen.

`storeGame` requests persistent browser storage. The browser may decline; clearing site data still removes saves. See [saved games](index.md) and [snapshots](../../engine/snapshot.md).
