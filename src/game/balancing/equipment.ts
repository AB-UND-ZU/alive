import { Gear } from "../../engine/components/equippable";
import { Material } from "../../engine/components/item";

export const gearStats: Record<Gear, Record<Material, number>> = {
  melee: {
    // T1-T3
    wood: 2,
    iron: 3,
    gold: 4,

    // T4
    diamond: 6,
    fire: 4,
    water: 4,
    earth: 4,

    // T5
    ruby: 8,
    aether: 8,
    void: 8,
    rainbow: 6,
  },
  armor: {
    // T1-T3
    wood: 1,
    iron: 2,
    gold: 3,

    // T4
    diamond: 5,
    fire: 4,
    water: 4,
    earth: 4,

    // T5
    ruby: 6,
    aether: 6,
    void: 6,
    rainbow: 5,
  },
  bow: {
    // T1-T3
    wood: 1,
    iron: 2,
    gold: 3,

    // T4
    diamond: 5,
    fire: 3,
    water: 3,
    earth: 3,

    // T5
    ruby: 7,
    aether: 7,
    void: 7,
    rainbow: 5,
  },
};

export const getGearStat = (lookup: Gear, material: Material) => {
  return gearStats[lookup][material];
};
