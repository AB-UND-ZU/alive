import { World } from "../../engine";
import { restoreSnapshot } from "../../engine/snapshot";
import {
  createSave,
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
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(summaryStore, { keyPath: "id" });
        request.result.createObjectStore(saveStore, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return database;
};

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  run: (transaction: IDBTransaction) => IDBRequest<T> | void
) => {
  const transaction = (await openDatabase()).transaction(
    [summaryStore, saveStore],
    mode
  );
  const request = run(transaction);

  return new Promise<T | undefined>((resolve, reject) => {
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

export const loadSaveSummaries = async () => {
  const summaries = await runTransaction<SaveSummary[]>("readonly", (store) =>
    store.objectStore(summaryStore).getAll()
  );
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
