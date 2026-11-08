# Freezable

Tracks freezing and thawing.

[Freeze](../systems/freeze.md) sets `frozen` and changes the affected terrain or object. Unit control restrictions also use [Affectable](affectable.md).
<!-- source-types -->

## Freezable

```ts src/engine/components/freezable.ts
export type Freezable = {
  frozen: boolean;
};
```
