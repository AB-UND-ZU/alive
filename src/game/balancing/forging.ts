import { Entity } from "ecs";
import { World } from "../../engine";
import { Equipment } from "../../engine/components/equippable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import {
  Element,
  elements,
  ITEM,
  Item,
  Material,
  materials,
  Primary,
  Secondary,
} from "../../engine/components/item";
import { matchesItem } from "../../engine/systems/popup";

const forgableMaterials = materials.slice(0, -1);
const forgableElements = [...elements];
const forgableConfigs: {
  item: Omit<Item, "carrier" | "bound" | "amount">;
  materials: Material[];
  materialCost: number;
  elements: Element[];
}[] = [
  {
    item: { equipment: "sword" },
    materials: forgableMaterials,
    materialCost: 5,
    elements: forgableElements,
  },
  {
    item: { equipment: "shield" },
    materials: forgableMaterials,
    materialCost: 6,
    elements: forgableElements,
  },
  {
    item: { equipment: "primary", primary: "wave" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: forgableElements,
  },
  {
    item: { equipment: "primary", primary: "beam" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: forgableElements,
  },
  {
    item: { equipment: "ring" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: forgableElements,
  },
  {
    item: { equipment: "amulet" },
    materials: forgableMaterials,
    materialCost: 3,
    elements: forgableElements,
  },
  {
    item: { equipment: "torch" },
    materials: ["wood", "iron"],
    materialCost: 4,
    elements: [],
  },
  {
    item: { equipment: "boots" },
    materials: ["wood", "iron"],
    materialCost: 4,
    elements: [],
  },
  {
    item: { equipment: "secondary", secondary: "bow" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: [],
  },
  {
    item: { equipment: "secondary", secondary: "slash" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: [],
  },
  {
    item: { equipment: "secondary", secondary: "block" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: [],
  },
  {
    item: { equipment: "secondary", secondary: "raise" },
    materials: forgableMaterials,
    materialCost: 4,
    elements: [],
  },
];

const calculateForgeStats = () => {
  const forgeConfig: Partial<
    Record<
      Equipment | Primary | Secondary,
      Partial<
        Record<
          Material,
          Partial<Record<Element | "default", Omit<ForgeOption, "base">[]>>
        >
      >
    >
  > = {};

  forgableConfigs.forEach((config) => {
    const lookup =
      config.item.secondary || config.item.primary || config.item.equipment!;
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
  const { equipment, primary, secondary, material, element } = item;

  const key = primary || secondary || equipment;

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
