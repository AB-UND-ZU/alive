# Saved games

`index.ts` creates and restores saved games and keeps a list of save summaries for the menu. `storage.ts` stores them in the browser's IndexedDB. Players find the controls in [Savegames](../../../wiki/savegames.md).

## Saving

The World component saves when the game pauses, on the pause screen's **SAVE** button and before **MENU** returns to the main menu. The pause screen keeps an odd number of rows so it stays centered on the cell grid. Switching browser tabs pauses and therefore saves too. `canSave` refuses the main menu, the loading screen and worlds where the player can't move, such as while stepping through a portal.

A save is a summary plus a [world snapshot](../../engine/snapshot.md). The summary holds the package version, level, class, hair color, hero level, equipped items, the tamed pet’s sprite, playtime, kills and deaths for the saves dialog. Its name is the local time in `YYYYMMDD-HHMMSS` format, 15 characters that fill a popup row next to the hero sprite.

World metadata keeps the ID of the loaded or last saved game, so saving again replaces that save instead of adding one. A new game from the menu starts without an ID and therefore adds a save.

Playtime counts world updates outside the main menu. Kills and deaths are totals of the whole game in the player component, unlike `defeatedUnits`, which is reset per level for quests.

## Storage

Summaries and saves are separate object stores in one database. The menu normally reads only summaries. `storeGame` also asks the browser to persist site storage, to reduce eviction when space runs low; the browser may decline. Clearing site data still deletes them.

The summaries are kept in memory, latest first, because popups render synchronously. They are read once on start and updated after each save or erase. Erasing removes the summary right away and deletes the stored save through `world.metadata.eraseGame`.

## Loading

The Continue portal of the main menu has a `load` popup tab. `setContinuePortal` only adds its vortex and popup while saves are listed. The menu sequence updates it when summaries finish loading after the menu was generated, or when the last save is erased. Confirming a save runs `initiateLoad`, which plays the first half of a warp: the hero steps into the portal and vision closes. After the loading screen appears, the World component restores the world, installs systems and switches to it. The restored world continues exactly as it was saved, without the vision opening of a new world. Children of the World component remount for the new world, and the camera starts at the restored viewpoint.

Some systems keep values from previous updates to react to changes. Systems are recreated when loading, so they start from the restored entities instead of zero: the magic system from the hero's received stats and each unit's damage over time, the consume system from the hero's vision, haste and stats of equipped items. Otherwise loading would replay pickups and hits, change the light radius, add equipment stats again or leave bubbles stuck. Bubble sequences retain their elapsed time through loading; older timestamp-based effects are resumed at their saved visual stage. The screen shake likewise starts from the hero's received damage.

## Upgrading saves

The first writable launch after an update runs the pending entries in `upgrades.ts` in version order. With no recorded game version, it runs all entries up to the installed version, including on saves already stamped with the current version. The 0.9.0 upgrade repairs saved entities, quests and shop menus, and recovers earned class and Island unlocks. The loading hint shows the version being applied.

After the upgrade succeeds, `alive.lastGameVersion` records the package version. Later menu visits read only summaries. Wiki previews leave saves and the version marker untouched.

Saves from newer versions can't be loaded. The saves dialog shows them in dark red.

When changing game data, check the previous release’s snapshot. A new trader catalog changes newly generated shops only. Upgrade existing deals by item, keeping their stock and selected row. Apply the same check to recipes, quest text and targets, equipment, AI and timers. Put the conversion in the next release’s file under `upgrades/`, such as `upgrades/0.10.0.ts`. The registry in `upgrades.ts` imports each version’s function. The next release converts 0.9 custom sprite references and inline artwork to snake_case IDs and keeps the original drawing instructions. It adds a wild pet to Earth Town on existing islands, updates living chicks and brewing recipes, and corrects the Fire Druid’s crystal request icon. Keep published entries in place so players can skip releases. Ordinary loads restore the resulting snapshot.

Test the released shape through upgrade and reload, including partially completed progress. The storage tests cover upgrade and retry behavior. `scripts/wiki/tests/savegames.spec.cjs` uses real browser IndexedDB and a native [[data:0.4.0]] fixture to check automatic list upgrades, graph preservation, rollback and concurrent writes.
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
  pet?: SpriteRef;
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
