import { fishingDistributionLevels } from "../game/balancing/fishing";
import { craftingIngredients } from "../game/balancing/crafting";
import { brewingRecipes } from "../game/balancing/brewing";
import { purchasableItems } from "../game/balancing/trading";
import { buildConstructions } from "../game/balancing/building";
import { getForgeOptions } from "../game/balancing/forging";
import { getItemStats, getEquipmentStats } from "../game/balancing/equipment";
import { createWorld } from "../engine";
import { TypedEntity } from "../engine/entities";
import { Equipment } from "../engine/components/equippable";
import { npcTypes } from "../engine/components/npc";
import {
  getEntityDisplayStats,
  getEntityEquipmentStats,
} from "../engine/systems/damage";
import { unitDefinitions, generateUnitData } from "../game/balancing/units";
import { bolt, blast } from "../game/assets/templates/particles";
import { commandItems } from "../game/assets/commands";
import { getItemSprite } from "../game/assets/utils";
import { missing } from "../game/assets/sprites";
import { Item, materials, elements } from "../engine/components/item";
import { UnitDefinition, UnitKey } from "../game/balancing/units";
import { stackableConsumptions } from "../engine/systems/consume";
export const itemCategory = (item: Partial<Item>) =>
  item.spell
    ? "spells"
    : item.weapon || item.offhand || item.accessory
    ? "gear"
    : item.skill
    ? "skills"
    : item.tool
    ? "tools"
    : item.consume ||
      item.stat ||
      (item.stackable && item.stackable in stackableConsumptions)
    ? "consumables"
    : "resources";
export const isWikiUnit = (key: string) => key !== "chestBoss";
export const unitCategory = (key: string, unit: UnitDefinition) =>
  ["rose", "violet", "clover"].includes(key)
    ? "enemies"
    : /Totem$/.test(key)
    ? "skills"
    : /boss/i.test(key) ||
      unit.patternNames.some((name) => /boss|^ilex$/.test(name))
    ? "bosses"
    : unit.faction === "animal"
    ? "animals"
    : ["hostile", "wild"].includes(unit.faction)
    ? "enemies"
    : ["settler", "nomad", "fire", "water", "earth"].includes(unit.faction)
    ? "npcs"
    : "units";

export const isPlantUnit = (key: string, unit: UnitDefinition) =>
  ["cactus1", "cactus2", "hedge1", "hedge2", "tumbleweed"].includes(key) &&
  (Boolean(unit.harvestable) || key === "tumbleweed");

export const fishItems = Array.from(
  new Map(
    fishingDistributionLevels.flatMap((level) =>
      level.map(([, item]) => [item.stackable!, item] as const)
    )
  ).values()
);
export const isAnimalItem = (item: Partial<Item>) =>
  item.stackable === "worm" ||
  fishItems.some((fish) => fish.stackable === item.stackable);
export const itemPage = (item: Partial<Item>) =>
  isAnimalItem(item)
    ? "animals"
    : item.stackable === "resource" && item.element
    ? "elements"
    : itemCategory(item);

export const unitPage = (key: string, unit: UnitDefinition) =>
  key === "rotten"
    ? "plants"
    : isContainer(key)
    ? "containers"
    : isPlantUnit(key, unit)
    ? "plants"
    : /oakHedge|Tulip|Lily/.test(key)
    ? "enemies"
    : unitCategory(key, unit);

export const displayName = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) =>
      ["hp", "mp", "xp", "npc", "ui"].includes(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

export const previewItem = (item: Partial<Item>) => ({
  ...item,
  ...(!item.material &&
  (item.weapon ||
    item.offhand ||
    item.spell ||
    item.skill ||
    item.tool ||
    item.accessory ||
    item.consume)
    ? {
        material:
          commandItems[
            item.weapon ||
              item.offhand ||
              item.spell ||
              item.skill ||
              item.tool ||
              item.accessory ||
              item.consume ||
              ""
          ]?.material,
      }
    : {}),

  ...(item.consume === "potion" && !item.stat ? { stat: "hp" as const } : {}),
});

export const unitName = (key: string, unit: UnitDefinition) =>
  unit.sprite.name && !/^\?+$/.test(unit.sprite.name)
    ? unit.sprite.name
    : displayName(key);

export const getEffectSprite = (item: Partial<Item>) => {
  const template =
    item.spell === "bolt" ? bolt : item.spell === "blast" ? blast : undefined;
  return template?.[item.material || "wood"][item.element || "default"];
};

const itemKind = (item: Partial<Item>) =>
  item.weapon ||
  item.offhand ||
  item.spell ||
  item.skill ||
  item.tool ||
  item.accessory ||
  item.consume ||
  item.stat ||
  item.stackable;
export const referencedItems: Partial<Item>[] = [
  ...purchasableItems,
  ...craftingIngredients.flatMap((recipe) => [recipe.item, ...recipe.parts]),
  ...brewingRecipes.flatMap((recipe) => [
    recipe.item,
    ...recipe.options.flat(),
  ]),
  ...buildConstructions.flatMap((plan) => plan.parts),
  ...Object.entries(unitDefinitions)
    .filter(([key]) => isWikiUnit(key))
    .flatMap(([, unit]) => [
      ...unit.equipments,
      ...unit.drops.flatMap((drop) => drop.items),
    ]),
];
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
const itemIdentity = (item: Partial<Item>) =>
  Object.fromEntries(
    identityKeys
      .filter((key) => item[key] !== undefined)
      .map((key) => [key, item[key]])
  ) as Partial<Item>;
export const itemVariants = (definition: Partial<Item>): Partial<Item>[] => {
  if (
    definition.stat &&
    !definition.consume &&
    !referencedItems.some(
      (item) => !item.consume && item.stat === definition.stat
    )
  )
    return [];
  if (!definition.material || definition.stackable === "resource")
    return [previewItem(definition)];
  const queue = referencedItems
    .filter(
      (item) => item.amount !== 0 && itemKind(item) === itemKind(definition)
    )
    .map((item) => itemIdentity({ ...definition, ...item }));
  if (
    getForgeOptions({ ...definition, amount: 1, carrier: 0, bound: false })
      .length
  )
    queue.push(itemIdentity(definition));
  const seen = new Set<string>();
  const variants: Partial<Item>[] = [];
  while (queue.length) {
    const item = queue.shift()!;
    const id = JSON.stringify(identityKeys.map((key) => item[key]));
    if (seen.has(id)) continue;
    seen.add(id);
    const sprite = getItemSprite(item, "display");
    if (sprite.name === missing.name) continue;
    const stats = getItemStats(item);
    const numericStats = Object.values(stats).some(
      (value) => typeof value === "number" && value !== 0
    );
    if (
      numericStats ||
      definition.consume ||
      definition.accessory === "map" ||
      definition.accessory === "compass"
    )
      variants.push(item);
    queue.push(
      ...getForgeOptions({ ...item, amount: 1, carrier: 0, bound: false }).map(
        (option) => itemIdentity(option.result)
      )
    );
  }
  return variants.length
    ? variants.sort(
        (a, b) =>
          (materials.indexOf(a.material!) - materials.indexOf(b.material!)) *
            100 +
          (elements.indexOf(a.element!) - elements.indexOf(b.element!)) * 10 +
          String(a.stat || "").localeCompare(String(b.stat || ""))
      )
    : Object.values(getItemStats(previewItem(definition))).some(
        (value) => typeof value === "number" && value !== 0
      ) ||
      definition.consume ||
      definition.accessory === "map" ||
      definition.accessory === "compass"
    ? [previewItem(definition)]
    : [];
};

export const catalogItems = Object.fromEntries(
  Object.entries(commandItems).filter(
    ([, item]) =>
      getItemSprite(previewItem(item), "display").name !== missing.name &&
      itemVariants(item).length > 0
  )
);

export const isContainer = (key: string) => /chest|^pot$|^box$/i.test(key);

export function unitComparisonStats(key: UnitKey) {
  const unit = unitDefinitions[key];
  const world = createWorld();
  const caster = npcTypes.find((type) => type === key);
  const entity: TypedEntity<"STATS" | "EQUIPPABLE"> = {
    STATS: generateUnitData(key).stats,
    ...(caster ? { NPC: { type: caster } } : {}),
    EQUIPPABLE: {},
  };
  unit.equipments.forEach((item) => {
    const slot: Equipment | undefined = item.weapon
      ? "weapon"
      : item.offhand
      ? "offhand"
      : item.spell
      ? "spell"
      : item.skill
      ? "skill"
      : item.tool
      ? "tool"
      : item.accessory;
    if (!slot) return;
    const equipped = world.createEntity();
    world.addComponentToEntity(equipped, "ITEM", { ...item, carrier: 0 });
    entity.EQUIPPABLE[slot] = world.getEntityId(equipped);
    if (item.weapon && item.skill)
      entity.EQUIPPABLE.skill = world.getEntityId(equipped);
  });
  const stats = getEntityDisplayStats(world, entity);
  const attacks = unit.equipments.flatMap((item) => [
    ...(item.weapon ? [getEquipmentStats(item, caster)] : []),
    ...(item.spell || (item.skill && item.weapon !== "spear")
      ? [getItemStats(item, caster)]
      : []),
  ]);
  return { stats, attacks, bonuses: getEntityEquipmentStats(world, entity) };
}
export const unitFamily = (key: string) => {
  if (/chest/i.test(key)) return "chest";
  const name = unitDefinitions[key as UnitKey]?.sprite.name;
  if (name && /^[A-Z][A-Za-z ]+$/.test(name) && !/^\?+$/.test(name))
    return name.toLowerCase();
  const bare = key.replace(
    new RegExp(`^(${materials.join("|")}|earth|fire|water)(?=[A-Z])`),
    ""
  );
  if (/^(oak)?hedge[12]$/i.test(bare)) return "hedge";
  return bare.replace(/\d+$/, "").replace(/^./, (char) => char.toLowerCase());
};

export const unitGroups = (keys: UnitKey[]) => {
  const groups = new Map<string, UnitKey[]>();
  for (const key of keys) {
    if (!isWikiUnit(key)) continue;
    const family = unitFamily(key);
    groups.set(family, [...(groups.get(family) || []), key]);
  }
  return [...groups.values()];
};

const resourceFamilies = [
  { name: "currency", title: "Currency", keys: ["coin", "nugget", "ingot"] },
  {
    name: "materials",
    title: "Materials",
    keys: ["wood", "iron", "gold", "diamond", "ruby"],
  },
  {
    name: "gathered",
    title: "Gathered",
    keys: ["stick", "plank", "ore", "crystal", "mineral"],
  },
  {
    name: "seeds",
    title: "Seeds",
    keys: ["berry", "flower", "leaf", "grain", "wheat", "spore"],
  },
  { name: "earthworks", title: "Earthworks", keys: ["sand", "gravel"] },
  {
    name: "quest-items",
    title: "Quest items",
    keys: ["golem", "letter", "schema"],
  },
  {
    name: "projectiles",
    title: "Projectiles",
    keys: ["arrow", "bomb", "charge"],
  },
];
const gearFamilies = [
  { name: "utility", title: "Utility", keys: ["compass", "map"] },
];
const foodFamilies = [
  {
    name: "fishing",
    title: "Fishing",
    keys: fishItems.map((item) => item.stackable!),
  },
  {
    name: "food",
    title: "Food",
    keys: ["bread", "egg", "apple", "shroom", "banana", "coconut"],
  },
  {
    name: "forage",
    title: "Forage",
    keys: ["fruit", "herb", "sapling", "thorn", "algae"],
  },
  {
    name: "meals",
    title: "Meals",
    keys: ["granola", "juice", "toast", "tea", "curry", "soup"],
  },
  { name: "pickups", title: "Pickups", keys: ["hp", "mp", "xp"] },
];
export function itemCatalogFamilies(category?: string) {
  const available = Object.entries(catalogItems).filter(
    ([, item]) => !category || itemPage(item) === category
  );
  const configured =
    category === "resources"
      ? resourceFamilies
      : category === "consumables"
      ? foodFamilies
      : category === "gear"
      ? gearFamilies
      : [];
  const grouped = configured
    .map((group) => ({
      ...group,
      entries: group.keys.flatMap((name) =>
        available.some(([key]) => key === name)
          ? [{ name, definition: catalogItems[name] }]
          : []
      ),
    }))
    .filter((group) => group.entries.length);
  const assigned = new Set(
    grouped.flatMap((group) => group.entries.map((entry) => entry.name))
  );
  return [
    ...grouped,
    ...available
      .filter(([key]) => !assigned.has(key))
      .map(([name, definition]) => ({
        name,
        title: getItemSprite(previewItem(definition), "display").name,
        keys: [name],
        entries: [{ name, definition }],
      })),
  ];
}
export const itemOverviewGroup = (key: string) =>
  [...resourceFamilies, ...foodFamilies, ...gearFamilies].find((group) =>
    group.keys.includes(key)
  )?.title;
export const unitOverviewGroup = (key: UnitKey) => {
  const unit = unitDefinitions[key];
  return ["ilexTulip", "oakLily", "oakTower"].includes(key)
    ? "Adds"
    : ["rose", "violet", "clover"].includes(key)
    ? "Plants"
    : unit.patternNames.some((pattern) => pattern.includes("tower")) ||
      /Tower$/.test(key)
    ? "Towers"
    : unit.equipments.some((item) => item.spell)
    ? "Casters"
    : unitFamily(key) === "golem"
    ? "Elites"
    : "Units";
};
