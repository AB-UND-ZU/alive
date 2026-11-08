# Buildable

Names the finished cell that replaces a completed construction plot.

[Build](../systems/build.md) replaces the plot with `cell` once its [Stats](stats.md) reach `hp === maxHp`. Progress is stored in Stats, not Buildable.
<!-- source-types -->

## Buildable

```ts src/engine/components/buildable.ts
export type Buildable = {
  cell: CellType;
};
```
