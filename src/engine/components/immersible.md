# Immersible

Marks terrain that immerses ground units.

[Immersion](../systems/immersion.md) detects ground units entering the cell. [Movement](../systems/movement.md) separately decides whether the water is walkable.

| Field  | Meaning                                                                                |
| ------ | -------------------------------------------------------------------------------------- |
| `deep` | Distinguishes deep water from shallow water; walkability also depends on nearby cells. |
<!-- source-types -->

## Immersible

```ts src/engine/components/immersible.ts
export type Immersible = {
  type: "water";
  deep: boolean;
};
```
