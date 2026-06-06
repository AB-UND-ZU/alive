import { World } from "../../engine";
import { Accessory } from "../../engine/components/equippable";
import {
  Element,
  emptyItemStats,
  Item,
  ItemStats,
  Material,
  Offhand,
  Tool,
  Weapon,
} from "../../engine/components/item";
import { NpcType } from "../../engine/components/npc";
import { Attributes } from "../../engine/components/stats";
import { getAbilityStats } from "./abilities";

export const gearStats: Partial<
  Record<
    NpcType | "default",
    Partial<
      Record<
        Accessory | Weapon | Offhand | Tool,
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
    sword: {
      wood: {
        default: { melee: 2 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
      iron: {
        default: { melee: 4 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
      gold: {
        default: { melee: 6 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
      diamond: {
        default: { melee: 8 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
      ruby: {
        default: { melee: 10 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },

      default: { earth: { heal: 2 } },
    },
    spear: {
      wood: {
        default: { melee: 1 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
      iron: {
        default: { melee: 2 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
      gold: {
        default: { melee: 3 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
      diamond: {
        default: { melee: 4 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
      ruby: {
        default: { melee: 5 },
        air: { power: 1 },
        fire: { burn: 3 },
        water: { freeze: 2 },
        earth: { drain: 2 },
      },
    },
    wand: {
      // melee attacks for wands
      default: { default: { true: 1 } },
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
    axe: {
      wood: { default: { logging: 1, range: 1 } },
      iron: { default: { logging: 2, range: 1 } },
      gold: { default: { logging: 2, range: 2 } },
    },
    shovel: {
      wood: { default: { farming: 1 } },
      iron: { default: { farming: 2 } },
      gold: { default: { farming: 3 } },
    },
    pickaxe: {
      wood: { default: { mining: 1, range: 1 } },
      iron: { default: { mining: 2, range: 1 } },
      gold: { default: { mining: 2, range: 2 } },
    },
    hook: {
      wood: { default: { fishing: 1, range: 5 } },
      iron: { default: { fishing: 2, range: 5 } },
      gold: { default: { fishing: 3, range: 5 } },
    },
    hammer: {
      wood: { default: { build: 1 } },
      iron: { default: { build: 2 } },
      gold: { default: { build: 3 } },
    },
  },

  prism: {
    sword: {
      iron: { default: { melee: 1 } },
    },
  },
  goldPrism: {
    sword: {
      gold: { default: { melee: 2 } },
    },
  },
  eye: {
    sword: {
      iron: { default: { melee: 1 } },
    },
  },
  goldEye: {
    sword: {
      gold: { default: { melee: 5 } },
    },
  },
  clover: {
    sword: {
      wood: { default: { melee: 2 } },
    },
  },
  oakLily: {
    sword: {
      default: { earth: { heal: 1 } },
    },
  },
  golem: {
    sword: {
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
  const { material, element, ...itemSlots } = item;
  const gearSlot = (["weapon", "offhand", "accessory", "tool"] as const).find(
    (slot) => item[slot]
  );
  const equipmentSlot = gearSlot && itemSlots[gearSlot];
  const itemStats = equipmentSlot
    ? lookupEquipmentStats(
        (stats) =>
          stats?.[equipmentSlot]?.[material || "default"]?.[
            element || "default"
          ],
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
  item.spell || (item.skill && item.weapon !== "spear")
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
