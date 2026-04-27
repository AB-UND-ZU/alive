import { World } from "../../engine";
import { Equipment } from "../../engine/components/equippable";
import {
  Element,
  emptyItemStats,
  Item,
  ItemStats,
  Material,
} from "../../engine/components/item";
import { NpcType } from "../../engine/components/npc";
import { Attributes } from "../../engine/components/stats";
import { getAbilityStats } from "./abilities";

export const gearStats: Partial<
  Record<
    NpcType | "default",
    Partial<
      Record<
        Equipment,
        Partial<
          Record<
            Material | "default",
            Partial<Record<Element | "default", Partial<ItemStats>>>
          >
        >
      >
    >
  >
> = {
  default: {
    weapon: {
      wood: {
        default: { melee: 2 },
        air: { power: 1 },
        fire: { burn: 2 },
        water: { freeze: 2 },
        earth: { drain: 1 },
      },
      iron: {
        default: { melee: 4 },
        air: { power: 1 },
        fire: { burn: 2 },
        water: { freeze: 2 },
        earth: { drain: 1 },
      },
      gold: {
        default: { melee: 6 },
        air: { power: 1 },
        fire: { burn: 2 },
        water: { freeze: 2 },
        earth: { drain: 1 },
      },
      diamond: {
        default: { melee: 8 },
        air: { power: 1 },
        fire: { burn: 2 },
        water: { freeze: 2 },
        earth: { drain: 1 },
      },
      ruby: {
        default: { melee: 10 },
        air: { power: 1 },
        fire: { burn: 2 },
        water: { freeze: 2 },
        earth: { drain: 1 },
      },

      default: { earth: { heal: 2 } },
    },
    shield: {
      wood: {
        default: { armor: 1 },
        air: { resist: 1 },
        fire: { damp: 2 },
        water: { thaw: 5 },
        earth: { spike: 1 },
      },
      iron: {
        default: { armor: 2 },
        air: { resist: 1 },
        fire: { damp: 2 },
        water: { thaw: 5 },
        earth: { spike: 1 },
      },
      gold: {
        default: { armor: 3 },
        air: { resist: 1 },
        fire: { damp: 2 },
        water: { thaw: 5 },
        earth: { spike: 1 },
      },
      diamond: {
        default: { armor: 4 },
        air: { resist: 1 },
        fire: { damp: 2 },
        water: { thaw: 5 },
        earth: { spike: 1 },
      },
      ruby: {
        default: { armor: 5 },
        air: { resist: 1 },
        fire: { damp: 2 },
        water: { thaw: 5 },
        earth: { spike: 1 },
      },
    },
    torch: {
      wood: { default: { vision: 2 } },
      iron: { default: { vision: 3 } },
      gold: { default: { vision: 4 } },
    },
    boots: {
      wood: { default: { haste: 1 } },
      iron: { default: { haste: 2 } },
      gold: { default: { haste: 3 } },
    },
    ring: {
      wood: {
        default: { maxMp: 2 },
        air: { haste: 1 },
        fire: { power: 1 },
        water: { wisdom: 1 },
        earth: { spike: 1 },
      },
      iron: {
        default: { maxMp: 4 },
        air: { haste: 1 },
        fire: { power: 1 },
        water: { wisdom: 1 },
        earth: { spike: 1 },
      },
      gold: {
        default: { maxMp: 6 },
        air: { haste: 1 },
        fire: { power: 1 },
        water: { wisdom: 1 },
        earth: { spike: 1 },
      },
      diamond: {
        default: { maxMp: 8 },
        air: { haste: 1 },
        fire: { power: 1 },
        water: { wisdom: 1 },
        earth: { spike: 1 },
      },
      ruby: {
        default: { maxMp: 10 },
        air: { haste: 1 },
        fire: { power: 1 },
        water: { wisdom: 1 },
        earth: { spike: 1 },
      },
    },
    amulet: {
      wood: {
        default: { maxHp: 5 },
        air: { armor: 1 },
        fire: { damp: 1 },
        water: { thaw: 2 },
        earth: { resist: 1 },
      },
      iron: {
        default: { maxHp: 10 },
        air: { armor: 1 },
        fire: { damp: 1 },
        water: { thaw: 2 },
        earth: { resist: 1 },
      },
      gold: {
        default: { maxHp: 15 },
        air: { armor: 1 },
        fire: { damp: 1 },
        water: { thaw: 2 },
        earth: { resist: 1 },
      },
      diamond: {
        default: { maxHp: 20 },
        air: { armor: 1 },
        fire: { damp: 1 },
        water: { thaw: 2 },
        earth: { resist: 1 },
      },
      ruby: {
        default: { maxHp: 25 },
        air: { armor: 1 },
        fire: { damp: 1 },
        water: { thaw: 2 },
        earth: { resist: 1 },
      },
    },
  },

  prism: {
    weapon: {
      iron: { default: { melee: 1 } },
    },
  },
  goldPrism: {
    weapon: {
      gold: { default: { melee: 2 } },
    },
  },
  eye: {
    weapon: {
      iron: { default: { melee: 1 } },
    },
  },
  goldEye: {
    weapon: {
      gold: { default: { melee: 5 } },
    },
  },
  clover: {
    weapon: {
      wood: { default: { melee: 2 } },
    },
  },
  oakLily: {
    weapon: {
      default: { earth: { heal: 1 } },
    },
  },
  golem: {
    weapon: {
      gold: { default: { melee: 4 } },
    },
  },
};

export const lookupEquipmentStats = (
  lookup: (
    casterStats: (typeof gearStats)[NpcType]
  ) => Partial<ItemStats> | undefined,
  caster: NpcType | "default"
) => lookup(gearStats[caster]) || lookup(gearStats.default) || {};

const getDirectEquipmentStats = (
  item: Omit<Item, "carrier" | "bound" | "amount">,
  caster: NpcType | "default" = "default"
): Partial<ItemStats> => {
  const { equipment, material, element } = item;
  const itemStats = equipment
    ? lookupEquipmentStats(
        (stats) =>
          stats?.[equipment]?.[material || "default"]?.[element || "default"],
        caster
      )
    : {};

  return itemStats;
};

export const getEquipmentStats = (
  item: Omit<Item, "carrier" | "bound" | "amount">,
  caster: NpcType | "default" = "default"
): ItemStats => {
  const defaultStats = getDirectEquipmentStats(
    { ...item, material: undefined, element: undefined },
    "default"
  );
  const materialStats = getDirectEquipmentStats(
    { ...item, element: undefined },
    "default"
  );
  const equipmentStats = getDirectEquipmentStats(item, caster);

  return {
    ...emptyItemStats,
    ...defaultStats,
    ...materialStats,
    ...equipmentStats,
  };
};

export const getItemStats = (
  item: Omit<Item, "carrier" | "bound" | "amount">,
  caster: NpcType | "default" = "default"
): ItemStats =>
  item.spell || item.skill
    ? getAbilityStats(item, caster)
    : getEquipmentStats(item, caster);

export const getItemDiff = (
  world: World,
  baseItem: Omit<Item, "carrier" | "bound" | "amount">,
  resultItem: Omit<Item, "carrier" | "bound" | "amount">
): Omit<ItemStats, "medium"> => {
  const baseStats = getItemStats(baseItem);
  const resultStats = getItemStats(resultItem);

  Object.entries(baseStats).forEach(([key, value]) => {
    resultStats[key as keyof Attributes] -= value;
  });

  return resultStats;
};
