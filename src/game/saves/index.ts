import type { TypedEntity } from "../../engine/entities";
import { World } from "../../engine";
import { LEVEL, LevelName } from "../../engine/components/level";
import { MOVABLE } from "../../engine/components/movable";
import { EQUIPPABLE, equipments } from "../../engine/components/equippable";
import { Item, ITEM } from "../../engine/components/item";
import { PLAYER } from "../../engine/components/player";
import { SOUL } from "../../engine/components/soul";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { STATS } from "../../engine/components/stats";
import { createSnapshot, restoreSnapshot, WorldSnapshot } from "../../engine/snapshot";
import { ClassKey } from "../balancing/classes";
import { saveUpgrades, saveVersion } from "./upgrades";

export { saveUpgrades, saveVersion };

export const pauseSaveDelay = 150;

export type SaveItem = Omit<Item, "carrier" | "amount" | "bound">;

export type SaveSummary = {
  id: string;
  // local time as YYYYMMDD-HHMMSS, fits exactly into a popup row
  name: string;
  version: string;
  level: LevelName;
  classKey: ClassKey;
  hairColor: string;
  heroLevel: number;
  // equipped gear, then accessories
  items: SaveItem[];
  playtime: number;
  kills: number;
  deaths: number;
};

export type SaveGame = SaveSummary & { snapshot: WorldSnapshot };

export const compareVersions = (left: string, right: string) => {
  const leftParts = left.split(".").map((part) => parseInt(part, 10) || 0);
  const rightParts = right.split(".").map((part) => parseInt(part, 10) || 0);

  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) return Math.sign(difference);
  }

  return 0;
};

// saves of newer game versions can't be downgraded
export const isLoadable = (save: SaveSummary, version = saveVersion) =>
  compareVersions(save.version, version) <= 0;

export const upgradeSave = (
  save: SaveGame,
  version = saveVersion,
  upgrades = saveUpgrades
) => {
  if (!isLoadable(save, version)) {
    throw new Error(`Save ${save.name} is from newer version ${save.version}!`);
  }

  return upgrades
    .filter(
      (upgrade) =>
        compareVersions(upgrade.version, save.version) > 0 &&
        compareVersions(upgrade.version, version) <= 0
    )
    .sort((left, right) => compareVersions(left.version, right.version))
    .reduce(
      (upgraded, upgrade) => ({
        ...upgrade.upgrade(upgraded),
        version: upgrade.version,
      }),
      save
    );
};

const pad = (value: number) => value.toString().padStart(2, "0");

export const getSaveName = (date: Date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

export const formatPlaytime = (playtime: number) => {
  const seconds = Math.floor(playtime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return `${hours}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
};

export const getPlayer = (world: World) => world.getEntity([PLAYER, SPAWNABLE]);

// players can't move while switching worlds, e.g. when stepping into portals
export const canSave = (world: World) =>
  !world.metadata.readOnlySaves &&
  world.metadata.gameEntity[LEVEL].name !== "LEVEL_MENU" &&
  !!getPlayer(world)?.[MOVABLE];

const getEquippedItems = (world: World, player: TypedEntity): SaveItem[] =>
  Array.from(
    new Set(equipments.map((equipment) => player[EQUIPPABLE]?.[equipment]))
  ).flatMap((itemId) => {
    const itemEntity = world.getEntityByIdAndComponents(itemId, [ITEM]);
    if (!itemEntity) return [];

    const { carrier, amount, bound, ...item } = itemEntity[ITEM];
    return [item];
  });

export const createSave = (
  world: World,
  date = new Date(),
  snapshot?: WorldSnapshot
): SaveGame => {
  const player = getPlayer(world);
  if (!player) throw new Error("Unable to save without a player!");

  const name = getSaveName(date);

  return {
    id:
      world.metadata.saveId || `${name}-${Math.random().toString(36).slice(2)}`,
    name,
    version: saveVersion,
    level: world.metadata.gameEntity[LEVEL].name,
    classKey: player[SPAWNABLE].classKey,
    hairColor: player[SPAWNABLE].hairColor,
    heroLevel: player[STATS]?.level ?? player[SOUL]?.stats.level ?? 1,
    items: getEquippedItems(world, player),
    playtime: world.metadata.playtime,
    kills: player[PLAYER].kills,
    deaths: player[PLAYER].deaths,
    snapshot: snapshot ?? createSnapshot(world),
  };
};

export const restoreSavedWorld = (save: SaveGame) => {
  const world = restoreSnapshot(upgradeSave(save).snapshot);
  world.metadata.saveId = save.id;
  return world;
};

export const getSummary = ({ snapshot, ...summary }: SaveGame): SaveSummary =>
  summary;

// loaded once on start and kept in sync with storage, for synchronous access
let saveSummaries: SaveSummary[] = [];

export const getSaveSummaries = () => saveSummaries;

export const setSaveSummaries = (summaries: SaveSummary[]) => {
  // names are timestamps, so the latest save comes first
  saveSummaries = [...summaries].sort((left, right) =>
    right.name.localeCompare(left.name)
  );
};

export const updateSaveSummary = (summary: SaveSummary) =>
  setSaveSummaries([
    summary,
    ...saveSummaries.filter((existing) => existing.id !== summary.id),
  ]);

export const removeSaveSummary = (id: string) =>
  setSaveSummaries(saveSummaries.filter((existing) => existing.id !== id));
