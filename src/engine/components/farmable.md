# FARMABLE

Tracks watered soil, planted seeds, and growth stages.

`Farmable`

| Field | Type |
| --- | --- |
| `watered` | `boolean` |
| `planted?` | `Stackable` |
| `sapling?` | `number` |
| `progress?` | `number` |
| `nextGeneration?` | `number` |

Attach with `world.addComponentToEntity(entity, FARMABLE, data)`. Query with `world.getEntities([FARMABLE])`.

Systems: `ai`, `harvest`, `interact`, `trigger`, `water`.
<!-- source-types -->

## Farmable

```ts src/engine/components/farmable.ts
export type Farmable = {
  watered: boolean;
  planted?: Stackable;
  sapling?: number;
  progress?: number;
  nextGeneration?: number;
};
```
