import { World } from "../../engine";
import { restoreSnapshot } from "../../engine/snapshot";
import {
  compareVersions,
  createSave,
  isLoadable,
  saveVersion,
  getSummary,
  SaveGame,
  SaveSummary,
  setSaveSummaries,
  updateSaveSummary,
  upgradeSave,
} from ".";

// summaries are stored separately to list saves without reading whole worlds
const databaseName = "alive";
const summaryStore = "summaries";
const saveStore = "saves";

let database: Promise<IDBDatabase> | undefined;

const openDatabase = () => {
  if (!database) {
    const pending = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(summaryStore, { keyPath: "id" });
        request.result.createObjectStore(saveStore, { keyPath: "id" });
      };
      request.onsuccess = () => {
        const connection = request.result;
        connection.onclose = () => {
          if (database === pending) database = undefined;
        };
        connection.onversionchange = () => {
          if (database === pending) database = undefined;
          connection.close();
        };
        resolve(connection);
      };
      request.onerror = () => reject(request.error);
    });
    database = pending;
    pending.catch(() => {
      if (database === pending) database = undefined;
    });
  }

  return database;
};

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  run: (transaction: IDBTransaction) => IDBRequest<T> | void
) => {
  let transaction: IDBTransaction;
  for (let attempt = 0; ; attempt += 1) {
    const pending = openDatabase();
    const connection = await pending;
    try {
      transaction = connection.transaction([summaryStore, saveStore], mode);
      break;
    } catch (error) {
      // Safari can close a background tab's connection before delivering onclose.
      if (
        !(error instanceof DOMException) ||
        error.name !== "InvalidStateError"
      ) {
        throw error;
      }
      if (database === pending) database = undefined;
      connection.close();
      if (attempt > 0) throw error;
    }
  }
  const request = run(transaction);

  return new Promise<T | undefined>((resolve, reject) => {
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

export const loadSaveSummaries = async () => {
  let upgradeError: unknown;
  const summaries = await runTransaction<SaveSummary[]>(
    "readwrite",
    (transaction) => {
      const summariesStore = transaction.objectStore(summaryStore);
      const savesStore = transaction.objectStore(saveStore);
      const request = summariesStore.getAll();

      // Current saves can be listed without reading their world snapshots.
      request.onsuccess = () => {
        request.result.forEach((summary, index) => {
          if (compareVersions(summary.version, saveVersion) >= 0) return;

          const saved = savesStore.get(summary.id);
          saved.onsuccess = () => {
            const save: SaveGame | undefined = saved.result;
            if (!save) return;
            if (!isLoadable(save)) {
              // A stale summary must not offer a newer world as loadable.
              request.result[index] = { ...summary, version: save.version };
              return;
            }
            if (!save.snapshot) return;

            try {
              const upgraded = upgradeSave(save);
              const updated = getSummary(upgraded);
              if (upgraded !== save) savesStore.put(upgraded);
              summariesStore.put(updated);
              request.result[index] = updated;
            } catch (error) {
              upgradeError = error;
              transaction.abort();
            }
          };
        });
      };
      return request;
    }
  ).catch((error) => {
    throw upgradeError ?? error;
  });
  setSaveSummaries(summaries || []);
};

export const storeGame = async (world: World) => {
  const save = createSave(world);
  world.metadata.saveId = save.id;

  // ask browsers not to evict saves when storage runs low
  navigator.storage?.persist?.();

  await runTransaction("readwrite", (transaction) => {
    transaction.objectStore(summaryStore).put(getSummary(save));
    transaction.objectStore(saveStore).put(save);
  });
  updateSaveSummary(getSummary(save));

  return save;
};

/** Read, upgrade and restore a saved world, without systems. */
export const restoreGame = async (id: string) => {
  const save = await runTransaction<SaveGame>("readonly", (transaction) =>
    transaction.objectStore(saveStore).get(id)
  );
  if (!save) throw new Error(`Save ${id} not found!`);

  const world = restoreSnapshot(upgradeSave(save).snapshot);
  world.metadata.saveId = save.id;

  return world;
};

export const eraseGame = (id: string) =>
  runTransaction("readwrite", (transaction) => {
    transaction.objectStore(summaryStore).delete(id);
    transaction.objectStore(saveStore).delete(id);
  });
