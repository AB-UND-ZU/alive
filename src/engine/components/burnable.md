# Burnable

Tracks active fire, simmering, combustion, and decay.

[Burn](../systems/burn.md) starts and stops fire sequences. `eternal` keeps a fire source active; `combusted` and `decayed` track later destruction stages.
<!-- source-types -->

## Burnable

```ts src/engine/components/burnable.ts
export type Burnable = {
  burning: boolean;
  eternal: boolean;
  simmer: boolean;
  combusted: boolean;
  decayed: boolean;
};
```
