import { saveUpgrades, upgradeSave } from "../game/saves/upgrades";
import { createSave, restoreSavedWorld, SaveGame } from "../game/saves";
import type { Sprite } from "../engine/components/sprite";
import { runGeneration } from "../game/levels/generation";
import { deserialize, serialize } from "v8";
import { World } from "../engine";
import { createSystems, preloadLevel } from "../engine/ecs";
import { createSnapshot, restoreSnapshot } from "../engine/snapshot";

export const restoreUpgradedSave = (save: SaveGame) => {
  const updated = saveUpgrades.reduce(
    (current, step) => upgradeSave(current, step, new Set()),
    save
  );
  const world = restoreSnapshot(updated.snapshot);
  world.metadata.saveId = updated.id;
  return world;
};

/**
 * Save a world and load it again like a saved game. The snapshot passes the
 * structured clone algorithm IndexedDB uses, then systems start fresh.
 * Kept apart from the harness, which the Wiki bundles for browsers.
 */
export const saveAndLoad = (world: World, version?: string) => {
  const save = deserialize(serialize(createSave(world)));
  const loaded = version ? restoreUpgradedSave({ ...save, version }) : restoreSavedWorld(save);
  loaded.metadata.initial = false;
  createSystems(loaded);
  preloadLevel(loaded);
  return loaded;
};

// Follow the same snapshot handoff as a session when the portal finishes closing.
export const receiveGeneratedWorld = (world: World, report?: (line: Sprite[]) => void) => {
  let arrival: World | undefined;
  world.metadata.generateLevel = (destination) => {
    runGeneration(
      { ...destination, source: createSnapshot(world) },
      (message) => {
        if ("line" in message) report?.(message.line);
        if ("snapshot" in message) {
          arrival = restoreSnapshot(message.snapshot);
          createSystems(arrival);
          preloadLevel(arrival);
        }
      }
    );
  };
  return () => {
    if (!arrival) throw new Error("Portal did not finish");
    return arrival;
  };
};
