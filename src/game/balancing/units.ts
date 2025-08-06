import { Pattern } from "../../engine/components/behaviour";
import {
  box,
  cactus1,
  cactus2,
  commonChest,
  desertRock1,
  desertRock2,
  epicChest,
  eye,
  fairy,
  goldEye,
  goldOrb,
  goldPrism,
  guide,
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
  scout,
  settler,
  tumbleweed,
  uncommonChest,
  waveTower,
} from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { distribution } from "../math/std";
import { Item } from "../../engine/components/item";
import { getGearStat } from "./equipment";
import { Faction } from "../../engine/components/belongable";
import { SpringConfig } from "@react-spring/three";
import { NpcType } from "../../engine/components/npc";
import { sign } from "../assets/sprites/structures";

export type UnitKey =
  | NpcType
  | "commonChest"
  | "uncommonChest"
  | "rareChest"
  | "epicChest"
  | "legendaryChest"
  | "pot"
  | "box"
  | "sign"
  | "cactus1"
  | "cactus2"
  | "rock1"
  | "rock2"
  | "tumbleweed"
  | "hedge1"
  | "hedge2";

export type NpcDistribution = Partial<Record<NpcType, number>>;

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
  spring?: SpringConfig;
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
  spring?: SpringConfig;
};

export type NpcData = UnitData & {
  type: NpcType;
};

const unitDefinitions: Record<UnitKey, UnitDefinition> = {
  guide: {
    faction: "nomad",
    power: 1,
    armor: 1,
    hp: 30,
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
      { amount: 1, equipment: "compass", bound: false },
      {
        amount: Infinity,
        consume: "potion1",
        material: "fire",
        bound: true,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [{ amount: 10, consume: "potion1", material: "fire" }],
      },
    ],
    patternNames: [],
    sprite: guide,
  },
  nomad: {
    faction: "settler",
    power: 1,
    armor: 1,
    hp: 30,
    mp: 0,
    equipments: [
      {
        equipment: "sword",
        material: "wood",
        bound: false,
        amount: getGearStat("sword", "wood"),
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
    sprite: nomad,
  },
  chief: {
    faction: "settler",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [
      {
        equipment: "sword",
        material: "iron",
        amount: getGearStat("sword", "iron"),
        bound: true,
      },
      {
        equipment: "shield",
        material: "iron",
        amount: getGearStat("shield", "iron"),
        bound: true,
      },
    ],
    drops: [],
    patternNames: [],
    sprite: { ...knight, name: "Chief" },
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
    sprite: { ...scout, name: "Elder" },
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
      {
        equipment: "shield",
        material: "iron",
        amount: getGearStat("shield", "iron"),
        bound: true,
      },
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
  mage: {
    faction: "settler",
    power: 0,
    armor: 0,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: { ...mage, name: "Mage" },
  },
  commonChest: {
    faction: "unit",
    power: 0,
    armor: 1,
    hp: 15,
    mp: 0,
    equipments: [],
    drops: [
      {
        chance: 30,
        items: [{ consume: "potion1", material: "fire", amount: 10 }],
      },
      {
        chance: 30,
        items: [{ consume: "potion1", material: "water", amount: 10 }],
      },
      {
        chance: 20,
        items: [{ stackable: "resource", material: "wood", amount: 1 }],
      },
      {
        chance: 20,
        items: [{ stackable: "resource", material: "iron", amount: 1 }],
      },
    ],
    patternNames: [],
    sprite: commonChest,
  },
  uncommonChest: {
    faction: "unit",
    power: 0,
    armor: 2,
    hp: 20,
    mp: 0,
    equipments: [],
    drops: [
      {
        chance: 20,
        items: [
          {
            equipment: "shield",
            material: "wood",
            amount: getGearStat("shield", "wood"),
          },
          { consume: "potion1", material: "fire", amount: 10 },
        ],
      },
      {
        chance: 20,
        items: [
          {
            equipment: "primary",
            primary: "beam1",
            amount: 1,
          },
          { consume: "potion1", material: "water", amount: 10 },
        ],
      },
      {
        chance: 20,
        items: [
          {
            equipment: "primary",
            primary: "wave1",
            amount: 1,
          },
          { consume: "potion1", material: "water", amount: 10 },
        ],
      },
      {
        chance: 20,
        items: [
          { equipment: "secondary", secondary: "slash", amount: 1 },
          { stackable: "charge", amount: 10 },
        ],
      },
      {
        chance: 20,
        items: [
          { equipment: "secondary", secondary: "bow", amount: 1 },
          { stackable: "arrow", amount: 10 },
        ],
      },
    ],
    patternNames: [],
    sprite: uncommonChest,
  },
  rareChest: {
    faction: "unit",
    power: 0,
    armor: 3,
    hp: 25,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: rareChest,
  },
  epicChest: {
    faction: "unit",
    power: 0,
    armor: 4,
    hp: 30,
    mp: 0,
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: epicChest,
  },
  legendaryChest: {
    faction: "unit",
    power: 0,
    armor: 5,
    hp: 35,
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
      { chance: 30, items: [{ stackable: "coin", amount: 3 }] },
      { chance: 10, items: [{ stackable: "berry", amount: 3 }] },
      { chance: 10, items: [{ stackable: "flower", amount: 3 }] },
      { chance: 10, items: [{ stackable: "leaf", amount: 3 }] },
      { chance: 10, items: [{ stackable: "ore", amount: 3 }] },
      { chance: 10, items: [{ stackable: "stick", amount: 3 }] },
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
    hp: 5,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 10, items: [{ stat: "xp", amount: 1 }] },
      { chance: 10, items: [{ stackable: "fruit", amount: 1 }] },
      { chance: 10, items: [{ stackable: "apple", amount: 3 }] },
      { chance: 10, items: [{ stackable: "shroom", amount: 3 }] },
      { chance: 10, items: [{ stackable: "gem", amount: 3 }] },
      { chance: 10, items: [{ stackable: "herb", amount: 1 }] },
      { chance: 10, items: [{ stackable: "crystal", amount: 3 }] },
      { chance: 10, items: [{ stackable: "banana", amount: 3 }] },
      { chance: 10, items: [{ stackable: "coconut", amount: 3 }] },
      { chance: 10, items: [{ stackable: "seed", amount: 1 }] },
    ],
    patternNames: [],
    sprite: box,
  },
  sign: {
    faction: "unit",
    power: 0,
    armor: 1,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [
          { stackable: "stick", amount: 1 },
          { stackable: "ore", amount: 2 },
        ],
      },
    ],
    patternNames: [],
    sprite: sign,
  },
  cactus1: {
    faction: "unit",
    power: 2,
    armor: 1,
    hp: 15,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "seed", amount: 1 }] }],
    patternNames: [],
    sprite: cactus1,
  },
  cactus2: {
    faction: "unit",
    power: 3,
    armor: 0,
    hp: 15,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "seed", amount: 1 }] }],
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
      { chance: 70, items: [{ stackable: "ore", amount: 1 }] },
      { chance: 30, items: [{ stackable: "crystal", amount: 1 }] },
    ],
    patternNames: [],
    sprite: desertRock1,
  },
  rock2: {
    faction: "unit",
    power: 0,
    armor: 2,
    hp: 5,
    mp: 0,
    equipments: [],
    drops: [
      { chance: 70, items: [{ stackable: "ore", amount: 1 }] },
      { chance: 30, items: [{ stackable: "gem", amount: 1 }] },
    ],
    patternNames: [],
    sprite: desertRock2,
  },
  tumbleweed: {
    faction: "unit",
    power: 0,
    armor: 0,
    hp: 5,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "stick", amount: 1 }] }],
    patternNames: ["tumbleweed"],
    sprite: tumbleweed,
  },
  hedge1: {
    faction: "unit",
    power: 0,
    armor: 0,
    hp: 10,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "leaf", amount: 1 }] }],
    patternNames: [],
    sprite: hedge1,
  },
  hedge2: {
    faction: "unit",
    power: 0,
    armor: 1,
    hp: 7,
    mp: 0,
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "leaf", amount: 1 }] }],
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
      {
        chance: 50,
        items: [
          { stackable: "coin", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
      {
        chance: 50,
        items: [
          { stat: "mp", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
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
          { stackable: "coin", amount: 3 },
          { stat: "xp", amount: 2 },
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
      {
        chance: 50,
        items: [
          { stackable: "coin", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
      {
        chance: 50,
        items: [
          { stat: "hp", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
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
          { stackable: "coin", amount: 3 },
          { stat: "xp", amount: 2 },
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
    hp: 3,
    mp: 1,
    equipments: [
      {
        equipment: "primary",
        primary: "beam1",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      {
        chance: 50,
        items: [
          { stackable: "coin", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
      {
        chance: 25,
        items: [
          { stat: "hp", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
      {
        chance: 25,
        items: [
          { stat: "mp", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
    ],
    patternNames: ["orb"],
    sprite: orb,
    spring: { duration: 300 },
  },
  goldOrb: {
    faction: "wild",
    power: 0,
    armor: 1,
    hp: 7,
    mp: 2,
    equipments: [
      {
        equipment: "primary",
        primary: "beam1",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      {
        chance: 50,
        items: [
          { stackable: "coin", amount: 3 },
          { stat: "hp", amount: 1 },
          { stat: "xp", amount: 2 },
        ],
      },
      {
        chance: 50,
        items: [
          { stackable: "coin", amount: 3 },
          { stat: "mp", amount: 1 },
          { stat: "xp", amount: 2 },
        ],
      },
    ],
    patternNames: ["orb"],
    sprite: goldOrb,
    spring: { duration: 300 },
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
        chance: 33,
        items: [{ stackable: "resource", amount: 1, material: "fire" }],
      },
      {
        chance: 33,
        items: [{ stackable: "resource", amount: 1, material: "water" }],
      },
      {
        chance: 33,
        items: [{ stackable: "resource", amount: 1, material: "earth" }],
      },
    ],
    patternNames: ["fairy"],
    sprite: fairy,
  },
  waveTower: {
    faction: "wild",
    power: 0,
    armor: 3,
    hp: 20,
    mp: 2,
    equipments: [
      {
        equipment: "primary",
        primary: "wave1",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [{ stackable: "resource", amount: 1, material: "iron" }],
      },
    ],
    patternNames: [],
    sprite: waveTower,
  },
  chestBoss: {
    faction: "unit",
    power: 0,
    armor: 1,
    hp: 200,
    mp: 2,
    equipments: [
      {
        equipment: "sword",
        bound: true,
        amount: 5,
      },
      {
        equipment: "primary",
        primary: "wave1",
        bound: true,
        amount: 1,
      },
      {
        equipment: "secondary",
        secondary: "slash",
        bound: true,
        amount: 1,
      },
      {
        stackable: "charge",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [
          { consume: "key", amount: 1, material: "iron" },
          { stackable: "resource", amount: 3, material: "gold" },
          {
            equipment: "sword",
            amount: getGearStat("sword", "gold"),
            material: "gold",
          },
          {
            equipment: "shield",
            amount: getGearStat("shield", "gold"),
            material: "gold",
          },
        ],
      },
    ],
    patternNames: [],
    sprite: commonChest,
  },
};

export const generateNpcKey = (npcDistribution: NpcDistribution) => {
  const unitKeys = Object.keys(npcDistribution) as NpcType[];
  return unitKeys[distribution(...Object.values(npcDistribution))];
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

export const generateNpcData = (npcKey: NpcType): NpcData => ({
  type: npcKey,
  ...generateUnitData(npcKey),
});
