# Fragment

Links a structure fragment to its root entity.

[Enter](../systems/enter.md) resolves the root structure. [Damage](../systems/damage.md) uses that relationship when a hit lands on a limb.
<!-- source-types -->

## Fragment

```ts src/engine/components/fragment.ts
export type Fragment = {
  structure: number;
};
```
