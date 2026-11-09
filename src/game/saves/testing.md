# Save Test Store

The jsdom save tests use an in-memory database because jsdom has no IndexedDB. It supports the requests used by `storage.ts`: opening a database, creating key-path stores, reading, writing and deleting records. Native V8 cloning preserves values such as `Infinity` and shared references.

Transactions process queued requests in order, including requests added by success handlers. Writes stay private until the queue completes. Aborting or throwing from a request handler discards all writes. `abortNext` simulates a storage failure; `read` and `write` inspect or seed records for feature tests.

This helper drains requests in a microtask rather than emulating browser task timing. The browser tests in `scripts/wiki/tests/savegames.spec.cjs` verify the real IndexedDB behavior, including upgrades, rollback and concurrent writes.
<!-- source-types -->

## Store

```ts src/game/saves/testing.ts
type Store = { keyPath: string; records: Map<IDBValidKey, unknown> };
```

## Database

```ts src/game/saves/testing.ts
type Database = { version: number; stores: Map<string, Store> };
```
