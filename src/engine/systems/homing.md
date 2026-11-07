# Homing

Steers homing projectiles toward their targets.


## Queries

```ts src/engine/systems/homing.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/homing.ts
world.getEntities([CASTABLE, HOMING, POSITION]);
```

```ts src/engine/systems/homing.ts
world.getEntities([ HOMING, MOVABLE, ORIENTABLE, POSITION, ]);
```
