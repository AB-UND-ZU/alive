import { compareVersions, saveVersion } from ".";
import type { SaveGame } from ".";
import { loadUnlocks, persistUnlock, Unlock } from "../unlocks";
import upgradeTo0_9_0 from "./upgrades/0.9.0";
import upgradeTo0_10_0 from "./upgrades/0.10.0";

const versionKey = "alive.lastGameVersion";

export const saveUpgrades = [
  { version: "0.9.0", upgrade: upgradeTo0_9_0 },
  { version: "0.10.0", upgrade: upgradeTo0_10_0 },
];

export const pendingUpgrades = () => {
  const last = localStorage.getItem(versionKey);
  if (last && compareVersions(last, saveVersion) >= 0) return;
  loadUnlocks();
  return saveUpgrades
    .filter(({ version }) =>
      (!last || compareVersions(version, last) > 0) && compareVersions(version, saveVersion) <= 0
    )
    .sort((a, b) => compareVersions(a.version, b.version));
};

export const upgradeSave = (save: SaveGame, step: (typeof saveUpgrades)[number], earned: Set<Unlock>) => ({
  ...step.upgrade(save, earned),
  version: step.version,
});

export const finishUpgrade = (earned: Set<Unlock>) => {
  earned.forEach(persistUnlock);
  localStorage.setItem(versionKey, saveVersion);
};
