import { Gear } from "../../engine/components/equippable";
import { Material } from "../../engine/components/item";

export const gearStats: Record<Gear, Record<Material, number>> = {
  sword: {
    // T1-T3
    wood: 2,
    iron: 4,
    gold: 6,

    // T4
    diamond: 8,
    fire: 6,
    water: 6,
    earth: 6,

    // T5
    ruby: 10,
    aether: 8,
    void: 8,
    rainbow: 8,
  },
  shield: {
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
};

export const getGearStat = (lookup: Gear, material: Material) => {
  return gearStats[lookup][material];
};
