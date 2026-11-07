# Harvest

Runs tool use, resource work and harvesting results.


## Queries

```ts src/engine/systems/harvest.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/harvest.ts
world.getEntities([ INVENTORY, PLAYER, POSITION, RENDERABLE, SEQUENCABLE, SPRITE, ]);
```

```ts src/engine/systems/harvest.ts
world.getEntities([ FARMABLE, POSITION, RENDERABLE, SPRITE, ]);
```

```ts src/engine/systems/harvest.ts
world.getEntities([ BREWABLE, BURNABLE, INVENTORY, POSITION, RENDERABLE, SPRITE, ]);
```

```ts src/engine/systems/harvest.ts
world.getEntities([ POSITION, MOVABLE, EQUIPPABLE, CONDITIONABLE, ORIENTABLE, ]);
```
