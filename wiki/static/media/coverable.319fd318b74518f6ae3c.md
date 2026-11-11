# Coverable

Marks snow cover that can be cleared.

[Freeze](../systems/freeze.md) creates snow cover and clears it when clicked. The only current cover type is `snow`.
<!-- source-types -->

## Coverable

```ts src/engine/components/coverable.ts
export type Coverable = { type: "snow" };
```
