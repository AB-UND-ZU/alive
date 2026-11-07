# Build

Places constructions and tracks work on them.


## Queries

```ts src/engine/systems/build.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/build.ts
world.getEntities([ BUILDABLE, POSITION, RENDERABLE, STATS, ]);
```

```ts src/engine/systems/build.ts
world.getEntities([ POSITION, MOVABLE, EQUIPPABLE, CONDITIONABLE, ORIENTABLE, ]);
```
