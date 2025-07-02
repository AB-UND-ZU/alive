import { Castable } from "../../engine/components/castable";
import { Element, Primary } from "../../engine/components/item";

export const spellStats: Partial<
  Record<
    Primary,
    Record<
      Element | "default",
      Partial<Pick<Castable, "damage" | "burn" | "freeze" | "heal">>
    >
  >
> = {
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
};

export const getSpellStat = (lookup: Primary, element?: Element) => {
  return {
    damage: 0,
    burn: 0,
    freeze: 0,
    heal: 0,
    ...spellStats[lookup]?.[element || "default"],
  };
};
