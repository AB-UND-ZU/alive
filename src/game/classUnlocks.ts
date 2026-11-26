import type { World } from "../engine";
import { INVENTORY } from "../engine/components/inventory";
import { PLAYER } from "../engine/components/player";
import { existingFund } from "../engine/systems/popup";
import type { ClassKey } from "./balancing/classes";

const unlockable = ["knight", "mage", "???"] as const;
const unlocked = new Set<ClassKey>();
const storageKey = (key: ClassKey) => "alive.class." + key;

export const loadClassUnlocks = () => {
  try {
    for (const key of unlockable) {
      if (localStorage.getItem(storageKey(key))) unlocked.add(key);
      else unlocked.delete(key);
    }
  } catch {}
};

export const isClassUnlocked = (key: ClassKey) =>
  key === "rogue" || unlocked.has(key);

const unlock = (key: ClassKey) => {
  unlocked.add(key);
  try {
    localStorage.setItem(storageKey(key), "1");
  } catch {}
};

export const setClassesUnlocked = (value: boolean) => {
  for (const key of unlockable) {
    if (value) unlock(key);
    else {
      unlocked.delete(key);
      try {
        localStorage.removeItem(storageKey(key));
      } catch {}
    }
  }
};

export const checkClassUnlocks = (world: World) => {
  if (world.metadata.readOnlySaves) return;
  const player = world.getEntity([PLAYER]);
  if (!player) return;
  const defeats = player[PLAYER].defeatedUnits;
  if (defeats.chestBoss && !isClassUnlocked("???")) unlock("???");
  if (defeats.fireNomad && !isClassUnlocked("knight")) unlock("knight");
  if (
    !isClassUnlocked("mage") &&
    player[INVENTORY] &&
    existingFund(world, player, { stackable: "gem" }) > 0
  ) {
    unlock("mage");
  }
};
