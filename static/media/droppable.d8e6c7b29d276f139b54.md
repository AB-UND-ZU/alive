# Droppable

Tracks decay and loot release.

[Drop](../systems/drop.md) releases inventory, waits for decay and removes spent entities. Use the normal drop/disposal path so inventory and map entries stay consistent.
<!-- source-types -->

## Droppable

```ts src/engine/components/droppable.ts
export type Droppable = {
  decayed: boolean;
  evaporate?: { sprite: Sprite; fast: boolean };
};
```
