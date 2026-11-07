# REMAINABLE

Describes remains left after destruction.

`Remainable`

| Field | Type |
| --- | --- |
| `cell?` | `CellType` |

Attach with `world.addComponentToEntity(entity, REMAINABLE, data)`. Query with `world.getEntities([REMAINABLE])`.

Systems: `burn`, `drop`.
<!-- source-types -->

## Remainable

```ts src/engine/components/remainable.ts
export type Remainable = {
  cell?: CellType;
};
```
