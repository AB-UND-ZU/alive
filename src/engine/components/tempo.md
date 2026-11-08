# Tempo

Modifies action timing on a cell.

[Movement](../systems/movement.md) includes terrain tempo in action timing. [Harvest](../systems/harvest.md) and [Freeze](../systems/freeze.md) change ground that affects it.
<!-- source-types -->

## Tempo

```ts src/engine/components/tempo.ts
export type Tempo = {
  amount: number;
};
```
