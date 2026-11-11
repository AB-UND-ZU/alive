# Position

Stores wrapped grid coordinates.

Use `moveEntity` from [Map](../systems/map.md) to move a registered entity. Writing coordinates directly leaves its old cell registration behind.
<!-- source-types -->

## Position

```ts src/engine/components/position.ts
export type Position = {
  x: number;
  y: number;
};
```
