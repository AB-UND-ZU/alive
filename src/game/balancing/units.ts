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
  hunter,
  knight,
  legendaryChest,
  mage,
  nomad,
  orb,
  pot,
  prism,
  rareChest,
  rock1,
  rock2,
  scout,
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
  | "scout"
  | "smith"
  | "trader"
  | "druid"
  | "hunter"
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
  power: number;
  armor: number;
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
    power: number;
    armor: number;
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
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [
      {
        equipment: "sword",
        material: "iron",
        bound: false,
        amount: getGearStat("sword", "iron"),
      },
      {
        equipment: "shield",
        material: "wood",
        bound: false,
        amount: getGearStat("shield", "wood"),
      },
    ],
    drops: [],
    patternNames: [],
    sprite: { ...nomad, name: "Guide" },
  },
  elder: {
    faction: "settler",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: { ...settler, name: "Elder" },
  },
  scout: {
    faction: "settler",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: { ...scout, name: "Scout" },
  },
  smith: {
    faction: "settler",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [
      { equipment: "shield", material: "iron", amount: 2, bound: true },
    ],
    drops: [],
    patternNames: [],
    sprite: { ...knight, name: "Smith" },
  },
  trader: {
    faction: "settler",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: { ...settler, name: "Trader" },
  },
  druid: {
    faction: "settler",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: { ...mage, name: "Druid" },
  },
  hunter: {
    faction: "settler",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: { ...hunter, name: "Hunter" },
  },
  commonChest: {
    faction: "unit",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: commonChest,
  },
  uncommonChest: {
    faction: "unit",
    power: 0,
    armor: 1,
    hp: 25,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: uncommonChest,
  },
  rareChest: {
    faction: "unit",
    power: 0,
    armor: 2,
    hp: 30,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: rareChest,
  },
  epicChest: {
    faction: "unit",
    power: 0,
    armor: 3,
    hp: 35,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: epicChest,
  },
  legendaryChest: {
    faction: "unit",
    power: 0,
    armor: 4,
    hp: 40,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: legendaryChest,
  },
  pot: {
    faction: "unit",
    power: 0,
    armor: 0,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 40, items: [{ stat: "coin", amount: 3 }] },
      { chance: 10, items: [{ stat: "berry", amount: 3 }] },
      { chance: 10, items: [{ stat: "flower", amount: 3 }] },
      { chance: 10, items: [{ stat: "ore", amount: 2 }] },
      { chance: 10, items: [{ stat: "stick", amount: 2 }] },
      { chance: 10, items: [{ stat: "hp", amount: 1 }] },
      { chance: 10, items: [{ stat: "mp", amount: 1 }] },
    ],
    patternNames: [],
    sprite: pot,
  },
  box: {
    faction: "unit",
    power: 0,
    armor: 0,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 40, items: [{ stat: "xp", amount: 1 }] },
      {
        chance: 15,
        items: [{ stackable: "resource", material: "wood", amount: 1 }],
      },
      {
        chance: 15,
        items: [{ stackable: "resource", material: "iron", amount: 1 }],
      },
      { chance: 15, items: [{ stackable: "apple", amount: 1 }] },
      { chance: 15, items: [{ stackable: "plum", amount: 1 }] },
    ],
    patternNames: [],
    sprite: box,
  },
  cactus1: {
    faction: "unit",
    power: 2,
    armor: 1,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "spike", amount: 1 }] }],
    patternNames: [],
    sprite: cactus1,
  },
  cactus2: {
    faction: "unit",
    power: 3,
    armor: 0,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "spike", amount: 1 }] }],
    patternNames: [],
    sprite: cactus2,
  },
  rock1: {
    faction: "unit",
    power: 0,
    armor: 3,
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
    power: 3,
    armor: 2,
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
    power: 0,
    armor: 0,
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
    power: 0,
    armor: 1,
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
    power: 0,
    armor: 0,
    hp: 4,
    mp: 0,
    equipments: [
      {
        equipment: "sword",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      { chance: 70, items: [{ stat: "coin", amount: 1 }] },
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 15, items: [{ stat: "mp", amount: 1 }] },
    ],
    patternNames: ["prism"],
    sprite: prism,
  },
  goldPrism: {
    faction: "wild",
    power: 0,
    armor: 1,
    hp: 10,
    mp: 0,
    equipments: [
      {
        equipment: "sword",
        bound: true,
        amount: 2,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [
          { stat: "coin", amount: 3 },
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
    power: 0,
    armor: 0,
    hp: 1,
    mp: 0,
    equipments: [
      {
        equipment: "sword",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      { chance: 70, items: [{ stat: "coin", amount: 1 }] },
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 15, items: [{ stat: "hp", amount: 1 }] },
    ],
    patternNames: ["eye"],
    sprite: eye,
  },
  goldEye: {
    faction: "wild",
    power: 0,
    armor: 1,
    hp: 1,
    mp: 0,
    equipments: [
      {
        equipment: "sword",
        bound: true,
        amount: 5,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [
          { stat: "coin", amount: 3 },
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
    power: 0,
    armor: 0,
    hp: 2,
    mp: 1,
    equipments: [
      {
        equipment: "active",
        active: "beam1",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      { chance: 70, items: [{ stat: "coin", amount: 1 }] },
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 15, items: [{ stat: "mp", amount: 1 }] },
    ],
    patternNames: ["orb"],
    sprite: orb,
  },
  goldOrb: {
    faction: "wild",
    power: 0,
    armor: 1,
    hp: 5,
    mp: 2,
    equipments: [
      {
        equipment: "active",
        active: "beam1",
        bound: true,
        amount: 3,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [
          { stat: "coin", amount: 3 },
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
    power: 0,
    armor: 2,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [
      {
        chance: 50,
        items: [{ equipment: "shield", amount: 4, material: "gold" }],
      },
      {
        chance: 50,
        items: [{ equipment: "sword", amount: 4, material: "gold" }],
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
  const { drops, hp, mp, power, armor, patternNames, ...unitDefinition } =
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
    stats: { hp, maxHp: hp, mp, maxMp: mp, power, armor },
    patterns: patternNames.map((name) => ({ name, memory: {} })),
    ...unitDefinition,
  };
};
