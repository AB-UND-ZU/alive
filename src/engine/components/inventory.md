# INVENTORY

Stores carried item entity IDs.

`Inventory`

| Field | Type |
| --- | --- |
| `items` | `number[]` |

Attach with `world.addComponentToEntity(entity, INVENTORY, data)`. Query with `world.getEntities([INVENTORY])`.

Systems: `action`, `ai`, `ballistics`, `burn`, `collect`, `consume`, `damage`, `drop`, `fate`, `fishing`, `harvest`, `homing`, `leveling`, `map`, `popup`, `trigger`.
<!-- source-types -->

## Inventory

```ts src/engine/components/inventory.ts
export type Inventory = {
  items: number[];
};
```
