# Push

Moves pushable objects when their destination is free.


## Queries

```ts src/engine/systems/push.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/push.ts
world.getEntities([POSITION, MOVABLE, DISPLACABLE]);
```

```ts src/engine/systems/push.ts
world.getEntities([POSITION, MOVABLE, PUSHABLE]);
```
