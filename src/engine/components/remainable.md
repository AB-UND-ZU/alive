# Remainable

Describes remains left after destruction.

[Drop](../systems/drop.md) and [Burn](../systems/burn.md) use the replacement cell after destruction. An absent `cell` leaves no explicit replacement.
<!-- source-types -->

## Remainable

```ts src/engine/components/remainable.ts
export type Remainable = {
  cell?: CellType;
};
```
