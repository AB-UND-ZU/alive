import { checkUnlocks, Unlock } from "../unlocks";
import { World } from "../../engine";
import { WorldSnapshot } from "../../engine/snapshot";
import {
  createSave,
  isLoadable,
  getSummary,
  restoreSavedWorld,
  SaveGame,
  SaveSummary,
  setSaveSummaries,
  updateSaveSummary,
} from ".";

import { finishUpgrade, pendingUpgrades, upgradeSave } from "./upgrades";

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

const readSave = (id: string) =>
  runTransaction<SaveGame>("readonly", (transaction) =>
    transaction.objectStore(saveStore).get(id)
  );

export const loadSaveSummaries = async (
  mode: "readonly" | "readwrite" = "readwrite",
  onUpgrade?: (version: string) => void
) => {
  const earned = new Set<Unlock>();
  let upgrading = false;
  let upgradeError: unknown;
  const summaries = await runTransaction<SaveSummary[]>(mode, (transaction) => {
    const summariesStore = transaction.objectStore(summaryStore);
    const savesStore = transaction.objectStore(saveStore);
    const request = summariesStore.getAll();
    request.onsuccess = () => {
      // An earlier startup transaction may have finished while this one waited.
      const upgrades = mode === "readwrite" ? pendingUpgrades() : undefined;
      if (!upgrades) return;
      upgrading = true;
      const slots: SaveSummary[] = request.result;
      // Finish each release across all slots, reading one world at a time.
      const remaining = upgrades.flatMap((step) =>
        slots.map((_, index) => ({ step, index }))
      ).values();
      const next = () => {
        const entry = remaining.next();
        if (entry.done) return;
        const { step, index } = entry.value;
        if (index === 0) onUpgrade?.(step.version);
        const summary = slots[index];
        const saved = savesStore.get(summary.id);
        saved.onsuccess = () => {
          try {
            const save: SaveGame | undefined = saved.result;
            if (save?.snapshot) {
              if (isLoadable(save)) {
                const updated = upgradeSave(save, step, earned);
                savesStore.put(updated);
                request.result[index] = getSummary(updated);
                summariesStore.put(request.result[index]);
              } else if (summary.version !== save.version) {
                request.result[index] = getSummary(save);
                summariesStore.put(request.result[index]);
              }
            }
            next();
          } catch (error) {
            upgradeError = error;
            transaction.abort();
          }
        };
      };
      next();
    };
    return request;
  }).catch((error) => {
    throw upgradeError ?? error;
  });
  if (upgrading) finishUpgrade(earned);
  setSaveSummaries(summaries || []);
};

export const storeGame = async (world: World, snapshot?: WorldSnapshot) => {
  checkUnlocks(world);
  const save = createSave(world, undefined, snapshot);
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
  const save = await readSave(id);
  if (!save) throw new Error(`Save ${id} not found!`);

  return restoreSavedWorld(save);
};

export const eraseGame = (id: string) =>
  runTransaction("readwrite", (transaction) => {
    transaction.objectStore(summaryStore).delete(id);
    transaction.objectStore(saveStore).delete(id);
  });
