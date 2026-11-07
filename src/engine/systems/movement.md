# Movement

Moves units when their action reference is ready.


## Queries

```ts src/engine/systems/movement.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/movement.ts
world.getEntities([ POSITION, MOVABLE, RENDERABLE, `!${PLAYER}` as unknown as typeof PLAYER, ]);
```

```ts src/engine/systems/movement.ts
world.getEntities([POSITION, MOVABLE, RENDERABLE, PLAYER]);
```
