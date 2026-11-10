# Vanishable

Controls disappearance.

[Drop](../systems/drop.md) advances the disappearance and creates the listed replacement cells at their relative offsets.
<!-- source-types -->

## Vanishable

```ts src/engine/components/vanishable.ts
export type Vanishable = {
  type: "plant" | "evaporate";
  color?: string;
  cells: { cell: CellType; delta: Position }[];
  decayed: boolean;
  evaporate?: { sprite: Sprite; fast: boolean };
};
```
