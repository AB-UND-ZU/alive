import { deserialize, serialize } from "v8";

/**
 * In-memory IndexedDB with only what `storage.ts` uses: opening with an
 * upgrade, object stores with a key path and transactions of put, get,
 * getAll and delete requests. Values are copied by structured cloning.
 * Requests complete in order in a later microtask, including requests queued
 * by success handlers. Writes commit together after the queue finishes.
 */

type Store = { keyPath: string; records: Map<IDBValidKey, unknown> };
type Database = { version: number; stores: Map<string, Store> };

class FakeRequest<T = unknown> {
  result?: T;
  error: Error | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onupgradeneeded: (() => void) | null = null;
}

const clone = <T>(value: T): T => deserialize(serialize(value));

// promises are not affected by fake timers
const later = (callback: () => void) => {
  Promise.resolve().then(callback);
};

const getKey = (store: Store, value: Record<string, unknown>) =>
  value[store.keyPath] as IDBValidKey;

export const createFakeIndexedDB = () => {
  const databases = new Map<string, Database>();
  let nextAbort: Error | undefined;
  let nextOpenError: Error | undefined;
  const connections = new Map<
    string,
    Set<ReturnType<typeof createConnection>>
  >();

  const createConnection = (database: Database) => ({
    closed: false,
    onclose: null as (() => void) | null,
    onversionchange: null as (() => void) | null,
    close() {
      this.closed = true;
    },
    createObjectStore: (name: string, { keyPath }: { keyPath: string }) => {
      database.stores.set(name, { keyPath, records: new Map() });
    },
    transaction(names: string[], mode: IDBTransactionMode) {
      if (this.closed) {
        throw new DOMException(
          "The database connection is closing",
          "InvalidStateError"
        );
      }
      const operations: (() => void)[] = [];
      let records: Map<string, Map<IDBValidKey, unknown>>;
      let aborted = false;
      let completed = false;
      const transaction = {
        error: null as Error | null,
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onabort: null as (() => void) | null,
        abort: () => {
          if (completed || aborted) {
            throw new DOMException(
              "Transaction is inactive",
              "InvalidStateError"
            );
          }
          aborted = true;
        },
        objectStore: (name: string) => {
          const store = database.stores.get(name);
          if (!store || !names.includes(name)) {
            throw new Error(`Store ${name} not in transaction`);
          }

          const request = <T>(run: () => T, write = false) => {
            if (completed || aborted) {
              throw new DOMException(
                "Transaction is inactive",
                "TransactionInactiveError"
              );
            }
            if (write && mode !== "readwrite") {
              throw new Error("Transaction is read only");
            }
            const pending = new FakeRequest<T>();
            operations.push(() => {
              pending.result = run();
              pending.onsuccess?.();
            });
            return pending;
          };

          return {
            get: (key: IDBValidKey) =>
              request(() => clone(records.get(name)!.get(key))),
            getAll: () =>
              request(() => Array.from(records.get(name)!.values()).map(clone)),
            put: (value: Record<string, unknown>) => {
              // cloning fails right away for values like functions
              const copy = clone(value);
              return request(() => {
                records.get(name)!.set(getKey(store, copy), copy);
              }, true);
            },
            delete: (key: IDBValidKey) =>
              request(() => {
                records.get(name)!.delete(key);
              }, true),
          };
        },
      };

      later(() => {
        const abort = nextAbort;
        nextAbort = undefined;

        if (abort) {
          transaction.error = abort;
          aborted = true;
        }

        records = new Map(
          names.map((name) => [
            name,
            new Map(database.stores.get(name)!.records),
          ])
        );
        try {
          while (!aborted && operations.length) operations.shift()!();
        } catch (error) {
          transaction.error = error as Error;
          aborted = true;
        }
        completed = true;
        if (aborted) {
          transaction.onabort?.();
          return;
        }
        if (mode === "readwrite") {
          records.forEach((values, name) => {
            database.stores.get(name)!.records = values;
          });
        }
        transaction.oncomplete?.();
      });

      return transaction;
    },
  });

  const indexedDB = {
    open: (name: string, version: number) => {
      const request = new FakeRequest();

      later(() => {
        if (nextOpenError) {
          request.error = nextOpenError;
          nextOpenError = undefined;
          request.onerror?.();
          return;
        }
        let database = databases.get(name);
        const upgrade = !database || database.version < version;
        if (!database) {
          database = { version, stores: new Map() };
          databases.set(name, database);
        }
        database.version = Math.max(database.version, version);

        const connection = createConnection(database);
        if (!connections.has(name)) connections.set(name, new Set());
        connections.get(name)!.add(connection);
        request.result = connection;
        if (upgrade) request.onupgradeneeded?.();
        request.onsuccess?.();
      });

      return request;
    },
  };

  const getStore = (name: string, store: string) => {
    const found = databases.get(name)?.stores.get(store);
    if (!found) throw new Error(`Store ${store} not in database ${name}`);
    return found;
  };

  return {
    indexedDB: indexedDB as unknown as IDBFactory,
    /** Close cached handles as a browser may after suspending a tab. */
    closeConnections: (name: string, notify = true) => {
      connections.get(name)?.forEach((connection) => {
        connection.close();
        if (notify) connection.onclose?.();
      });
      connections.delete(name);
    },
    /** Reject the next connection attempt without deleting stored data. */
    failNextOpen: (error: Error) => {
      nextOpenError = error;
    },
    /** Names of the object stores of a database. */
    stores: (name: string) =>
      Array.from(databases.get(name)?.stores.keys() || []),
    /** Copies of all records of an object store. */
    read: (name: string, store: string) =>
      Array.from(getStore(name, store).records.values()).map(clone),
    /** Store a record directly, e.g. a save of an older version. */
    write: (name: string, store: string, value: Record<string, unknown>) => {
      const found = getStore(name, store);
      found.records.set(getKey(found, value), clone(value));
    },
    /** Remove all records but keep databases and their stores. */
    clear: () => {
      nextAbort = undefined;
      nextOpenError = undefined;
      databases.forEach((database) =>
        database.stores.forEach((store) => store.records.clear())
      );
    },
    /** Abort the next transaction without changes, like on a full disk. */
    abortNext: (error: Error) => {
      nextAbort = error;
    },
  };
};

/** Replace the browser's IndexedDB, which jsdom doesn't provide. */
export const installFakeIndexedDB = () => {
  const fake = createFakeIndexedDB();
  Object.defineProperty(window, "indexedDB", {
    value: fake.indexedDB,
    configurable: true,
  });
  return fake;
};
