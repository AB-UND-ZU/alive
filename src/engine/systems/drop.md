# Drop

Releases carried items and resolves drops.


## Queries

```ts src/engine/systems/drop.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/drop.ts
world.getEntities([ DROPPABLE, RENDERABLE, SEQUENCABLE, POSITION, ]);
```

```ts src/engine/systems/drop.ts
world.getEntities([ POSITION, RENDERABLE, SEQUENCABLE, VANISHABLE, ]);
```

```ts src/engine/systems/drop.ts
world.getEntities([ DROPPABLE, HARVESTABLE, RENDERABLE, SEQUENCABLE, POSITION, ]);
```

```ts src/engine/systems/drop.ts
world.getEntities([ FRAGMENT, RENDERABLE, SEQUENCABLE, POSITION, ]);
```

```ts src/engine/systems/drop.ts
world.getEntities([DROPPABLE, RENDERABLE, POSITION]);
```

```ts src/engine/systems/drop.ts
world.getEntities([LOOTABLE, RENDERABLE]);
```
