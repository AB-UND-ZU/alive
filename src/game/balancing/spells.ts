import { Castable } from "../../engine/components/castable";
import { Element, Primary } from "../../engine/components/item";
import { NpcType } from "../../engine/components/npc";

export const spellStats: Partial<
  Record<
    NpcType | "hero",
    Partial<
      Record<
        Primary,
        Partial<
          Record<
            Element | "default",
            Partial<Pick<Castable, "damage" | "burn" | "freeze" | "heal">>
          >
        >
      >
    >
  >
> = {
  hero: {
    wave1: {
      default: {
        damage: 2,
      },
      fire: {
        damage: 2,
        burn: 2,
      },
      water: {
        damage: 2,
        freeze: 6,
      },
      earth: {
        heal: 2,
      },
    },
    beam1: {
      default: {
        damage: 5,
      },
      fire: {
        damage: 5,
        burn: 2,
      },
      water: {
        damage: 5,
        freeze: 6,
      },
      earth: {
        heal: 3,
      },
    },
  },

  orb: {
    beam1: {
      default: {
        damage: 1,
      },
    },
  },

  goldOrb: {
    beam1: {
      default: {
        damage: 3,
      },
    },
  },

  chestBoss: {
    wave1: {
      default: {
        damage: 10,
      },
      earth: { heal: 2 },
      water: {
        damage: 3,
        freeze: 9,
      },
    },
  },

  waveTower: {
    wave1: {
      default: {
        damage: 5,
      },
      fire: {
        damage: 3,
        burn: 6,
      },
      water: {
        damage: 3,
        freeze: 9,
      },
    },
  },
};

export const getSpellStat = (
  identifier: NpcType | "hero",
  primary: Primary,
  element?: Element
) => {
  return {
    damage: 0,
    burn: 0,
    freeze: 0,
    heal: 0,
    ...spellStats[identifier]?.[primary]?.[element || "default"],
  };
};
