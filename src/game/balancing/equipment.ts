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

export const gearStats: Partial<
  Record<
    NpcType | "default",
    Partial<
      Record<
        Equipment,
        Partial<
          Record<
            Material,
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
          freeze: 3,
        },
        earth: {
          melee: 2,
          heal: 1,
        },
      },
      iron: { melee: 4 },
      gold: { melee: 6 },
      diamond: { melee: 8 },
      ruby: { melee: 10 },
    },
    shield: {
      wood: {
        armor: 1,
        haste: -1,

        air: {
          armor: 1,
          haste: -1,
          resist: 1,
        },
        fire: {
          armor: 1,
          haste: -1,
          damp: 2,
        },
        water: {
          armor: 1,
          haste: -1,
          thaw: 5,
        },
        earth: {
          armor: 1,
          haste: -1,
          spike: 1,
        },
      },
      iron: {
        armor: 2,
        haste: -1,
      },
      gold: {
        armor: 3,
        haste: -1,
      },
      diamond: {
        armor: 4,
        haste: -1,
      },
      ruby: {
        armor: 5,
        haste: -1,
      },
    },
    ring: {
      wood: {
        maxHp: 2,

        air: {
          maxHp: 2,
          haste: 1,
        },
        fire: {
          maxHp: 2,
          power: 1,
        },
        water: {
          maxHp: 2,
          wisdom: 1,
        },
        earth: {
          maxHp: 2,
          spike: 1,
        },
      },
      iron: { maxHp: 4 },
      gold: { maxHp: 6 },
      diamond: { maxHp: 8 },
      ruby: { maxHp: 10 },
    },
    amulet: {
      wood: {
        maxMp: 1,

        air: {
          maxMp: 1,
          vision: 1,
        },
        fire: {
          maxMp: 1,
          armor: 1,
        },
        water: {
          maxMp: 1,
          resist: 1,
        },
        earth: {
          maxMp: 1,
          damp: 1,
          thaw: 2,
        },
      },
      iron: { maxMp: 2 },
      gold: { maxMp: 3 },
      diamond: { maxMp: 4 },
      ruby: { maxMp: 5 },
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
  const itemStats =
    equipment && material
      ? element
        ? lookupEquipmentStats(
            (stats) => stats?.[equipment]?.[material]?.[element],
            caster
          )
        : lookupEquipmentStats(
            (stats) => stats?.[equipment]?.[material],
            caster
          )
      : {};

  return {
    ...emptyItemStats,
    ...itemStats,
  };
};

export const getEquipmentDiff = (
  world: World,
  baseItem: Omit<Item, "carrier" | "bound" | "amount">,
  resultItem: Omit<Item, "carrier" | "bound" | "amount">
): Omit<ItemStats, "medium"> => {
  const baseStats = getEquipmentStats(baseItem);
  const resultStats = getEquipmentStats(resultItem);

  Object.entries(baseStats).forEach(([key, value]) => {
    resultStats[key as keyof Attributes] -= value;
  });

  return resultStats;
};
