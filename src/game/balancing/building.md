# Building Plans

`buildConstructions` is the plan registry used by the hammer dialog and [Build](../../engine/systems/build.md). Each entry describes one construction and all its variants.

| Field       | Meaning                                        |
| ----------- | ---------------------------------------------- |
| description | Dialog rows explaining the plan                |
| sprite      | Plan's selection icon                          |
| variants    | Finished cell names and optional variant icons |
| grounds     | Allowed target ground kinds                    |
| parts       | Required item amounts                          |
| level       | Required hammer build stat                     |
| effort      | Work needed after placement                    |

Change costs and supported variants in this registry. Player-facing [Building](../../../docs/building.md) imports it, so no separate recipe table needs updating.
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
