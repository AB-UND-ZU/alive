# Collect

Collects nearby drops and applies inventory or stat changes.


## Queries

```ts src/engine/systems/collect.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/collect.ts
world.getEntities([ POSITION, COLLECTABLE, MOVABLE, INVENTORY, STATS, RENDERABLE, ]);
```
