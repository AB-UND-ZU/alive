# Damage

Resolves melee attacks, defenses, factions and accumulated damage.


## Queries

```ts src/engine/systems/damage.ts
world.getEntities([FRAGMENT]);
```

```ts src/engine/systems/damage.ts
world.getEntities([RENDERABLE, REFERENCE]);
```

```ts src/engine/systems/damage.ts
world.getEntities([ POSITION, MOVABLE, MELEE, EQUIPPABLE, RENDERABLE, STATS, ]);
```
