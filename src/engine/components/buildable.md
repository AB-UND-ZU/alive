# BUILDABLE

Stores construction progress and the finished cell to create.

`Buildable`

| Field | Type |
| --- | --- |
| `cell` | `CellType` |

Attach with `world.addComponentToEntity(entity, BUILDABLE, data)`. Query with `world.getEntities([BUILDABLE])`.

Systems: `build`, `harvest`, `trigger`.
<!-- source-types -->

## Buildable

```ts src/engine/components/buildable.ts
export type Buildable = {
  cell: CellType;
};
```
