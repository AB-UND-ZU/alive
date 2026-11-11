# Harvest Rules

Maps resource kinds to their required tools, work limits, drops and planting behavior. [Harvest](../../engine/systems/harvest.md) consumes these rules.

| Data                  | Contract                                          |
| --------------------- | ------------------------------------------------- |
| harvestScratches      | Hit/scratch appearance for each resource          |
| harvestConditions     | Active condition used by each tool                |
| harvestTools          | Tool required by each resource kind               |
| getHarvestConfig      | Fresh Harvestable state and the configured yields |
| plantConfigs          | Supported planted items and growth data           |
| harvestDurationFactor | Shared work-duration factor                       |
| trenchResources       | Grounds treated as trenches                       |
| pavingResources       | Grounds treated as paving                         |
| fillItem              | Item definition used when filling land            |
| soilWaterDistance     | Distance used when checking nearby water          |

With no resource key, `getHarvestConfig` returns zero work and no yields. Configured resources begin with `amount === maximum`. Tool stats determine how much work an action can apply; [Farmable](../../engine/components/farmable.md) records later crop stages.
<!-- source-types -->

## HarvestConfig

```ts src/game/balancing/harvesting.ts
export type HarvestConfig = {
  harvestable: Harvestable;
  yields: Omit<Item, "carrier" | "bound">[];
};
```
