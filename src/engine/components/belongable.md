# BELONGABLE

Assigns the faction used for cooperation and hostility checks.

`Belongable`

| Field | Type |
| --- | --- |
| `faction` | `Faction` |

Attach with `world.addComponentToEntity(entity, BELONGABLE, data)`. Query with `world.getEntities([BELONGABLE])`.

Systems: `ai`, `ballistics`, `burn`, `damage`, `drop`, `fate`, `homing`, `leveling`, `magic`, `text`, `trigger`.
<!-- source-types -->

## Faction

```ts src/engine/components/belongable.ts
export type Faction =
  | (typeof tribes)[number]
  | (typeof enemies)[number]
  | (typeof neutrals)[number];
```

## Belongable

```ts src/engine/components/belongable.ts
export type Belongable = {
  faction: Faction;
};
```
