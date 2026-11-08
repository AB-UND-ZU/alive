# Harvestable

Stores resource type and remaining work.

[Harvest](../systems/harvest.md) reads the resource key and applies tool work. [Harvesting data](../../game/balancing/harvesting.md) supplies the matching tool, durability and yields.

| Field      | Meaning                        |
| ---------- | ------------------------------ |
| `resource` | Key into the harvesting rules. |
| `amount`   | Remaining harvesting work.     |
| `maximum`  | Initial harvesting work limit. |
<!-- source-types -->

## Resource

```ts src/engine/components/harvestable.ts
export type Resource =
  | "rotten"
  | "hedge"
  | "plant"
  | "tree"
  | "oak"
  | "palm"
  | "cactus"
  | "box"
  | "sign"
  | "fence"
  | "grass"
  | "bush"
  | "flower"
  | "berry"
  | "spore"
  | "leaf"
  | "sapling"
  | "thorn"
  | "banana"
  | "coconut"
  | "plot"
  | "post"
  | "stump"
  | "husk"
  | "desert_husk"
  | "hinge"
  | "root"
  | "sand"
  | "beach"
  | "path"
  | "rubble"
  | "palisade"
  | "barrier"
  | "footing"
  | "rock"
  | "mountain"
  | "iron"
  | "gold";
```

## Harvestable

```ts src/engine/components/harvestable.ts
export type Harvestable = {
  resource: Resource;
  amount: number;
  maximum: number;
};
```

## HarvestStats

```ts src/engine/components/harvestable.ts
export type HarvestStats = {
  logging: number;
  mining: number;
  fishing: number;
  farming: number;
  build: number;
};
```
