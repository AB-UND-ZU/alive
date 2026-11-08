# Refillable

Stores a refillable resource or container state.

[Harvest](../systems/harvest.md) reads `element` when a bucket is filled from this source.
<!-- source-types -->

## Refillable

```ts src/engine/components/refillable.ts
export type Refillable = {
  element: Element;
};
```
