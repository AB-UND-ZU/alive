import { dropEntity } from "../engine/systems/drop";
import { refillWater } from "../engine/systems/harvest";
import { addToInventory } from "../engine/systems/collect";
import { createTestWorld } from "../testing/harness";
import { Item } from "../engine/components/item";
import { unitDefinitions } from "../game/balancing/units";
import { craftingIngredients } from "../game/balancing/crafting";
import { brewingRecipes } from "../game/balancing/brewing";
import {
  purchasableItems,
  getItemBuyPrice,
  getItemSellPrice,
} from "../game/balancing/trading";
import { fishingDistributionLevels } from "../game/balancing/fishing";
import { islandNpcDistribution } from "../game/levels/island/units";
import { LevelName, BiomeName } from "../engine/components/level";
import minimap from "./minimap.json";
import { getForgeOptions } from "../game/balancing/forging";
import { harvestTools, getHarvestConfig } from "../game/balancing/harvesting";
import { Resource } from "../engine/components/harvestable";
import {
  catalogItems,
  itemVariants,
  isWikiUnit,
  unitRewardChests,
  previewItem,
} from "./catalog";
import { worldPlantGroups } from "./WorldPlants";
import questSources from "./item-sources.json";

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
const identityKeys = [
  "weapon",
  "offhand",
  "spell",
  "skill",
  "tool",
  "accessory",
  "consume",
  "stackable",
  "stat",
  "material",
  "element",
] as const;
export const itemSourceIdentity = (item: Partial<Item>) => {
  const normalized = previewItem(item);
  return JSON.stringify(identityKeys.map((key) => normalized[key] || ""));
};
let sources: Map<string, Acquisition[]> | undefined;
function buildSources() {
  const result = new Map<string, Acquisition[]>();
  const add = (item: Partial<Item>, source: Acquisition) => {
    const key = itemSourceIdentity(item);
    const entries = result.get(key) || [];
    if (
      !entries.some((entry) => JSON.stringify(entry) === JSON.stringify(source))
    )
      entries.push(source);
    result.set(key, entries);
  };
  const rewardOwners = new Map(
    (Object.keys(unitDefinitions) as (keyof typeof unitDefinitions)[]).flatMap(
      (boss) => unitRewardChests(boss).map((chest) => [chest, boss] as const)
    )
  );
  for (const [key, unit] of Object.entries(unitDefinitions))
    if (isWikiUnit(key))
      for (const drop of unit.drops)
        for (const item of drop.items)
          if (item.amount && drop.chance)
            add(item, {
              kind: "drop",
              key: rewardOwners.get(key as keyof typeof unitDefinitions) || key,
              chance: unit.drops
                .filter((bundle) =>
                  bundle.items.some(
                    (candidate) =>
                      itemSourceIdentity(candidate) === itemSourceIdentity(item)
                  )
                )
                .reduce((sum, bundle) => sum + bundle.chance, 0),
            });
  for (const recipe of craftingIngredients) {
    add(recipe.item, { kind: "crafting", parts: recipe.parts });
  }
  for (const recipe of brewingRecipes) {
    for (const parts of recipe.options) {
      add(recipe.item, { kind: "brewing", parts });
    }
  }
  for (const definition of Object.values(catalogItems))
    for (const item of itemVariants(definition)) {
      const buy = purchasableItems.some(
        (candidate) =>
          itemSourceIdentity(candidate) === itemSourceIdentity(item)
      )
        ? getItemBuyPrice(item).filter((price) => price.amount > 0)
        : [];
      const sell = getItemSellPrice(item).filter((price) => price.amount > 0);
      if (buy.length || sell.length) add(item, { kind: "shops", buy, sell });
    }
  fishingDistributionLevels.forEach((distribution, fishingLevel) =>
    distribution.forEach(([chance, item]) =>
      add(item, { kind: "fishing", fishingLevel, chance })
    )
  );
  for (const source of minimap.sample.worldItems)
    add(source.item as Partial<Item>, {
      kind: "world",
      level: "LEVEL_ISLAND",
      biome: source.biome as BiomeName,
    });
  for (const [biome, distribution] of Object.entries(islandNpcDistribution))
    for (const [key, chance] of Object.entries(distribution)) {
      if (!chance) continue;
      const unit = unitDefinitions[key as keyof typeof unitDefinitions];
      for (const bundle of unit.drops)
        if (bundle.chance)
          for (const item of bundle.items)
            if (item.amount)
              add(item, {
                kind: "world",
                level: "LEVEL_ISLAND",
                biome: biome as BiomeName,
              });
    }
  for (const resource of Object.keys(harvestTools) as Resource[])
    for (const item of getHarvestConfig(resource).yields)
      add(item, { kind: "harvest", key: resource });
  for (const family of worldPlantGroups())
    for (const [index, plant] of family.plants.entries())
      for (const item of plant.crops)
        add(item, {
          kind: "natural",
          key: family.cells[index],
        });
  for (const source of questSources.natural)
    if (source.unit in unitDefinitions)
      add(source.item as Partial<Item>, {
        kind: "naturalUnit",
        key: source.unit,
      });
  const dungeon = createTestWorld({ level: "LEVEL_TUTORIAL" });
  for (const entity of dungeon.getEntities(["ITEM"])) {
    const item = entity.ITEM;
    const carrier = dungeon.getEntityById(item.carrier);
    if (!item.bound && item.amount && !carrier?.PLAYER)
      add(item, { kind: "world", level: "LEVEL_TUTORIAL" });
  }
  const hero = dungeon.getEntities([
    "PLAYER",
    "MELEE",
    "EQUIPPABLE",
    "INVENTORY",
  ])[0];
  const stick = dungeon
    .getEntities(["ITEM"])
    .find((entity) => entity.ITEM.stackable === "stick");
  if (hero && stick) {
    hero.EQUIPPABLE.weapon = undefined;
    const inventory = new Set(hero.INVENTORY.items);
    addToInventory(dungeon, hero, stick, 1);
    for (const id of hero.INVENTORY.items)
      if (!inventory.has(id)) {
        const item = dungeon.getEntityByIdAndComponents(id, ["ITEM"])?.ITEM;
        if (item && !item.stackable)
          add(item, { kind: "collect", key: "stick" });
      }
  }
  const bucket = craftingIngredients.find(
    (recipe) => recipe.item.consume === "bucket"
  )?.item;
  if (hero && bucket) {
    addToInventory(dungeon, hero, { ITEM: bucket }, 1);
    const inventory = new Set(hero.INVENTORY.items);
    refillWater(dungeon, hero, "water");
    for (const id of hero.INVENTORY.items)
      if (!inventory.has(id)) {
        const item = dungeon.getEntityByIdAndComponents(id, ["ITEM"])?.ITEM;
        if (item) {
          add(item, { kind: "refill" });
        }
      }
  }
  if (hero?.POSITION)
    for (const container of dropEntity(
      dungeon,
      { RECHARGABLE: { hit: true } },
      hero.POSITION,
      true
    ))
      for (const id of container.INVENTORY.items) {
        const item = dungeon.getEntityByIdAndComponents(id, ["ITEM"])?.ITEM;
        if (item) add(item, { kind: "combat" });
      }
  for (const entity of dungeon.getEntities(["POPUP", "NPC"]))
    for (const deal of entity.POPUP.deals)
      if (deal.stock && entity.POPUP.tabs.includes("buy"))
        add(deal.item, {
          kind: "shopNpc",
          key: entity.NPC.type,
          buy: deal.prices,
        });
  for (const source of questSources.items)
    if (source.npc in unitDefinitions)
      add(source.item as Partial<Item>, { kind: "quest", key: source.npc });
  for (const definition of Object.values(catalogItems))
    for (const base of itemVariants(definition))
      for (const option of getForgeOptions({
        ...base,
        amount: 1,
        carrier: 0,
        bound: false,
      })) {
        add(option.result, {
          kind: "forging",
          parts: [option.base, option.add],
        });
      }
  return result;
}
export function obtainedFrom(item: Partial<Item>): Acquisition[] {
  sources ||= buildSources();
  const key = itemSourceIdentity(item);
  const entries = sources.get(key) || [];
  return entries;
}
