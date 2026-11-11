# Melee

Stores the attacker's melee facing and hit count.

[Damage](../systems/damage.md) reads this state on the attacker. The equipped weapon is referenced by [Equippable](equippable.md), not stored here.
<!-- source-types -->

## Melee

```ts src/engine/components/melee.ts
export type Melee = {
  facing?: Orientation;
  hits: 0;
};
```
