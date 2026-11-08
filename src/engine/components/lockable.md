# Lockable

Describes a lock and the key material needed to open it.

[Interact](../systems/interact.md) unlocks a matching lock and consumes the key. [Action](../systems/action.md) exposes the available interaction.
<!-- source-types -->

## Lockable

```ts src/engine/components/lockable.ts
export type Lockable = {
  locked: boolean;
  material?: Material;
  element?: Element;
  sprite?: Sprite;
  type: Materialized;
};
```
