# Fishing

Runs hook casting and the catch interaction.


## Queries

```ts src/engine/systems/fishing.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/fishing.ts
world.getEntities([ ACTIONABLE, CONDITIONABLE, EQUIPPABLE, INVENTORY, MOVABLE, RENDERABLE, ]);
```

```ts src/engine/systems/fishing.ts
world.getEntities([ BAITABLE, BUMPABLE, RENDERABLE, POSITION, ]);
```

```ts src/engine/systems/fishing.ts
world.getEntities([HOOKABLE, MOVABLE, RENDERABLE]);
```
