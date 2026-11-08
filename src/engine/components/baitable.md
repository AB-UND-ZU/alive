# Baitable

Links fishing bait to its caster and caught target.

[Fishing](../systems/fishing.md) pairs the bait with a [Hookable](hookable.md) entity; [Trigger](../systems/trigger.md) starts reeling it in.

| Field    | Meaning                                       |
| -------- | --------------------------------------------- |
| `caster` | Entity ID of the unit that cast the hook.     |
| `caught` | Entity ID of the hooked target, when present. |
<!-- source-types -->

## Baitable

```ts src/engine/components/baitable.ts
export type Baitable = {
  caught?: number;
  caster: number;
  amount: number;
};
```
