# LOOTABLE

Marks an inventory that nearby units can loot.

`Lootable`

| Field | Type |
| --- | --- |
| `disposable` | `boolean` |

Attach with `world.addComponentToEntity(entity, LOOTABLE, data)`. Query with `world.getEntities([LOOTABLE])`.

Systems: `collect`, `drop`, `leveling`.
<!-- source-types -->

## Lootable

```ts src/engine/components/lootable.ts
export type Lootable = {
  disposable: boolean;
};
```
