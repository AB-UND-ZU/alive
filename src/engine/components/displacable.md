# Displacable

Allows movement caused by pushing or sliding.

[Push](../systems/push.md) moves displaced objects. [Magic](../systems/magic.md) uses it for knockback; [Freeze](../systems/freeze.md) keeps sliding momentum active. A pending `pushSound` is consumed by movement and played only if the object actually moves.
<!-- source-types -->

## Displacable

```ts src/engine/components/displacable.ts
export type Displacable = {};
```
