import { Entity } from "ecs";
import { World } from "../../engine";
import { Accessory } from "../../engine/components/equippable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import {
  Element,
  elements,
  ITEM,
  Item,
  Material,
  materials,
  Spell,
  Skill,
  Weapon,
  Offhand,
  Tool,
} from "../../engine/components/item";
import { matchesItem } from "../../engine/systems/popup";
import { choice, normalize, random, repeat } from "../math/std";
import {
  Forgable,
  FORGABLE,
  ForgeStep,
} from "../../engine/components/forgable";
import { getSequence } from "../../engine/systems/sequence";
import {
  calculateDamage,
  createAmountMarker,
} from "../../engine/systems/damage";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { play } from "../sound";
import { rerenderEntity } from "../../engine/systems/renderer";

const forgableMaterials = materials.slice(0, -1);
const harvestMaterials: Material[] = ["wood", "iron"];
const accessoryMaterials: Material[] = ["wood", "iron"];
const forgableElements = [...elements];
const forgableConfigs: {
  item: Omit<Item, "carrier" | "bound" | "amount">;
  materials: Material[];
  materialCost: number;
  elements: Element[];
}[] = [
  {
    item: { weapon: "sword" },
    materials: forgableMaterials,
    materialCost: 5,
    elements: forgableElements,
  },
  {
    item: { weapon: "spear", skill: "spear" },
    materials: forgableMaterials,
    materialCost: 6,
    elements: forgableElements,
  },
  {
    item: { weapon: "wand", skill: "wand" },
    materials: forgableMaterials,
    materialCost: 6,
    elements: forgableElements,
  },
  {
    item: { offhand: "shield" },
    materials: forgableMaterials,
    materialCost: 6,
    elements: forgableElements,
  },
  {
    item: { spell: "wave" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: forgableElements,
  },
  {
    item: { spell: "beam" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: forgableElements,
  },
  {
    item: { spell: "trap" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: forgableElements,
  },
  {
    item: { spell: "dash" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: forgableElements,
  },
  {
    item: { accessory: "ring" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: forgableElements,
  },
  {
    item: { accessory: "amulet" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: forgableElements,
  },
  {
    item: { accessory: "torch" },
    materials: accessoryMaterials,
    materialCost: 4,
    elements: [],
  },
  {
    item: { accessory: "boots" },
    materials: accessoryMaterials,
    materialCost: 6,
    elements: [],
  },
  {
    item: { skill: "bow" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: [],
  },
  {
    item: { skill: "slash" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: [],
  },
  {
    item: { skill: "block" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: [],
  },
  {
    item: { skill: "zap" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: [],
  },
  {
    item: { skill: "totem" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: [],
  },
  {
    item: { tool: "axe" },
    materials: harvestMaterials,
    materialCost: 4,
    elements: [],
  },
  {
    item: { tool: "shovel" },
    materials: harvestMaterials,
    materialCost: 4,
    elements: [],
  },
  {
    item: { tool: "pickaxe" },
    materials: harvestMaterials,
    materialCost: 4,
    elements: [],
  },
  {
    item: { tool: "hook" },
    materials: harvestMaterials,
    materialCost: 4,
    elements: [],
  },
];

export const forgableSlots = [
  "weapon",
  "offhand",
  "spell",
  "skill",
  "accessory",
  "tool",
] as const;

const calculateForgeStats = () => {
  const forgeConfig: Partial<
    Record<
      Weapon | Offhand | Spell | Skill | Accessory | Tool,
      Partial<
        Record<
          Material,
          Partial<Record<Element | "default", Omit<ForgeOption, "base">[]>>
        >
      >
    >
  > = {};

  forgableConfigs.forEach((config) => {
    const lookupSlot = forgableSlots.find((slot) => config.item[slot]);
    const lookup = lookupSlot && config.item[lookupSlot];

    if (!lookup) return;

    forgeConfig[lookup] = {};
    const itemConfig = forgeConfig[lookup]!;

    config.materials.forEach((material) => {
      const nextMaterial = materials[materials.indexOf(material) + 1];
      itemConfig[material] = {};
      const materialConfig = itemConfig[material]!;

      // set material upgrade path
      materialConfig.default = [
        {
          add: {
            stackable: "resource",
            material: nextMaterial,
            amount: config.materialCost,
          },
          result: {
            ...config.item,
            material: nextMaterial,
          },
        },
      ];

      config.elements.forEach((element) => {
        // set elements upgrade path
        materialConfig.default!.push({
          add: {
            stackable: "resource",
            material: "wood",
            element,
            amount: 1,
          },
          result: {
            ...config.item,
            material,
            element,
          },
        });

        // set material update path with existing element
        materialConfig[element] = [
          {
            add: {
              stackable: "resource",
              material: nextMaterial,
              amount: config.materialCost,
            },
            result: {
              ...config.item,
              material: nextMaterial,
              element,
            },
          },
        ];
      });
    });
  });

  return forgeConfig;
};

export const forgeStats = calculateForgeStats();

export type ForgeOption = {
  base: Omit<Item, "carrier" | "bound">;
  add: Omit<Item, "carrier" | "bound">;
  result: Omit<Item, "carrier" | "bound" | "amount">;
};
export type ForgeOptionResult = Omit<ForgeOption, "result"> & {
  result: Omit<Item, "carrier" | "bound">;
};

export const getForgeOptions = (item: Item): ForgeOptionResult[] => {
  const { weapon, offhand, spell, skill, accessory, material, tool, element } =
    item;

  const key = weapon || offhand || spell || skill || accessory || tool;

  if (!key || !material) return [];

  const options = forgeStats[key]?.[material]?.[element || "default"] || [];

  return options.map((option) => ({
    base: item,
    add: option.add,
    result: { ...option.result, amount: 1 },
  }));
};

export type ForgeStatus = {
  forgeable: boolean;
  duplicate: boolean;
  insufficient?: Omit<Item, "carrier" | "bound">;
  baseItem?: Omit<Item, "carrier" | "bound">;
  addItem?: Omit<Item, "carrier" | "bound">;
  resultItem?: Omit<Item, "carrier" | "bound">;
};

const notForgable = {
  forgeable: false,
  duplicate: false,
};

export const getForgeStatus = (
  world: World,
  entity?: Entity,
  firstIndex?: number,
  secondIndex?: number,
  selectedIndex?: number
): ForgeStatus => {
  const baseIndex = firstIndex ?? selectedIndex;
  const addIndex =
    firstIndex === undefined ? undefined : secondIndex ?? selectedIndex;

  if (!entity || !entity[INVENTORY] || baseIndex === undefined)
    return notForgable;

  const inventoryItems = (entity[INVENTORY] as Inventory).items.map((itemId) =>
    world.assertByIdAndComponents(itemId, [ITEM])
  );
  const baseItem = inventoryItems[baseIndex];

  if (!baseItem) return notForgable;

  const options = getForgeOptions(baseItem[ITEM]);

  if (options.length === 0) {
    return { ...notForgable, baseItem: baseItem[ITEM] };
  } else if (addIndex === undefined) {
    // indicated valid base item
    return {
      forgeable: true,
      duplicate: false,
      baseItem: baseItem[ITEM],
    };
  }

  const addItem = inventoryItems[addIndex];

  if (!addItem) return { ...notForgable, baseItem: baseItem[ITEM] };

  if (baseIndex === addIndex)
    return {
      forgeable: false,
      duplicate: true,
      baseItem: baseItem[ITEM],
      addItem: addItem[ITEM],
    };

  const targetOption = options.find((option) =>
    matchesItem(world, addItem[ITEM], option.add)
  );

  if (!targetOption)
    return { ...notForgable, baseItem: baseItem[ITEM], addItem: addItem[ITEM] };

  const insufficientMaterials = addItem[ITEM].amount < targetOption.add.amount;

  return {
    forgeable: !insufficientMaterials,
    duplicate: false,
    insufficient: insufficientMaterials ? addItem[ITEM] : undefined,
    baseItem: baseItem[ITEM],
    addItem: targetOption.add,
    resultItem: secondIndex === undefined ? undefined : targetOption.result,
  };
};

export const forgeTicks = 3;
export const hittingOffset = 2;
export const hittingWidth = 15;
export const hittingArea = 6;

const stepWidths: Record<Element | Material, number> = {
  wood: 5,
  iron: 4,
  gold: 3,
  diamond: 2,
  ruby: 1,
  air: 1,
  fire: 1,
  water: 1,
  earth: 1,
};

export const forgingCompleted = (entity: Entity) =>
  entity[FORGABLE] &&
  entity[FORGABLE].steps.length === entity[FORGABLE].progress;

export const getForgingSteps = (forgeStatus: ForgeStatus) => {
  const { forgeable, addItem, resultItem } = forgeStatus;
  if (!forgeable || !addItem || !resultItem) return [];

  const items = [...repeat(addItem, addItem.amount), resultItem];

  // ensure no offset is repeated
  const steps: ForgeStep[] = [];
  let offset = -1;
  for (const item of items) {
    const width = stepWidths[item.element || item.material || "wood"];
    const gap = hittingArea - width;
    let newOffset = random(0, gap);
    if (newOffset === offset) {
      newOffset = normalize(newOffset + choice(-1, 1), gap);
    }
    offset = newOffset;
    steps.push({
      width,
      offset,
      item,
    });
  }
  return steps;
};

export const performForgeHit = (world: World, entity: Entity) => {
  const popupSequence = getSequence(world, entity, "popup");
  const steps = (entity[FORGABLE] as Forgable).steps;
  const step = steps[entity[FORGABLE].progress];
  const heroEntity = world.getEntity([PLAYER, STATS]);
  const hitIndex = entity[FORGABLE].hitIndex;

  if (
    !popupSequence ||
    !step ||
    !heroEntity ||
    hitIndex === undefined ||
    entity[FORGABLE].lastAction !== "trigger"
  )
    return;

  if (hitIndex < hittingOffset || hitIndex >= hittingArea + hittingOffset) {
    // outside of anvil, hit self
    entity[FORGABLE].lastAction = "miss";

    const { damage, hp } = calculateDamage(world, { true: 1 }, {}, heroEntity);
    heroEntity[STATS].hp = hp;

    play("magic", { intensity: damage, proximity: 1 });

    // add hit marker
    createAmountMarker(world, heroEntity, -damage, "up", "true");
  } else if (
    hitIndex < hittingOffset + step.offset ||
    hitIndex >= hittingOffset + step.offset + step.width
  ) {
    // miss
    entity[FORGABLE].lastAction = "miss";
    rerenderEntity(world, entity);
  } else {
    entity[FORGABLE].lastAction = "hit";
  }
};
