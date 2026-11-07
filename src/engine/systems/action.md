# Action

Resolves nearby actions such as doors, signs and portals.


## Queries

```ts src/engine/systems/action.ts
world.getEntities([CASTABLE, EXERTABLE, SEQUENCABLE]);
```

```ts src/engine/systems/action.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/action.ts
world.getEntities([ POSITION, ACTIONABLE, MOVABLE, RENDERABLE, ]);
```
