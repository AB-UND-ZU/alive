import { Pattern } from "../../engine/components/behaviour";
import {
  box,
  cactus1,
  cactus2,
  commonChest,
  epicChest,
  eye,
  fairy,
  goldEye,
  goldOrb,
  goldPrism,
  legendaryChest,
  orb,
  pot,
  prism,
  rareChest,
  rock1,
  rock2,
  uncommonChest,
  villager,
} from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { distribution } from "../math/std";
import { Tribe } from "../../engine/components/belongable";
import { Item } from "../../engine/components/item";
import { getGearStat } from "./equipment";

export type UnitKey =
  | "guide"
  | "commonChest"
  | "uncommonChest"
  | "rareChest"
  | "epicChest"
  | "legendaryChest"
  | "pot"
  | "box"
  | "cactus1"
  | "cactus2"
  | "rock1"
  | "rock2"
  | "spawnPrism"
  | "prism"
  | "goldPrism"
  | "eye"
  | "goldEye"
  | "orb"
  | "goldOrb"
  | "fairy";

export type UnitDistribution = Partial<Record<UnitKey, number>>;

export type UnitDefinition = {
  tribe: Tribe;
  attack: number;
  defense: number;
  hp: number;
  mp: number;
  equipments: Omit<Item, "carrier">[];
  drops: {
    chance: number;
    items: Omit<Item, "carrier" | "bound">[];
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
    mp: number;
    maxMp: number;
  };
  equipments: Omit<Item, "carrier">[];
  items: Omit<Item, "carrier">[];
  patterns: Pattern[];
  sprite: Sprite;
};

const unitDefinitions: Record<UnitKey, UnitDefinition> = {
  guide: {
    tribe: "neutral",
    attack: 0,
    defense: 0,
    hp: 20,
    mp: 0,
    equipments: [
      {
        equipment: "melee",
        material: "iron",
        bound: false,
        amount: getGearStat("melee", "iron"),
      },
      {
        equipment: "armor",
        material: "wood",
        bound: false,
        amount: getGearStat("armor", "wood"),
      },
    ],
    drops: [],
    patternNames: [],
    sprite: { ...villager, name: 'Guide' },
  },
  commonChest: {
    tribe: "unit",
    attack: 0,
    defense: 0,
    hp: 20,
    mp: 0,
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
    mp: 0,
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
    mp: 0,
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
    mp: 0,
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
    mp: 0,
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
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: pot,
  },
  box: {
    tribe: "unit",
    attack: 0,
    defense: 0,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stat: "xp", amount: 1 }] }],
    patternNames: [],
    sprite: box,
  },
  cactus1: {
    tribe: "unit",
    attack: 2,
    defense: 1,
    hp: 10,
    mp: 0,
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
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "spike", amount: 1 }] }],
    patternNames: [],
    sprite: cactus2,
  },
  rock1: {
    tribe: "unit",
    attack: 0,
    defense: 3,
    hp: 2,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 40, items: [{ stat: "flower", amount: 1 }] },
      { chance: 30, items: [{ stat: "ore", amount: 1 }] },
      { chance: 20, items: [{ stackable: "crystal", amount: 1 }] },
      { chance: 10, items: [{ stat: "stick", amount: 1 }] },
    ],
    patternNames: [],
    sprite: rock1,
  },
  rock2: {
    tribe: "unit",
    attack: 3,
    defense: 2,
    hp: 3,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 40, items: [{ stat: "berry", amount: 1 }] },
      { chance: 30, items: [{ stat: "ore", amount: 1 }] },
      { chance: 20, items: [{ stackable: "gem", amount: 1 }] },
      { chance: 10, items: [{ stat: "stick", amount: 1 }] },
    ],
    patternNames: [],
    sprite: rock2,
  },
  spawnPrism: {
    tribe: "wild",
    attack: 1,
    defense: 0,
    hp: 3,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stat: "gold", amount: 1 }] }],
    patternNames: ["prism"],
    sprite: prism,
  },
  prism: {
    tribe: "wild",
    attack: 1,
    defense: 0,
    hp: 4,
    mp: 0,
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
    mp: 0,
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
    mp: 0,
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
    mp: 0,
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
  orb: {
    tribe: "wild",
    attack: 1,
    defense: 0,
    hp: 2,
    mp: 1,
    equipments: [
      {
        equipment: "active",
        active: "beam1",
        bound: true,
        amount: 2,
      },
    ],
    drops: [
      { chance: 70, items: [{ stat: "gold", amount: 1 }] },
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 15, items: [{ stat: "mp", amount: 1 }] },
    ],
    patternNames: ["orb"],
    sprite: orb,
  },
  goldOrb: {
    tribe: "wild",
    attack: 5,
    defense: 1,
    hp: 5,
    mp: 2,
    equipments: [
      {
        equipment: "active",
        active: "beam1",
        bound: true,
        amount: 5,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [
          { stat: "gold", amount: 3 },
          { stat: "hp", amount: 1 },
          { stat: "mp", amount: 1 },
        ],
      },
    ],
    patternNames: ["orb"],
    sprite: goldOrb,
  },
  fairy: {
    tribe: "wild",
    attack: 0,
    defense: 2,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [
      {
        chance: 50,
        items: [{ equipment: "armor", amount: 4, material: "gold" }],
      },
      {
        chance: 50,
        items: [{ equipment: "melee", amount: 4, material: "gold" }],
      },
    ],
    patternNames: ["fairy"],
    sprite: fairy,
  },
};

export const generateUnitKey = (unitDistribution: UnitDistribution) => {
  const unitKeys = Object.keys(unitDistribution) as UnitKey[];
  return unitKeys[distribution(...Object.values(unitDistribution))];
};

export const generateUnitData = (unitKey: UnitKey): UnitData => {
  const { drops, hp, mp, attack, defense, patternNames, ...unitDefinition } =
    unitDefinitions[unitKey];
  const items =
    drops.length > 0
      ? drops
          .map((drop) => drop.items)
          [distribution(...drops.map((drop) => drop.chance))].map((item) => ({
            ...item,
            bound: false,
          }))
      : [];

  return {
    items,
    stats: { hp, maxHp: hp, mp, maxMp: mp, attack, defense },
    patterns: patternNames.map((name) => ({ name, memory: {} })),
    ...unitDefinition,
  };
};
