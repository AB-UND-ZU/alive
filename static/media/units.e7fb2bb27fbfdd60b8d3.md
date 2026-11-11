# Unit Data

Defines unit stats, appearance, equipment, behavior names and weighted drops. Creation resolves a definition into state for one entity.

| Function         | Contract                                                             |
| ---------------- | -------------------------------------------------------------------- |
| generateNpcKey   | Pick an NPC key using the supplied distribution weights              |
| generateUnitData | Sample one drop option, copy stats and create fresh pattern memories |
| generateNpcData  | Generate the same unit data with its NPC type key                    |

| Registry              | Contents                           |
| --------------------- | ---------------------------------- |
| unitDefinitions       | Base definitions for all unit keys |
| unitBackdrops         | Additional world sprite layers     |
| unitSwimmingBackdrops | Backdrop variants while swimming   |

`generateUnitData` fills missing unit stats, sets maximum HP/MP from the initial stats and resolves harvesting work. Its drop selection uses randomness; callers needing repeatable output must seed randomness through the [test harness](../../testing/harness.md).

[World creation](../../bindings/creation.md) attaches the data and creates carried items. Use [unit sprite helpers](../assets/utils.md) for a portrait with equipment rather than reading the bare body sprite.
<!-- source-types -->

## UnitKey

```ts src/game/balancing/units.ts
export type UnitKey =
  | NpcType
  | "woodTotem"
  | "ironTotem"
  | "goldTotem"
  | "diamondTotem"
  | "rubyTotem"
  | "oakHedge1"
  | "oakHedge2"
  | "pot"
  | "box"
  | "dummy"
  | "sign"
  | "fence"
  | "fenceDoor"
  | "palisade"
  | "palisadeDoor"
  | "barrier"
  | "barrierDoor"
  | "cactus1"
  | "cactus2"
  | "rock1"
  | "rock2"
  | "tumbleweed"
  | "hedge1"
  | "hedge2"
  | "rotten";
```

## NpcDistribution

```ts src/game/balancing/units.ts
export type NpcDistribution = Partial<Record<NpcType, number>>;
```

## UnitDefinition

```ts src/game/balancing/units.ts
export type UnitDefinition = {
  faction: Faction;
  dormant?: boolean;
  flying?: boolean;
  scratch: string;
  evaporate?: Droppable["evaporate"];
  harvestable?: Resource;
  stats: Partial<Stats>;
  equipments: Omit<Item, "carrier">[];
  drops: {
    chance: number;
    items: Omit<Item, "carrier" | "bound">[];
  }[];
  patternNames: Pattern["name"][];
  sprite: Sprite;
  backdrop?: Sprite;
  swimming?: Sprite;
  swimmingBackdrop?: Sprite;
  remains?: CellType;
  vanish?: Omit<Vanishable, "decayed">;
  spring?: SpringConfig;
};
```

## UnitData

```ts src/game/balancing/units.ts
export type UnitData = {
  faction: Faction;
  dormant?: boolean;
  flying: boolean;
  scratch: string;
  evaporate?: Droppable["evaporate"];
  harvestable: Harvestable;
  stats: UnitStats;
  equipments: Omit<Item, "carrier">[];
  items: Omit<Item, "carrier">[];
  patterns: Pattern[];
  sprite: Sprite;
  backdrop?: Sprite;
  swimming?: Sprite;
  swimmingBackdrop?: Sprite;
  remains?: CellType;
  vanish?: Omit<Vanishable, "decayed">;
  spring?: SpringConfig;
};
```

## NpcData

```ts src/game/balancing/units.ts
export type NpcData = UnitData & {
  type: NpcType;
};
```
