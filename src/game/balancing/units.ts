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
  hedge1,
  hedge2,
  legendaryChest,
  nomad,
  orb,
  pot,
  prism,
  rareChest,
  rock1,
  rock2,
  settler,
  uncommonChest,
} from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { distribution } from "../math/std";
import { Item } from "../../engine/components/item";
import { getGearStat } from "./equipment";
import { Faction } from "../../engine/components/belongable";

export type UnitKey =
  | "guide"
  | "elder"
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
  | "hedge1"
  | "hedge2"
  | "prism"
  | "goldPrism"
  | "eye"
  | "goldEye"
  | "orb"
  | "goldOrb"
  | "fairy";

export type UnitDistribution = Partial<Record<UnitKey, number>>;

export type UnitDefinition = {
  faction: Faction;
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
  faction: Faction;
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
    faction: "nomad",
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
    sprite: { ...nomad, name: "Guide" },
  },
  elder: {
    faction: "settler",
    attack: 0,
    defense: 0,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: { ...settler, name: "Elder" },
  },
  commonChest: {
    faction: "unit",
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
    faction: "unit",
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
    faction: "unit",
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
    faction: "unit",
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
    faction: "unit",
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
    faction: "unit",
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
    faction: "unit",
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
    faction: "unit",
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
    faction: "unit",
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
    faction: "unit",
    attack: 0,
    defense: 3,
    hp: 3,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 40, items: [] },
      { chance: 40, items: [{ stat: "ore", amount: 1 }] },
      { chance: 20, items: [{ stackable: "crystal", amount: 1 }] },
    ],
    patternNames: [],
    sprite: rock1,
  },
  rock2: {
    faction: "unit",
    attack: 3,
    defense: 2,
    hp: 5,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 40, items: [] },
      { chance: 40, items: [{ stat: "ore", amount: 1 }] },
      { chance: 20, items: [{ stackable: "gem", amount: 1 }] },
    ],
    patternNames: [],
    sprite: rock2,
  },
  hedge1: {
    faction: "unit",
    attack: 0,
    defense: 0,
    hp: 8,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 20, items: [{ stat: "stick", amount: 1 }] },
      { chance: 80, items: [] },
    ],
    patternNames: [],
    sprite: hedge1,
  },
  hedge2: {
    faction: "unit",
    attack: 0,
    defense: 1,
    hp: 5,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 20, items: [{ stat: "stick", amount: 1 }] },
      { chance: 80, items: [] },
    ],
    patternNames: [],
    sprite: hedge2,
  },
  prism: {
    faction: "wild",
    attack: 0,
    defense: 0,
    hp: 4,
    mp: 0,
    equipments: [
      {
        equipment: "melee",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      { chance: 70, items: [{ stat: "gold", amount: 1 }] },
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 15, items: [{ stat: "mp", amount: 1 }] },
    ],
    patternNames: ["prism"],
    sprite: prism,
  },
  goldPrism: {
    faction: "wild",
    attack: 0,
    defense: 1,
    hp: 15,
    mp: 0,
    equipments: [
      {
        equipment: "melee",
        bound: true,
        amount: 2,
      },
    ],
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
    faction: "wild",
    attack: 0,
    defense: 0,
    hp: 1,
    mp: 0,
    equipments: [
      {
        equipment: "melee",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      { chance: 70, items: [{ stat: "gold", amount: 1 }] },
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 15, items: [{ stat: "hp", amount: 1 }] },
    ],
    patternNames: ["eye"],
    sprite: eye,
  },
  goldEye: {
    faction: "wild",
    attack: 0,
    defense: 1,
    hp: 1,
    mp: 0,
    equipments: [
      {
        equipment: "melee",
        bound: true,
        amount: 5,
      },
    ],
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
    faction: "wild",
    attack: 0,
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
    faction: "wild",
    attack: 0,
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
    faction: "wild",
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
