# HARVESTABLE

Stores resource type and remaining work.

`Harvestable`

| Field | Type |
| --- | --- |
| `resource` | `Resource` |
| `amount` | `number` |
| `maximum` | `number` |

`HarvestStats`

| Field | Type |
| --- | --- |
| `logging` | `number` |
| `mining` | `number` |
| `fishing` | `number` |
| `farming` | `number` |
| `build` | `number` |

Attach with `world.addComponentToEntity(entity, HARVESTABLE, data)`. Query with `world.getEntities([HARVESTABLE])`.

Systems: `ai`, `build`, `drop`, `harvest`, `homing`, `trigger`, `water`.
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
