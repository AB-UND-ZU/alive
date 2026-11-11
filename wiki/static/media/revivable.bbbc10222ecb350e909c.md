# Revivable

Controls revival state.

[Interact](../systems/interact.md) checks whether revival is available. [Fate](../systems/fate.md) creates the death and revival state.
<!-- source-types -->

## Revivable

```ts src/engine/components/revivable.ts
export type Revivable = {
  available: boolean;
};
```
