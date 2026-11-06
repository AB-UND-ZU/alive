# Game Tests

`harness.ts` boots game systems without React or WebGL. Use it for rules that should be deterministic. `render.tsx` adds the React Three test renderer when scene graph behavior matters.

## Small worlds

`createAreaWorld` builds a map from rows enclosed in `|` characters. The borders protect meaningful spaces from editor trimming. Each row must have the same width and the map needs a hero.

Pass `legend` to map extra characters to any cell name handled by `createCell`, for example `{ D: "iron_door", K: "kettle" }`. Use it for doors, workstations, units and objects without a built-in character.

`holdMove` holds a direction. `walk` waits for a requested number of cell moves and throws if blocked. Use `holdMove` plus `step` to test a blocked movement rather than asking `walk` to complete an impossible step.

`trigger` queues an action and wakes the hero's reference frame. `step` advances 1/30-second frames. `advance` rounds a duration up to complete frames. `advanceUntil` waits for a condition with a timeout.

## Items and positions

`giveItems` puts items into an inventory and equips gear into free slots, like a first pickup. `getItems` and `countItems` read carried items, e.g. `countItems(world, hero, { stackable: "arrow" })`. `getEntitiesAt` and `findEntityAt` look up entities in a cell. `face` turns the hero before casting or using a tool.

## What to assert

Name the feature and its outcome: wading near land, blocking deep water, stopping on release, or opening a matching lock. Check relevant component state or visible output. Keep setup small and use existing factories.

Gameplay feature tests live in `src/features/`, grouped by area with one file per feature, station, spell, skill or tool.

Jest setup seeds randomness and records sound calls. Slow suites cover larger generated worlds and rendering. Run `npm run test:fast` while working and `npm run test:all` when the affected feature needs the wider coverage. `npm run test:coverage` runs all tests with a coverage report in `coverage/`; CI adds its summary to the job and uploads the HTML report.

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
