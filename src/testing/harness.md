# Game Tests

`harness.ts` boots game systems without React or WebGL. Use it for rules that should be deterministic. `render.tsx` adds the React Three test renderer when scene graph behavior matters.

## Small worlds

`createAreaWorld` builds a map from rows enclosed in `|` characters. The borders protect meaningful spaces from editor trimming. Each row must have the same width and the map needs a hero.

Pass `legend` to map extra characters to any cell name handled by `createCell`, for example `{ D: "iron_door", K: "kettle" }`. Use it for doors, workstations, units and objects without a built-in character.

`holdMove` holds a direction. `walk` waits for a requested number of cell moves and throws if blocked. Use `holdMove` plus `step` to test a blocked movement rather than asking `walk` to complete an impossible step.

`trigger` queues an action and wakes the hero's reference frame. `step` advances 1/30-second frames. `advance` rounds a duration up to complete frames. `advanceUntil` waits for a condition with a timeout.

## Items and positions

`giveItems` puts items into an inventory and equips gear into free slots, like a first pickup. `getItems` and `countItems` read carried items, e.g. `countItems(world, hero, { stackable: "arrow" })`. `getEntitiesAt` and `findEntityAt` look up entities in a cell. `face` turns the hero before casting or using a tool.

## Saved games

`saveAndLoad` in `saves.ts` saves a world and loads it like a saved game: the snapshot passes the structured clone algorithm IndexedDB uses, and systems start fresh. Continue playing the returned world and assert the feature still works, not only that its data was copied.

## What to assert

Name the feature and its outcome: wading near land, blocking deep water, stopping on release, or opening a matching lock. Check relevant component state or visible output. Keep setup small and use existing factories.

Gameplay feature tests live in `src/features/`, grouped by area with one file per feature, station, spell, skill or tool.

Jest setup seeds randomness and records sound calls. Slow suites cover React integration and rendering. Run `npm run test:fast` while working and `npm run test:all` when the affected feature needs the wider coverage. These commands and `npm test` leave out generation suites.

Generation suites use `.generation.test.ts`. Run `npm run test:generation` only when changing level generation or generation-dependent fixtures, including Island save snapshots, presets and Minimap exploration. CI uses `npm run test:ci` to run game and generation tests together with a coverage report in `coverage/`. It adds the summary to the job, uploads the HTML report and fails below the thresholds in `package.json`. Wiki site code is left out, as the Wiki browser tests cover it.

Wiki browser tests check imported examples, focus and dialog controls, navigation, page errors and small-screen layout. See [wiki tools](../wiki/index.md).
<!-- source-types -->

## TestWorldOptions

```ts src/testing/harness.ts
export type TestWorldOptions = {
  level?: LevelName;
  /** replace default dimensions, e.g. to shrink the initialized area */
  dimensions?: Partial<World["metadata"]["dimensions"]>;
};
```

## AreaWorldOptions

```ts src/testing/harness.ts
export type AreaWorldOptions = {
  level?: LevelName;
  /** square map size, defaults to the larger side of the area */
  size?: number;
  /** extra characters mapped to any cell type, e.g. `{ D: "iron_door" }` */
  legend?: Record<string, string>;
};
```

## HeroAction

```ts src/testing/harness.ts
export type HeroAction =
  | "spell"
  | "skill"
  | "interact"
  | NonNullable<Player["actionTriggered"]>;
```

## GivenItem

```ts src/testing/harness.ts
export type GivenItem = Omit<Item, "carrier" | "bound"> & { bound?: boolean };
```
