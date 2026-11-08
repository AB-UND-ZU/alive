# Trackable

Stores a compass or marker target.

[Needle](../systems/needle.md) points toward the target across wrapping edges. [Focus](../systems/focus.md) updates the target used by quest and grave markers.
<!-- source-types -->

## Trackable

```ts src/engine/components/trackable.ts
export type Trackable = {
  target?: number;
  quadrant?: Position
};
```
