# Inventory

Stores carried item entity IDs.

The array contains item entity IDs. [Collect](../systems/collect.md) transfers items into it; [Drop](../systems/drop.md) releases them. Each carried [Item](item.md) also records its carrier.
<!-- source-types -->

## Inventory

```ts src/engine/components/inventory.ts
export type Inventory = {
  items: number[];
};
```
