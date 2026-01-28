import {
  Element,
  emptyItemStats,
  Item,
  ItemStats,
  Material,
  Primary,
  Secondary,
} from "../../engine/components/item";
import { NpcType } from "../../engine/components/npc";

export const abilityStats: Partial<
  Record<
    NpcType | "default",
    Partial<
      Record<
        Primary | Secondary,
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
    wave: {
      wood: {
        magic: 3,

        air: {
          magic: 3,
          wisdom: 1,
        },
        fire: {
          magic: 3,
          burn: 2,
        },
        water: {
          magic: 3,
          freeze: 5,
        },
        earth: {
          heal: 2,
        },
      },
      iron: {
        magic: 6,
      },
    },
    beam: {
      wood: {
        magic: 2,

        air: {
          magic: 2,
          wisdom: 1,
        },
        fire: {
          magic: 2,
          burn: 2,
        },
        water: {
          magic: 2,
          freeze: 3,
        },
        earth: {
          heal: 1,
        },
      },
    },
    bow: {
      wood: { melee: 2 },
      iron: { melee: 4 },
      gold: { melee: 6 },
      diamond: { melee: 8 },
      ruby: { melee: 10 },
    },
    slash: {
      wood: { melee: 2 },
      iron: { melee: 4 },
      gold: { melee: 6 },
      diamond: { melee: 8 },
      ruby: { melee: 10 },
    },
  },

  orb: {
    beam: {
      iron: { magic: 1 },
    },
  },

  goldOrb: {
    beam: {
      gold: { magic: 3 },
    },
  },

  violet: {
    bolt: {
      iron: { magic: 3 },
    },
  },

  tutorialBoss: {
    bow: {
      wood: {
        melee: 1,
      },
    },
  },

  oakBoss: {
    wave: {
      gold: {
        magic: 4,
      },
    },
  },

  oakTower: {
    wave: {
      iron: {
        magic: 2,
      },
    },
    bolt: {
      default: {
        earth: {
          heal: 2,
        },
      },
    },
  },

  chestBoss: {
    wave: {
      wood: {
        magic: 10,

        earth: { heal: 2 },
        water: {
          magic: 3,
          freeze: 9,
        },
      },
    },
  },

  waveTower: {
    wave: {
      wood: {
        magic: 5,

        fire: {
          magic: 3,
          burn: 6,
        },
        water: {
          magic: 3,
          freeze: 9,
        },
      },
    },
  },
};

export const lookupAbilityStats = (
  lookup: (
    casterStats: (typeof abilityStats)[NpcType]
  ) =>
    | Partial<ItemStats & Partial<Record<Element, Partial<ItemStats>>>>
    | undefined,
  caster: NpcType | "default"
) => {
  const { air, fire, water, earth, ...result } =
    lookup(abilityStats[caster]) || lookup(abilityStats.default) || {};
  return result;
};

export const getAbilityStats = (
  item: Omit<Item, "carrier" | "bound" | "amount">,
  caster: NpcType | "default" = "default"
): ItemStats => {
  const { primary, secondary, material, element } = item;
  const key = primary || secondary;
  const itemStats = key
    ? element
      ? lookupAbilityStats(
          (stats) => stats?.[key]?.[material || "default"]?.[element],
          caster
        )
      : lookupAbilityStats(
          (stats) => stats?.[key]?.[material || "default"],
          caster
        )
    : {};

  return {
    ...emptyItemStats,
    ...itemStats,
  };
};
