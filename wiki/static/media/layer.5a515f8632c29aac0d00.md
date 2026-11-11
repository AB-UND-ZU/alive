# Layer

Stores structure-layer membership for indoor and outdoor rendering.

[Enter](../systems/enter.md) sets structure membership when entering or leaving a building. An absent `structure` means the entity is outside.
<!-- source-types -->

## Layer

```ts src/engine/components/layer.ts
export type Layer = {
  structure?: number;
};
```
