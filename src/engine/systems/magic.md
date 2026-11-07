# Magic

Updates ability effects and their affected targets.


## Queries

```ts src/engine/systems/magic.ts
world.getEntities([CASTABLE, SEQUENCABLE]);
```

```ts src/engine/systems/magic.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/magic.ts
world.getEntities([POSITION, CASTABLE, RENDERABLE]);
```

```ts src/engine/systems/magic.ts
world.getEntities([POSITION, EXERTABLE]);
```

```ts src/engine/systems/magic.ts
world.getEntities([SEQUENCABLE, PLAYER, STATS]);
```

```ts src/engine/systems/magic.ts
world.getEntities([ SEQUENCABLE, AFFECTABLE, STATS, POSITION, ]);
```

Initialize received stats and damage-over-time caches from existing entities. Restoring a snapshot must not replay old damage or pickup effects. See [saved games](../../game/saves/index.md).

