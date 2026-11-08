# Brewable

Stores a kettle’s recipe queue.

[Harvest](../systems/harvest.md) advances the queue and places completed items in the kettle inventory.
<!-- source-types -->

## Brewable

```ts src/engine/components/brewable.ts
export type Brewable = {
  queue: {
    item: Omit<Item, "carrier" | "bound">;
    generation?: number;
    duration: number;
  }[];
};
```
