# Burn

Applies burning effects and their timers.


## Queries

```ts src/engine/systems/burn.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/burn.ts
world.getEntities([ POSITION, BURNABLE, RENDERABLE, SEQUENCABLE, ]);
```

```ts src/engine/systems/burn.ts
world.getEntities([POSITION, BURNABLE, FRAGMENT, RENDERABLE, SEQUENCABLE]);
```

```ts src/engine/systems/burn.ts
world.getEntities([ POSITION, AFFECTABLE, RENDERABLE, SEQUENCABLE, ]);
```

```ts src/engine/systems/burn.ts
world.getEntities([ AFFECTABLE, BELONGABLE, POSITION, RENDERABLE, SEQUENCABLE, SWIMMABLE, ]);
```

```ts src/engine/systems/burn.ts
world.getEntities([ POSITION, BURNABLE, RENDERABLE, SEQUENCABLE, SPRITE, ]);
```
