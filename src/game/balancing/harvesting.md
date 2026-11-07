# harvesting.ts
<!-- source-types -->

## HarvestConfig

```ts src/game/balancing/harvesting.ts
export type HarvestConfig = {
  harvestable: Harvestable;
  yields: Omit<Item, "carrier" | "bound">[];
};
```
