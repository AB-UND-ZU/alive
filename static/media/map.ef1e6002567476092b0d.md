# Map

Maintains the wrapped spatial index and walkability used by movement and interactions.

| Helper           | Contract                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| registerEntity   | Normalize coordinates, insert the entity and update nearby walkability         |
| moveEntity       | Remove the old cell registration, change position and register the destination |
| getCell          | Read the normalized cell's entity-ID map                                       |
| getCellEntities  | Read a cached, immutable array of the cell's entities                          |
| updateWalkable   | Refresh nearby entries in the duplicated pathfinding matrix                    |
| disposeParticles | Remove particles owned by a sequence state                                     |
| disposeFrame     | Remove a frame while preserving its render-generation contribution             |
| disposeSequence  | Remove a state's frame and particles                                           |
| disposeEntity    | Unregister and remove the entity and its owned items/effects                   |

Disposal is final and safe to repeat: bulk level cleanup may visit a popup viewpoint after its owner already disposed it. Its map registration and owned resources are removed only once.

Use these helpers rather than changing registered coordinates or calling the bare ECS removal method. Movement does not perform a walkability check here; [Movement](movement.md) checks that separately.

```ts src/engine/systems/map.ts
moveEntity(world, hero, { x: hero.POSITION.x + 1, y: hero.POSITION.y });
rerenderEntity(world, hero);
```

The map system runs last: it flushes ECS changes and registers newly positioned entities. [Preloading](../ecs.md) runs it once before the first full update.
<!-- source-types -->

## ListenerEntities

```ts src/engine/systems/map.ts
type ListenerEntities = { count: number; entries: Entity[] };
```
