# Item Sources

`obtainedFrom` indexes full item identities, including material, element and potion stat. Native balancing supplies unit drops, harvest yields, recipe alternatives, forging inputs, shop prices and fishing distributions. The dungeon fixture supplies actual unbound level items. Engine collection, recharge drops and water refill supply their corresponding conversions. NPC quest rewards come from the build's source extraction.

Sources retain all producing entities, native quantities, each fishing level/chance, and distinct Buy/Sell prices. The cached Island contributes observed world items and actor drops, including native vanish-cell loot; its native NPC distribution also establishes biome sources for possible enemy drops even if a rare actor did not occur in that seed.

The Island sample initializes one actual occurrence of each cell/object and biome combination. It is evidence for those occurrences, not proof of every random world outcome. Its seed and source hash are shared with the minimap cache; opening a catalog never generates another Island. Recipe entries describe supported transformations without claiming that every ingredient is normally obtainable. No Test Mode fallback is invented.
<!-- source-types -->

## Acquisition

```ts src/documentation/itemSources.ts
export type Acquisition = {
  kind:
    | "refill"
    | "combat"
    | "collect"
    | "drop"
    | "quest"
    | "harvest"
    | "natural"
    | "naturalUnit"
    | "crafting"
    | "brewing"
    | "forging"
    | "shops"
    | "fishing"
    | "world"
    | "shopNpc";
  key?: string;
  chance?: number;
  parts?: Partial<Item>[];
  level?: LevelName;
  biome?: BiomeName;
  fishingLevel?: number;
  buy?: Partial<Item>[];
  sell?: Partial<Item>[];
};
```
