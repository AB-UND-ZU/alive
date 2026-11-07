import { fishingDistributionLevels } from "../game/balancing/fishing";
import { craftingIngredients } from "../game/balancing/crafting";
import { brewingRecipes } from "../game/balancing/brewing";
import { purchasableItems } from "../game/balancing/trading";
import { buildConstructions } from "../game/balancing/building";
import { getForgeOptions } from "../game/balancing/forging";
import { getItemStats } from "../game/balancing/equipment";
import { unitDefinitions } from "../game/balancing/units";
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
export const unitCategory = (key: string, unit: UnitDefinition) =>
  /boss/i.test(key) ||
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
  unit.harvestable === "plant" ||
  /hedge|cactus|tumbleweed|clover|rose|violet|tulip|lily/i.test(key);

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
  isContainer(key)
    ? "containers"
    : isPlantUnit(key, unit)
    ? "plants"
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
  !item.element &&
  (item.weapon || item.offhand || item.skill || item.tool || item.accessory)
    ? {
        material:
          commandItems[
            item.weapon ||
              item.offhand ||
              item.skill ||
              item.tool ||
              item.accessory ||
              ""
          ]?.material,
      }
    : {}),
  ...(item.spell && !item.element ? { element: "fire" as const } : {}),
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
const referencedItems: Partial<Item>[] = [
  ...purchasableItems,
  ...craftingIngredients.flatMap((recipe) => [recipe.item, ...recipe.parts]),
  ...brewingRecipes.flatMap((recipe) => [
    recipe.item,
    ...recipe.options.flat(),
  ]),
  ...buildConstructions.flatMap((plan) => plan.parts),
  ...Object.values(unitDefinitions).flatMap((unit) => [
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
    const family = unitFamily(key);
    groups.set(family, [...(groups.get(family) || []), key]);
  }
  return [...groups.values()];
};
