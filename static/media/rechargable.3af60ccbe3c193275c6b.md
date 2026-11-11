# Rechargable

Records whether a hit can produce a charge drop.

[Damage](../systems/damage.md) marks eligible hits. [Drop](../systems/drop.md) turns the recorded hit into a charge drop; this is not a timed regeneration clock.
<!-- source-types -->

## Rechargable

```ts src/engine/components/rechargable.ts
export type Rechargable = {
  hit: boolean;
};
```
