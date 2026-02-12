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
    sword: {
      wood: {
        default: { melee: 2 },
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
      iron: {
        default: { melee: 4 },
        air: {
          melee: 4,
          power: 1,
        },
        fire: {
          melee: 4,
          burn: 2,
        },
        water: {
          melee: 4,
          freeze: 2,
        },
        earth: {
          melee: 4,
          drain: 1,
        },
      },
      gold: {
        default: { melee: 6 },
        air: {
          melee: 6,
          power: 1,
        },
        fire: {
          melee: 6,
          burn: 2,
        },
        water: {
          melee: 6,
          freeze: 2,
        },
        earth: {
          melee: 6,
          drain: 1,
        },
      },
      diamond: {
        default: { melee: 8 },
        air: {
          melee: 8,
          power: 1,
        },
        fire: {
          melee: 8,
          burn: 2,
        },
        water: {
          melee: 8,
          freeze: 2,
        },
        earth: {
          melee: 8,
          drain: 1,
        },
      },
      ruby: {
        default: { melee: 10 },
        air: {
          melee: 10,
          power: 1,
        },
        fire: {
          melee: 10,
          burn: 2,
        },
        water: {
          melee: 10,
          freeze: 2,
        },
        earth: {
          melee: 10,
          drain: 1,
        },
      },

      default: { earth: { heal: 2 } },
    },
    shield: {
      wood: {
        default: { armor: 1 },
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
        default: { armor: 2 },
        air: {
          armor: 2,
          resist: 1,
        },
        fire: {
          armor: 2,
          damp: 2,
        },
        water: {
          armor: 2,
          thaw: 5,
        },
        earth: {
          armor: 2,
          spike: 1,
        },
      },
      gold: {
        default: { armor: 3 },
        air: {
          armor: 3,
          resist: 1,
        },
        fire: {
          armor: 3,
          damp: 2,
        },
        water: {
          armor: 3,
          thaw: 5,
        },
        earth: {
          armor: 3,
          spike: 1,
        },
      },
      diamond: {
        default: { armor: 4 },
        air: {
          armor: 4,
          resist: 1,
        },
        fire: {
          armor: 4,
          damp: 2,
        },
        water: {
          armor: 4,
          thaw: 5,
        },
        earth: {
          armor: 4,
          spike: 1,
        },
      },
      ruby: {
        default: { armor: 5 },
        air: {
          armor: 5,
          resist: 1,
        },
        fire: {
          armor: 5,
          damp: 2,
        },
        water: {
          armor: 5,
          thaw: 5,
        },
        earth: {
          armor: 5,
          spike: 1,
        },
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
      iron: {
        default: { maxMp: 4 },
        air: {
          maxMp: 4,
          haste: 1,
        },
        fire: {
          maxMp: 4,
          power: 1,
        },
        water: {
          maxMp: 4,
          wisdom: 1,
        },
        earth: {
          maxMp: 4,
          spike: 1,
        },
      },
      gold: {
        default: { maxMp: 6 },
        air: {
          maxMp: 6,
          haste: 1,
        },
        fire: {
          maxMp: 6,
          power: 1,
        },
        water: {
          maxMp: 6,
          wisdom: 1,
        },
        earth: {
          maxMp: 6,
          spike: 1,
        },
      },
      diamond: {
        default: { maxMp: 8 },
        air: {
          maxMp: 8,
          haste: 1,
        },
        fire: {
          maxMp: 8,
          power: 1,
        },
        water: {
          maxMp: 8,
          wisdom: 1,
        },
        earth: {
          maxMp: 8,
          spike: 1,
        },
      },
      ruby: {
        default: { maxMp: 10 },
        air: {
          maxMp: 0,
          haste: 1,
        },
        fire: {
          maxMp: 0,
          power: 1,
        },
        water: {
          maxMp: 0,
          wisdom: 1,
        },
        earth: {
          maxMp: 0,
          spike: 1,
        },
      },
    },
    amulet: {
      wood: {
        default: { maxHp: 5 },

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
      iron: {
        default: { maxHp: 10 },
        air: {
          maxHp: 10,
          armor: 1,
        },
        fire: {
          maxHp: 10,
          damp: 1,
        },
        water: {
          maxHp: 10,
          thaw: 2,
        },
        earth: {
          maxHp: 10,
          resist: 1,
        },
      },
      gold: {
        default: { maxHp: 15 },
        air: {
          maxHp: 15,
          armor: 1,
        },
        fire: {
          maxHp: 15,
          damp: 1,
        },
        water: {
          maxHp: 15,
          thaw: 2,
        },
        earth: {
          maxHp: 15,
          resist: 1,
        },
      },
      diamond: {
        default: { maxHp: 20 },
        air: {
          maxHp: 20,
          armor: 1,
        },
        fire: {
          maxHp: 20,
          damp: 1,
        },
        water: {
          maxHp: 20,
          thaw: 2,
        },
        earth: {
          maxHp: 20,
          resist: 1,
        },
      },
      ruby: {
        default: { maxHp: 25 },
        air: {
          maxHp: 25,
          armor: 1,
        },
        fire: {
          maxHp: 25,
          damp: 1,
        },
        water: {
          maxHp: 25,
          thaw: 2,
        },
        earth: {
          maxHp: 25,
          resist: 1,
        },
      },
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
      wood: { default: { melee: 1 } },
    },
  },
  oakClover: {
    sword: {
      default: { earth: { heal: 1 } },
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
    ? lookupEquipmentStats(
        (stats) =>
          stats?.[equipment]?.[material || "default"]?.[element || "default"],
        caster
      )
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
