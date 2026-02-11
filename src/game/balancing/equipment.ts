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
            Partial<ItemStats> & Partial<Record<Element, Partial<ItemStats>>>
          >
        >
      >
    >
  >
> = {
  default: {
    sword: {
      wood: {
        melee: 2,

        air: {
          melee: 2,
          power: 1,
        },
        fire: {
          melee: 2,
          burn: 2,
        },
        water: {
          melee: 2,
          freeze: 2,
        },
        earth: {
          melee: 2,
          drain: 1,
        },
      },
      iron: { melee: 4 },
      gold: { melee: 6 },
      diamond: { melee: 8 },
      ruby: { melee: 10 },

      default: {
        earth: {
          heal: 2,
        },
      },
    },
    shield: {
      wood: {
        armor: 1,

        air: {
          armor: 1,
          resist: 1,
        },
        fire: {
          armor: 1,
          damp: 2,
        },
        water: {
          armor: 1,
          thaw: 5,
        },
        earth: {
          armor: 1,
          spike: 1,
        },
      },
      iron: {
        armor: 2,
      },
      gold: {
        armor: 3,
      },
      diamond: {
        armor: 4,
      },
      ruby: {
        armor: 5,
      },
    },
    torch: {
      wood: {
        vision: 2,
      },
    },
    boots: {
      wood: {
        haste: 1,
      },
    },
    ring: {
      wood: {
        maxMp: 2,

        air: {
          maxMp: 2,
          haste: 1,
        },
        fire: {
          maxMp: 2,
          power: 1,
        },
        water: {
          maxMp: 2,
          wisdom: 1,
        },
        earth: {
          maxMp: 2,
          spike: 1,
        },
      },
      iron: { maxMp: 4 },
      gold: { maxMp: 6 },
      diamond: { maxMp: 8 },
      ruby: { maxMp: 10 },
    },
    amulet: {
      wood: {
        maxHp: 5,

        air: {
          maxHp: 5,
          armor: 1,
        },
        fire: {
          maxHp: 5,
          damp: 1,
        },
        water: {
          maxHp: 5,
          thaw: 2,
        },
        earth: {
          maxHp: 5,
          resist: 1,
        },
      },
      iron: { maxHp: 10 },
      gold: { maxHp: 15 },
      diamond: { maxHp: 20 },
      ruby: { maxHp: 25 },
    },
  },
  prism: {
    sword: {
      iron: { melee: 1 },
    },
  },
  goldPrism: {
    sword: {
      gold: { melee: 2 },
    },
  },
  eye: {
    sword: {
      iron: { melee: 1 },
    },
  },
  goldEye: {
    sword: {
      gold: { melee: 5 },
    },
  },
  clover: {
    sword: {
      wood: { melee: 1 },
    },
  },
  oakClover: {
    sword: {
      default: {
        earth: { heal: 1 },
      },
    },
  },
};

export const lookupEquipmentStats = (
  lookup: (
    casterStats: (typeof gearStats)[NpcType]
  ) =>
    | Partial<ItemStats & Partial<Record<Element, Partial<ItemStats>>>>
    | undefined,
  caster: NpcType | "default"
) => {
  const { air, fire, water, earth, ...result } =
    lookup(gearStats[caster]) || lookup(gearStats.default) || {};
  return result;
};

export const getEquipmentStats = (
  item: Omit<Item, "carrier" | "bound" | "amount">,
  caster: NpcType | "default" = "default"
): ItemStats => {
  const { equipment, material, element } = item;
  const itemStats = equipment
    ? element
      ? lookupEquipmentStats(
          (stats) => stats?.[equipment]?.[material || "default"]?.[element],
          caster
        )
      : material
      ? lookupEquipmentStats((stats) => stats?.[equipment]?.[material], caster)
      : {}
    : {};

  return {
    ...emptyItemStats,
    ...itemStats,
  };
};

export const getItemStats = (
  item: Omit<Item, "carrier" | "bound" | "amount">,
  caster: NpcType | "default" = "default"
): ItemStats =>
  item.primary || item.secondary
    ? getAbilityStats(item, caster)
    : getEquipmentStats(item, caster);

export const getItemDiff = (
  world: World,
  baseItem: Omit<Item, "carrier" | "bound" | "amount">,
  resultItem: Omit<Item, "carrier" | "bound" | "amount">
): Omit<ItemStats, "medium"> => {
  const baseStats =
    baseItem.primary || baseItem.secondary
      ? getAbilityStats(baseItem)
      : getEquipmentStats(baseItem);
  const resultStats =
    resultItem.primary || resultItem.secondary
      ? getAbilityStats(resultItem)
      : getEquipmentStats(resultItem);

  Object.entries(baseStats).forEach(([key, value]) => {
    resultStats[key as keyof Attributes] -= value;
  });

  return resultStats;
};
