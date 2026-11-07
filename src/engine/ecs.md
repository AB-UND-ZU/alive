# Engine

`ecs.ts` wraps the vendored ECS in a typed world API. Each level has a component tag; world queries include that tag so entities from another level do not participate in the active simulation.

## Creating a world

Create the world, call `createLevel`, install systems with `createSystems`, run the level generator, then call `preloadLevel`. The React World component follows that order. Preloading registers positioned entities and performs an initial update.

A saved game is restored from a [snapshot](snapshot.md) instead of a generator, then gets systems and a preload the same way.

Metadata holds level entities, render counters, listeners, interaction state, and UI callbacks. `getEntityById` can return nothing. The assert variants throw when an ID or required component is missing.

## Reference frames

A movable entity points to a reference entity with its own tick interval and accumulated delta. The tick system advances reference generations. Most systems skip work when their relevant generation has not changed.

`components/Systems` advances simulation at 30 fixed updates per second. Action intervals can span several updates. World ticks, hero haste, and animation sequences use different reference frames; an update is not necessarily one movement.

## System order

The order in `createSystems` is part of the behavior. Initialization and ticking come first. Input triggers, popups, tools, collection, pushing, damage, and movement precede effects, sequences, fate, visibility, rendering, and map cleanup.

Read the actual list before inserting a system. A later system may depend on an entity or generation created earlier in the same update. Do not alphabetize the list.

## Rendering changes

`rerenderEntity` increments a renderable generation. `getEntityGeneration` includes reference frames, sequence states, and equipped entities. The renderer notifies subscribers when reference generations change. Changing component data alone may not notify the UI.

See [world creation](../bindings/creation.md), [HTML sprite rendering](../components/Row/index.md), and the [test harness](../testing/harness.md).
<!-- source-types -->

## World

```ts src/engine/ecs.ts
export type World = ReturnType<typeof createWorld>;
```

## PatchedWorld

```ts src/engine/ecs.ts
export type PatchedWorld = ECSWorld & { ecs: World };
```
