import { Pattern } from "../../engine/components/behaviour";
import { Countable } from "../../engine/components/stats";
import {
  cactus1,
  cactus2,
  commonChest,
  epicChest,
  eye,
  goldEye,
  goldPrism,
  legendaryChest,
  pot,
  prism,
  rareChest,
  uncommonChest,
  villager,
} from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { distribution } from "../math/std";
import { Tribe } from "../../engine/components/belongable";
import { Gear } from "../../engine/components/equippable";
import { Material, Stackable } from "../../engine/components/item";

export type UnitKey =
  | "guide"
  | "commonChest"
  | "uncommonChest"
  | "rareChest"
  | "epicChest"
  | "legendaryChest"
  | "pot"
  | "cactus1"
  | "cactus2"
  | "spawnPrism"
  | "prism"
  | "goldPrism"
  | "eye"
  | "goldEye";

export type UnitDistribution = Partial<Record<UnitKey, number>>;

export type UnitDefinition = {
  tribe: Tribe;
  attack: number;
  defense: number;
  hp: number;
  equipments: { equipment: Gear; material: Material }[];
  drops: {
    chance: number;
    items: (
      | { stat: keyof Countable; amount: number }
      | { stackable: Stackable; amount: number }
    )[];
  }[];
  patternNames: Pattern["name"][];
  sprite: Sprite;
};

export type UnitData = {
  tribe: Tribe;
  stats: {
    attack: number;
    defense: number;
    hp: number;
    maxHp: number;
  };
  equipments: { equipment: Gear; material: Material }[];
  items: (
    | { stat: keyof Countable; amount: number }
    | { stackable: Stackable; amount: number }
  )[];
  patterns: Pattern[];
  sprite: Sprite;
};

const unitDefinitions: Record<UnitKey, UnitDefinition> = {
  guide: {
    tribe: "neutral",
    attack: 0,
    defense: 0,
    hp: 20,
    equipments: [
      { equipment: "melee", material: "iron" },
      { equipment: "armor", material: "wood" },
    ],
    drops: [],
    patternNames: [],
    sprite: villager,
  },
  commonChest: {
    tribe: "unit",
    attack: 0,
    defense: 0,
    hp: 20,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: commonChest,
  },
  uncommonChest: {
    tribe: "unit",
    attack: 0,
    defense: 1,
    hp: 25,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: uncommonChest,
  },
  rareChest: {
    tribe: "unit",
    attack: 0,
    defense: 2,
    hp: 30,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: rareChest,
  },
  epicChest: {
    tribe: "unit",
    attack: 0,
    defense: 3,
    hp: 35,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: epicChest,
  },
  legendaryChest: {
    tribe: "unit",
    attack: 0,
    defense: 4,
    hp: 40,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: legendaryChest,
  },
  pot: {
    tribe: "unit",
    attack: 0,
    defense: 0,
    hp: 10,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: pot,
  },
  cactus1: {
    tribe: "unit",
    attack: 2,
    defense: 1,
    hp: 10,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "spike", amount: 1 }] }],
    patternNames: [],
    sprite: cactus1,
  },
  cactus2: {
    tribe: "unit",
    attack: 3,
    defense: 0,
    hp: 10,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "spike", amount: 1 }] }],
    patternNames: [],
    sprite: cactus2,
  },
  spawnPrism: {
    tribe: "wild",
    attack: 1,
    defense: 0,
    hp: 3,
    equipments: [],
    drops: [{ chance: 100, items: [{ stat: "gold", amount: 1 }] }],
    patternNames: ["prism"],
    sprite: prism,
  },
  prism: {
    tribe: "wild",
    attack: 1,
    defense: 0,
    hp: 3,
    equipments: [],
    drops: [
      { chance: 70, items: [{ stat: "gold", amount: 1 }] },
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 15, items: [{ stat: "mp", amount: 1 }] },
    ],
    patternNames: ["prism"],
    sprite: prism,
  },
  goldPrism: {
    tribe: "wild",
    attack: 2,
    defense: 1,
    hp: 15,
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [
          { stat: "gold", amount: 3 },
          { stat: "xp", amount: 1 },
          { stat: "mp", amount: 1 },
        ],
      },
    ],
    patternNames: ["prism"],
    sprite: goldPrism,
  },
  eye: {
    tribe: "wild",
    attack: 1,
    defense: 0,
    hp: 1,
    equipments: [],
    drops: [
      { chance: 70, items: [{ stat: "gold", amount: 1 }] },
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 15, items: [{ stat: "hp", amount: 1 }] },
    ],
    patternNames: ["eye"],
    sprite: eye,
  },
  goldEye: {
    tribe: "wild",
    attack: 5,
    defense: 1,
    hp: 1,
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [
          { stat: "gold", amount: 3 },
          { stat: "xp", amount: 1 },
          { stat: "hp", amount: 1 },
        ],
      },
    ],
    patternNames: ["eye"],
    sprite: goldEye,
  },
};

export const generateUnitKey = (unitDistribution: UnitDistribution) => {
  const unitKeys = Object.keys(unitDistribution) as UnitKey[];
  return unitKeys[distribution(...Object.values(unitDistribution))];
};

export const generateUnitData = (unitKey: UnitKey): UnitData => {
  const { drops, hp, attack, defense, patternNames, ...unitDefinition } =
    unitDefinitions[unitKey];
  const items =
    drops.length > 0
      ? drops.map((drop) => drop.items)[
          distribution(...drops.map((drop) => drop.chance))
        ]
      : [];

  return {
    items,
    stats: { hp, maxHp: hp, attack, defense },
    patterns: patternNames.map((name) => ({ name, memory: {} })),
    ...unitDefinition,
  };
};
