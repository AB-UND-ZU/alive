# Fate

Handles death, ghosts, graves and respawn.


## Queries

```ts src/engine/systems/fate.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/fate.ts
world.getEntities([ PLAYER, BELONGABLE, DROPPABLE, RENDERABLE, POSITION, LAYER, LIGHT, VIEWABLE, SPAWNABLE, EQUIPPABLE, SEQUENCABLE, STATS, ]);
```

```ts src/engine/systems/fate.ts
world.getEntities([ BELONGABLE, SEQUENCABLE, RENDERABLE, SOUL, LIGHT, POSITION, VIEWABLE, SPAWNABLE, PLAYER, ]);
```
