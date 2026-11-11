# Enterable

Stores building or room entry information.

[Enter](../systems/enter.md) uses the entry sprite and orientation to choose the interior view. [Layer](layer.md) records which structure contains an entity.
<!-- source-types -->

## Enterable

```ts src/engine/components/enterable.ts
export type Enterable = {
  sprite: Sprite;
  orientation?: Orientation | null;
};
```
