# Trigger

Activates equipped spells, skills and tools.


## Queries

```ts src/engine/systems/trigger.ts
world.getEntities([]);
```

```ts src/engine/systems/trigger.ts
world.getEntities([BAITABLE, POSITION]);
```

```ts src/engine/systems/trigger.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/trigger.ts
world.getEntities([ ACTIONABLE, MOVABLE, POSITION, RENDERABLE, ]);
```

```ts src/engine/systems/trigger.ts
world.getEntities([VIEWABLE, POSITION]);
```
