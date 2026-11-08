# Farmable

Tracks watered soil, planted seeds, and growth stages.

[Harvest](../systems/harvest.md) advances crop stages. [Water](../systems/water.md) updates watered ground.

| Field            | Meaning                                       |
| ---------------- | --------------------------------------------- |
| `sapling`        | Entity ID of the visible growing plant.       |
| `progress`       | Index of the current growth stage.            |
| `nextGeneration` | World generation at which growth may advance. |
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
