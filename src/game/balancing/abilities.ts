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
            Partial<Record<Element | "default", Partial<ItemStats>>>
          >
        >
      >
    >
  >
> = {
  default: {
    wave: {
      wood: {
        default: { magic: 3 },

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
          magic: 1,
          drain: 1,
        },
      },
      iron: {
        default: { magic: 6 },
      },
    },
    beam: {
      wood: {
        default: { magic: 2 },

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
      wood: { default: { melee: 2 } },
      iron: { default: { melee: 4 } },
      gold: { default: { melee: 6 } },
      diamond: { default: { melee: 8 } },
      ruby: { default: { melee: 10 } },
    },
    slash: {
      wood: { default: { melee: 2 } },
      iron: { default: { melee: 4 } },
      gold: { default: { melee: 6 } },
      diamond: { default: { melee: 8 } },
      ruby: { default: { melee: 10 } },
    },
  },

  orb: {
    beam: {
      iron: { default: { magic: 1 } },
    },
  },

  goldOrb: {
    beam: {
      gold: { default: { magic: 3 } },
    },
  },

  violet: {
    bolt: {
      iron: { default: { magic: 3 } },
    },
  },

  tutorialBoss: {
    bow: {
      wood: {
        default: { melee: 1 },
      },
    },
  },

  oakBoss: {
    wave: {
      gold: {
        default: { magic: 3 },
      },
    },
    blast: {
      gold: {
        default: { magic: 5 },
      },
    },
  },

  oakTower: {
    wave: {
      iron: {
        default: { magic: 1 },
      },
    },
    bolt: {
      default: {
        earth: {
          heal: 1,
        },
      },
    },
  },

  chestBoss: {
    wave: {
      wood: {
        default: { magic: 10 },

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
        default: { magic: 5 },

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
    ? lookupAbilityStats(
        (stats) =>
          stats?.[key]?.[material || "default"]?.[element || "default"],
        caster
      )
    : {};

  return {
    ...emptyItemStats,
    ...itemStats,
  };
};
