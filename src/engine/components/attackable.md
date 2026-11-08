# Attackable

Marks a target as attackable and configures its scratch effect.

[Damage](../systems/damage.md) uses this marker when choosing melee targets. `scratchColor` colors the hit effect.
<!-- source-types -->

## Attackable

```ts src/engine/components/attackable.ts
export type Attackable = {
  scratchColor?: string;
};
```
