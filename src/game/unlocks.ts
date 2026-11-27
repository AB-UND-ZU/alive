import type { World } from "../engine";
import { INVENTORY } from "../engine/components/inventory";
import type { LevelName } from "../engine/components/level";
import { PLAYER } from "../engine/components/player";
import { existingFund } from "../engine/systems/popup";
import type { ClassKey } from "./balancing/classes";

const unlockable = ["knight", "mage", "???", "LEVEL_ISLAND"] as const;
const unlocked = new Set<ClassKey | LevelName>();
export type Unlock = (typeof unlockable)[number];
const storageKey = (key: Unlock) =>
  key === "LEVEL_ISLAND" ? "alive.level.island" : "alive.class." + key;

export const loadUnlocks = () => {
  try {
    for (const key of unlockable) {
      if (localStorage.getItem(storageKey(key)) === "1") unlocked.add(key);
      else unlocked.delete(key);
    }
  } catch {}
};

export const hasUnlock = (key: ClassKey | LevelName) =>
  key === "rogue" || unlocked.has(key);

export const persistUnlock = (key: Unlock) => {
  unlocked.add(key);
  localStorage.setItem(storageKey(key), "1");
};

const unlock = (key: Unlock) => {
  try { persistUnlock(key); } catch {}
};

export const setUnlocks = (value: boolean) => {
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

export const checkUnlocks = (world: World, grant: (key: Unlock) => void = unlock) => {
  if (world.metadata.readOnlySaves) return;
  const player = world.getEntity([PLAYER]);
  if (!player) return;
  const defeats = player[PLAYER].defeatedUnits;
  if (defeats?.tutorialBoss && !hasUnlock("LEVEL_ISLAND")) grant("LEVEL_ISLAND");
  if (defeats?.chestBoss && !hasUnlock("???")) grant("???");
  if (defeats?.fireNomad && !hasUnlock("knight")) grant("knight");
  if (!hasUnlock("mage") && player[INVENTORY] && existingFund(world, player, { stackable: "gem" }) > 0) {
    grant("mage");
  }
};
