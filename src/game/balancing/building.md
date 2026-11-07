# building.ts
<!-- source-types -->

## Construction

```ts src/game/balancing/building.ts
export type Construction = {
  description: Sprite[][];
  sprite: Sprite;
  variants: {
    sprite?: Sprite;
    cell: CellType;
  }[];
  grounds: ("air" | "water" | "sand" | "path")[];
  parts: Omit<Item, "carrier" | "bound">[];
  level: number;
  effort: number;
};
```
