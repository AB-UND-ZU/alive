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
        Primary | Secondary | "default",
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
      // set default spell attributes
      default: {
        default: {
          range: 7,
          duration: 7,
        },
      },

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
          magic: 2,
          drain: 1,
        },
      },
      iron: {
        default: { magic: 6 },

        air: {
          magic: 6,
          wisdom: 1,
        },
        fire: {
          magic: 6,
          burn: 2,
        },
        water: {
          magic: 6,
          freeze: 5,
        },
        earth: {
          magic: 4,
          drain: 1,
        },
      },
      gold: {
        default: { magic: 9 },

        air: {
          magic: 9,
          wisdom: 1,
        },
        fire: {
          magic: 9,
          burn: 2,
        },
        water: {
          magic: 9,
          freeze: 5,
        },
        earth: {
          magic: 6,
          drain: 1,
        },
      },
      diamond: {
        default: { magic: 12 },

        air: {
          magic: 12,
          wisdom: 1,
        },
        fire: {
          magic: 12,
          burn: 2,
        },
        water: {
          magic: 12,
          freeze: 5,
        },
        earth: {
          magic: 8,
          drain: 1,
        },
      },
      ruby: {
        default: { magic: 15 },

        air: {
          magic: 15,
          wisdom: 1,
        },
        fire: {
          magic: 15,
          burn: 2,
        },
        water: {
          magic: 15,
          freeze: 5,
        },
        earth: {
          magic: 10,
          drain: 1,
        },
      },
    },
    beam: {
      // set default spell attributes
      default: {
        default: {
          duration: 31,
          range: 12,
          retrigger: 2,
        },
      },

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
          magic: 1,
          heal: 1,
        },
      },
      iron: {
        default: { magic: 4 },

        air: {
          magic: 4,
          wisdom: 1,
        },
        fire: {
          magic: 4,
          burn: 2,
        },
        water: {
          magic: 4,
          freeze: 3,
        },
        earth: {
          magic: 2,
          heal: 1,
        },
      },
      gold: {
        default: { magic: 6 },

        air: {
          magic: 6,
          wisdom: 1,
        },
        fire: {
          magic: 6,
          burn: 2,
        },
        water: {
          magic: 6,
          freeze: 3,
        },
        earth: {
          magic: 3,
          heal: 1,
        },
      },
      diamond: {
        default: { magic: 8 },

        air: {
          magic: 8,
          wisdom: 1,
        },
        fire: {
          magic: 8,
          burn: 2,
        },
        water: {
          magic: 8,
          freeze: 3,
        },
        earth: {
          magic: 4,
          heal: 1,
        },
      },
      ruby: {
        default: { magic: 10 },

        air: {
          magic: 10,
          wisdom: 1,
        },
        fire: {
          magic: 10,
          burn: 2,
        },
        water: {
          magic: 10,
          freeze: 3,
        },
        earth: {
          magic: 5,
          heal: 1,
        },
      },
    },
    bolt: {
      // set default spell attributes
      default: {
        default: {
          duration: 6,
          range: 6,
        },
      },
    },
    blast: {
      // set default spell attributes
      default: {
        default: {
          duration: 10,
          range: 10,
          retrigger: 2,
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
    raise: {
      wood: { default: { melee: 3 } },
      iron: { default: { melee: 6 } },
      gold: { default: { melee: 9 } },
      diamond: { default: { melee: 12 } },
      ruby: { default: { melee: 15 } },
    },
    block: {
      wood: { default: { absorb: 1 } },
      iron: { default: { absorb: 2 } },
      gold: { default: { absorb: 3 } },
      diamond: { default: { absorb: 4 } },
      ruby: { default: { absorb: 5 } },
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
      wood: { default: { magic: 3 } },
    },
  },

  tutorialBoss: {
    bow: {
      wood: {
        default: { melee: 1 },
      },
    },
  },

  ilexViolet: {
    bolt: {
      iron: { default: { magic: 1 } },
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

  golem: {
    // fist or standing in limb
    default: {
      default: {
        default: {
          true: 2,
          retrigger: 1,
        },
      },
    },
    wave: {
      gold: {
        default: {
          magic: 5,
          duration: 4,
          range: 4,
        },
      },
    },
    bolt: {
      gold: { default: { magic: 4 } },
    },
  },

  wormBoss: {
    // mouth or standing in limb
    default: {
      default: {
        default: {
          true: 3,
          retrigger: 1,
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
  const itemStats = lookupAbilityStats(
    (stats) =>
      stats?.[key || "default"]?.[material || "default"]?.[
        element || "default"
      ],
    caster
  );

  return {
    ...emptyItemStats,
    ...itemStats,
  };
};
