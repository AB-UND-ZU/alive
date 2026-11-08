# Shootable

Records arrows stuck in a target so they can be recovered with its loot.

[Ballistics](../systems/ballistics.md) increments `shots` when an arrow sticks. [Drop](../systems/drop.md) returns those arrows with the target's loot.
<!-- source-types -->

## Shootable

```ts src/engine/components/shootable.ts
export type Shootable = {
  shots: number;
};
```
