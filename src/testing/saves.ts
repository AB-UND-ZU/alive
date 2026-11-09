import { deserialize, serialize } from "v8";
import { World } from "../engine";
import { createSystems, preloadLevel } from "../engine/ecs";
import {
  createSnapshot,
  restoreSnapshot,
  WorldSnapshot,
} from "../engine/snapshot";

/**
 * Save a world and load it again like a saved game. The snapshot passes the
 * structured clone algorithm IndexedDB uses, then systems start fresh.
 * Kept apart from the harness, which the Wiki bundles for browsers.
 */
export const saveAndLoad = (world: World) => {
  const snapshot = deserialize(serialize(createSnapshot(world)));
  const loaded = restoreSnapshot(snapshot as WorldSnapshot);
  loaded.metadata.initial = false;
  createSystems(loaded);
  preloadLevel(loaded);
  return loaded;
};
