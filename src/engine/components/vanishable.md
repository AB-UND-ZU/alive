# VANISHABLE

Controls disappearance.

`Vanishable`

| Field | Type |
| --- | --- |
| `type` | `"plant" \| "evaporate"` |
| `cells` | `{ cell: CellType; delta: Position }[]` |
| `decayed` | `boolean` |
| `evaporate?` | `{ sprite: Sprite; fast: boolean }` |

Attach with `world.addComponentToEntity(entity, VANISHABLE, data)`. Query with `world.getEntities([VANISHABLE])`.

Systems: `drop`.
<!-- source-types -->

## Vanishable

```ts src/engine/components/vanishable.ts
export type Vanishable = {
  type: "plant" | "evaporate";
  cells: { cell: CellType; delta: Position }[];
  decayed: boolean;
  evaporate?: { sprite: Sprite; fast: boolean };
};
```
