# Affectable

Tracks damage over time, burn and freeze effects, and per-cast proc application.

[Magic](../systems/magic.md) applies cast effects; [Burn](../systems/burn.md) and [Freeze](../systems/freeze.md) advance their sequences.
<!-- source-types -->

## Affectable

```ts src/engine/components/affectable.ts
export type Affectable = {
  dot: number;
  burn: number;
  freeze: number;
  procs: Record<string, number>;
};
```
