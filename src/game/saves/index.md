# Saved games

`index.ts` creates and upgrades saved games and keeps a list of save summaries for the menu. `storage.ts` stores them in the browser's IndexedDB. Players find the controls in [Savegames](../../../wiki/savegames.md).

## Saving

The World component saves when the game pauses, on the pause screen's **SAVE** button and before **MENU** returns to the main menu. The pause screen keeps an odd number of rows so it stays centered on the cell grid. Switching browser tabs pauses and therefore saves too. `canSave` refuses the main menu, the loading screen and worlds where the player can't move, such as while stepping through a portal.

A save is a summary plus a [world snapshot](../../engine/snapshot.md). The summary holds the package version, level, class, hair color, hero level, equipped items, playtime, kills and deaths for the saves dialog. Its name is the local time in `YYYYMMDD-HHMMSS` format, 15 characters that fill a popup row next to the hero sprite.

World metadata keeps the ID of the loaded or last saved game, so saving again replaces that save instead of adding one. A new game from the menu starts without an ID and therefore adds a save.

Playtime counts world updates outside the main menu. Kills and deaths are totals of the whole game in the player component, unlike `defeatedUnits`, which is reset per level for quests.

## Storage

Summaries and saves are separate object stores in one database. The menu normally reads only summaries. An older summary also reads its saved world so both records can upgrade before the menu cache is published. Current saves keep the summaries-only path. `storeGame` also asks the browser to persist site storage, to reduce eviction when space runs low; the browser may decline. Clearing site data still deletes them.

The summaries are kept in memory, latest first, because popups render synchronously. They are read once on start and updated after each save or erase. Erasing removes the summary right away and deletes the stored save through `world.metadata.eraseGame`.

## Loading

The Continue portal of the main menu has a `load` popup tab. `setContinuePortal` only adds its vortex and popup while saves are listed. The menu sequence updates it when summaries finish loading after the menu was generated, or when the last save is erased. Confirming a save runs `initiateLoad`, which plays the first half of a warp: the hero steps into the portal and vision closes. After the loading screen appears, the World component restores the world, installs systems and switches to it. The restored world continues exactly as it was saved, without the vision opening of a new world. Children of the World component remount for the new world, and the camera starts at the restored viewpoint.

Some systems keep values from previous updates to react to changes. Systems are recreated when loading, so they start from the restored entities instead of zero: the magic system from the hero's received stats and each unit's damage over time, the consume system from the hero's vision, haste and stats of equipped items. Otherwise loading would replay pickups and hits, change the light radius, add equipment stats again or leave bubbles stuck. Bubble sequences retain their elapsed time through loading; older timestamp-based effects are resumed at their saved visual stage. The screen shake likewise starts from the hero's received damage.

## Upgrading saves

Each save stores the package version. When a release changes world data, such as component fields or sprite names, add an entry to `saveUpgrades` with that release's version. `upgradeSave` passes a save through every upgrade newer than its version, in version order, and sets the version after each step. An entry can also advance the stored release without changing world data. The [[data:0.5.0]] entry keeps the snapshot unchanged.

Loading the save list upgrades older records automatically in one transaction across the summary and snapshot stores. No confirmation or load action is needed. The cache changes only after that transaction commits. Missing worlds or snapshots stay unchanged. A newer actual save is never downgraded; its cached summary carries the actual version even if its stored summary is stale.

Saves from newer versions can't be loaded. The saves dialog shows them in dark red.

Test upgrades with saved data from the previous version. The tests in `index.test.ts` cover ordering and refusal with example upgrades. `scripts/wiki/tests/savegames.spec.cjs` uses real browser IndexedDB and a native [[data:0.4.0]] fixture to check automatic list upgrades, graph preservation, rollback and concurrent writes.
<!-- source-types -->

## SaveItem

```ts src/game/saves/index.ts
export type SaveItem = Omit<Item, "carrier" | "amount" | "bound">;
```

## SaveSummary

```ts src/game/saves/index.ts
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
```

## SaveGame

```ts src/game/saves/index.ts
export type SaveGame = SaveSummary & { snapshot: WorldSnapshot };
```
