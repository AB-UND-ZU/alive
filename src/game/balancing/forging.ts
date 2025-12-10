import { Entity } from "ecs";
import { World } from "../../engine";
import { Equipment } from "../../engine/components/equippable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import {
  Element,
  ITEM,
  Item,
  Material,
  Primary,
  Secondary,
} from "../../engine/components/item";
import { matchesItem } from "../../engine/systems/popup";

export const forgeStats: Partial<
  Record<
    Equipment | Primary | Secondary,
    Partial<
      Record<
        Material,
        Partial<Record<Element | "default", Omit<ForgeOption, "base">[]>>
      >
    >
  >
> = {
  sword: {
    wood: {
      default: [
        {
          add: { stackable: "resource", material: "iron", amount: 5 },
          result: { equipment: "sword", material: "iron" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "earth" },
        },
      ],
      air: [
        {
          add: { stackable: "resource", material: "iron", amount: 5 },
          result: { equipment: "sword", material: "iron", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "earth" },
        },
      ],
      fire: [
        {
          add: { stackable: "resource", material: "iron", amount: 5 },
          result: { equipment: "sword", material: "iron", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "earth" },
        },
      ],
      water: [
        {
          add: { stackable: "resource", material: "iron", amount: 5 },
          result: { equipment: "sword", material: "iron", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "earth" },
        },
      ],
      earth: [
        {
          add: { stackable: "resource", material: "iron", amount: 5 },
          result: { equipment: "sword", material: "iron", element: "earth" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "sword", material: "wood", element: "water" },
        },
      ],
    },
    iron: {
      default: [
        {
          add: { stackable: "resource", material: "gold", amount: 5 },
          result: { equipment: "sword", material: "gold" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "sword", material: "iron", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "sword", material: "iron", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "sword", material: "iron", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "sword", material: "iron", element: "earth" },
        },
      ],
    },
  },
  shield: {
    wood: {
      default: [
        {
          add: { stackable: "resource", material: "iron", amount: 8 },
          result: { equipment: "shield", material: "iron" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "earth" },
        },
      ],
      air: [
        {
          add: { stackable: "resource", material: "iron", amount: 8 },
          result: { equipment: "shield", material: "iron", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "earth" },
        },
      ],
      fire: [
        {
          add: { stackable: "resource", material: "iron", amount: 8 },
          result: { equipment: "shield", material: "iron", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "earth" },
        },
      ],
      water: [
        {
          add: { stackable: "resource", material: "iron", amount: 8 },
          result: { equipment: "shield", material: "iron", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "earth" },
        },
      ],
      earth: [
        {
          add: { stackable: "resource", material: "iron", amount: 8 },
          result: { equipment: "shield", material: "iron", element: "earth" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "shield", material: "wood", element: "water" },
        },
      ],
    },
    iron: {
      default: [
        {
          add: { stackable: "resource", material: "gold", amount: 8 },
          result: { equipment: "shield", material: "gold" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: { equipment: "shield", material: "iron", element: "air" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: { equipment: "shield", material: "iron", element: "fire" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: { equipment: "shield", material: "iron", element: "water" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: { equipment: "shield", material: "iron", element: "earth" },
        },
      ],
    },
  },
  wave: {
    wood: {
      default: [
        {
          add: { stackable: "resource", material: "iron", amount: 4 },
          result: { equipment: "primary", primary: "wave", material: "iron" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "air",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "fire",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "water",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "earth",
          },
        },
      ],
      air: [
        {
          add: { stackable: "resource", material: "iron", amount: 4 },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "iron",
            element: "air",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "fire",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "water",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "earth",
          },
        },
      ],
      fire: [
        {
          add: { stackable: "resource", material: "iron", amount: 4 },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "iron",
            element: "fire",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "air",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "water",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "earth",
          },
        },
      ],
      water: [
        {
          add: { stackable: "resource", material: "iron", amount: 4 },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "iron",
            element: "water",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "air",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "fire",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "earth",
          },
        },
      ],
      earth: [
        {
          add: { stackable: "resource", material: "iron", amount: 4 },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "iron",
            element: "earth",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "air",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "fire",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "wood",
            element: "water",
          },
        },
      ],
    },
    iron: {
      default: [
        {
          add: { stackable: "resource", material: "gold", amount: 4 },
          result: { equipment: "primary", primary: "wave", material: "gold" },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "air",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "iron",
            element: "air",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "fire",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "iron",
            element: "fire",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "water",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "iron",
            element: "water",
          },
        },
        {
          add: {
            stackable: "resource",
            material: "wood",
            element: "earth",
            amount: 1,
          },
          result: {
            equipment: "primary",
            primary: "wave",
            material: "iron",
            element: "earth",
          },
        },
      ],
    },
  },
};

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
