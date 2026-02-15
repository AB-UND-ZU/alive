import { Pattern } from "../../engine/components/behaviour";
import {
  bandit,
  box,
  bush,
  cactus1,
  cactus2,
  chief,
  clover,
  woodChest,
  desertRock1,
  desertRock2,
  dummy,
  diamondChest,
  fairy,
  ghost,
  hedge1,
  hedge2,
  knight,
  rubyChest,
  mage,
  oakBoss,
  plantEvaporate,
  pot,
  goldChest,
  rogue,
  rogueBackdrop,
  rose,
  swimmingRogue,
  swimmingRogueBackdrop,
  tombstone1,
  tombstone2,
  treeBurnt1,
  treeBurnt2,
  tumbleweed,
  ironChest,
  violet,
  wormBoss,
  ilex,
} from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { choice, distribution } from "../math/std";
import { Item } from "../../engine/components/item";
import { Faction } from "../../engine/components/belongable";
import { SpringConfig } from "@react-spring/three";
import { NpcType } from "../../engine/components/npc";
import {
  fence,
  fenceBurnt1,
  fenceBurnt2,
  sign,
} from "../assets/sprites/structures";
import { emptyUnitStats, UnitStats } from "../../engine/components/stats";
import { classDefinitions, ClassKey } from "./classes";
import { hairColors } from "../assets/pixels";
import { colors } from "../assets/colors";
import { Harvestable } from "../../engine/components/harvestable";
import { Droppable } from "../../engine/components/droppable";
import { Vanishable } from "../../engine/components/vanishable";
import { recolorSprite } from "../assets/templates";
import { eye, orb, prism, waveTower } from "../assets/templates/creatures";
import { evaporate } from "../assets/templates/particles";

export type UnitKey =
  | NpcType
  | "woodChest"
  | "ironChest"
  | "goldChest"
  | "diamondChest"
  | "rubyChest"
  | "oakChest"
  | "pot"
  | "box"
  | "dummy"
  | "sign"
  | "fence"
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
  dormant?: boolean;
  flying?: boolean;
  scratch: string;
  evaporate?: Droppable["evaporate"];
  harvestable?: Omit<Harvestable, "maximum">;
  stats: Partial<UnitStats>;
  equipments: Omit<Item, "carrier">[];
  drops: {
    chance: number;
    items: Omit<Item, "carrier" | "bound">[];
  }[];
  patternNames: Pattern["name"][];
  sprite: Sprite;
  backdrop?: Sprite;
  swimming?: Sprite;
  swimmingBackdrop?: Sprite;
  remainsChoices?: Sprite[];
  vanish?: Omit<Vanishable, "decayed">;
  spring?: SpringConfig;
};

export type UnitData = {
  faction: Faction;
  dormant?: boolean;
  flying: boolean;
  scratch: string;
  evaporate?: Droppable["evaporate"];
  harvestable?: Harvestable;
  stats: UnitStats;
  equipments: Omit<Item, "carrier">[];
  items: Omit<Item, "carrier">[];
  patterns: Pattern[];
  sprite: Sprite;
  backdrop?: Sprite;
  swimming?: Sprite;
  swimmingBackdrop?: Sprite;
  remains?: Sprite;
  vanish?: Omit<Vanishable, "decayed">;
  spring?: SpringConfig;
};

export type NpcData = UnitData & {
  type: NpcType;
};

const unitDefinitions: Record<UnitKey, UnitDefinition> = {
  guide: {
    faction: "nomad",
    scratch: colors.silver,
    stats: {
      hp: 30,
    },
    equipments: [
      {
        equipment: "sword",
        material: "iron",
        bound: false,
        amount: 1,
      },
      {
        equipment: "shield",
        material: "wood",
        bound: false,
        amount: 1,
      },
      {
        amount: Infinity,
        consume: "potion",
        material: "wood",
        element: "fire",
        bound: true,
      },
    ],
    drops: [{ chance: 100, items: [{ stat: "xp", amount: 5 }] }],
    patternNames: [],
    sprite: { ...chief, name: "Guide" },
    remainsChoices: [tombstone1],
    evaporate: { sprite: ghost, fast: false },
  },
  earthSmith: {
    faction: "earth",
    scratch: colors.silver,
    stats: {
      hp: 30,
    },
    equipments: [
      {
        equipment: "shield",
        material: "iron",
        amount: 1,
        bound: true,
      },
    ],
    drops: [],
    patternNames: [],
    sprite: {
      ...recolorSprite(knight, { [colors.white]: colors.lime }),
      name: "Smith",
    },
    remainsChoices: [tombstone1],
    evaporate: { sprite: ghost, fast: false },
  },
  earthTrader: {
    faction: "earth",
    scratch: colors.silver,
    stats: {
      hp: 20,
    },
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: {
      ...recolorSprite(rogue, {
        [colors.white]: colors.lime,
      }),
      name: "Trader",
    },
    swimming: recolorSprite(swimmingRogue, {
      [colors.white]: colors.lime,
    }),
    backdrop: recolorSprite(rogueBackdrop, {
      [colors.white]: colors.lime,
    }),
    swimmingBackdrop: recolorSprite(swimmingRogueBackdrop, {
      [colors.white]: colors.lime,
    }),
    remainsChoices: [tombstone1],
    evaporate: { sprite: ghost, fast: false },
  },
  earthDruid: {
    faction: "earth",
    scratch: colors.silver,
    stats: {
      hp: 20,
    },
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: {
      ...recolorSprite(mage, { [colors.white]: colors.lime }),
      name: "Druid",
    },
    remainsChoices: [tombstone1],
    evaporate: { sprite: ghost, fast: false },
  },
  earthChief: {
    faction: "earth",
    scratch: colors.silver,
    stats: {
      hp: 40,
    },
    equipments: [
      {
        equipment: "sword",
        material: "iron",
        amount: 1,
        bound: true,
      },
      {
        amount: Infinity,
        consume: "potion",
        material: "iron",
        element: "fire",
        bound: true,
      },
    ],
    drops: [],
    patternNames: [],
    sprite: {
      ...recolorSprite(bandit, { [colors.white]: colors.lime }),
      name: "Chief",
    },
    remainsChoices: [tombstone2],
    evaporate: { sprite: ghost, fast: false },
  },
  earthGuard: {
    faction: "earth",
    scratch: colors.silver,
    stats: {
      hp: 30,
    },
    equipments: [
      {
        equipment: "sword",
        material: "iron",
        amount: 1,
        bound: true,
      },
      {
        equipment: "shield",
        material: "wood",
        amount: 1,
        bound: true,
      },
      {
        amount: Infinity,
        consume: "potion",
        material: "iron",
        element: "fire",
        bound: true,
      },
    ],
    drops: [],
    patternNames: ["guard"],
    sprite: {
      ...recolorSprite(knight, { [colors.white]: colors.lime }),
      name: "Guard",
    },
    remainsChoices: [tombstone1],
    evaporate: { sprite: ghost, fast: false },
  },
  banditKnight: {
    faction: "wild",
    scratch: colors.silver,
    stats: {
      hp: 20,
    },
    equipments: [
      {
        equipment: "sword",
        material: "wood",
        amount: 1,
        bound: true,
      },
      {
        equipment: "shield",
        material: "wood",
        amount: 1,
        bound: true,
      },
    ],
    drops: [],
    patternNames: [],
    sprite: { ...bandit, name: "Bandit" },
    remainsChoices: [tombstone1],
    evaporate: { sprite: ghost, fast: false },
  },
  banditArcher: {
    faction: "wild",
    scratch: colors.silver,
    stats: {
      hp: 20,
    },
    equipments: [
      {
        equipment: "secondary",
        secondary: "bow",
        material: "wood",
        amount: 1,
        bound: true,
      },
    ],
    drops: [],
    patternNames: ["archer"],
    sprite: { ...bandit, name: "Bandit" },
    remainsChoices: [tombstone1],
    evaporate: { sprite: ghost, fast: false },
  },
  tutorialBoss: {
    faction: "wild",
    scratch: colors.silver,
    stats: {
      hp: 20,
    },
    equipments: [
      {
        equipment: "secondary",
        secondary: "bow",
        material: "wood",
        amount: 1,
        bound: true,
      },
      {
        amount: 10,
        consume: "potion",
        material: "wood",
        element: "fire",
        bound: true,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [
          { consume: "key", material: "iron", amount: 1 },
          { stat: "xp", amount: 3 },
          { stackable: "resource", material: "iron", amount: 1 },
        ],
      },
    ],
    patternNames: ["archer"],
    sprite: { ...bandit, name: "Bandit" },
    remainsChoices: [tombstone2],
    evaporate: { sprite: ghost, fast: false },
  },
  woodChest: {
    faction: "unit",
    scratch: colors.grey,
    stats: {
      hp: 15,
      armor: 1,
    },
    equipments: [],
    drops: [
      {
        chance: 35,
        items: [
          { consume: "potion", material: "wood", element: "fire", amount: 10 },
        ],
      },
      {
        chance: 35,
        items: [
          { consume: "potion", material: "wood", element: "water", amount: 10 },
        ],
      },
      {
        chance: 30,
        items: [{ stackable: "resource", material: "wood", amount: 1 }],
      },
    ],
    patternNames: [],
    sprite: woodChest,
  },
  ironChest: {
    faction: "unit",
    scratch: colors.grey,
    stats: {
      hp: 20,
      armor: 2,
    },
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: ironChest,
  },
  goldChest: {
    faction: "unit",
    scratch: colors.grey,
    stats: {
      hp: 25,
      armor: 3,
    },
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: goldChest,
  },
  diamondChest: {
    faction: "unit",
    scratch: colors.grey,
    stats: {
      hp: 30,
      armor: 4,
    },
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: diamondChest,
  },
  rubyChest: {
    faction: "unit",
    scratch: colors.grey,
    stats: {
      hp: 35,
      armor: 5,
    },
    equipments: [],
    drops: [],
    patternNames: [],
    sprite: rubyChest,
  },
  pot: {
    faction: "unit",
    scratch: colors.maroon,
    stats: {
      hp: 10,
    },
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
    scratch: colors.maroon,
    stats: {
      hp: 5,
    },
    equipments: [],
    drops: [
      { chance: 15, items: [{ stat: "xp", amount: 1 }] },
      { chance: 20, items: [{ stackable: "apple", amount: 3 }] },
      { chance: 20, items: [{ stackable: "shroom", amount: 3 }] },
      { chance: 15, items: [{ stackable: "fruit", amount: 1 }] },
      { chance: 15, items: [{ stackable: "herb", amount: 1 }] },
      { chance: 15, items: [{ stackable: "seed", amount: 1 }] },
    ],
    patternNames: [],
    sprite: box,
  },
  dummy: {
    faction: "wild",
    scratch: colors.maroon,
    stats: {
      hp: 25,
    },
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [
          { stackable: "coin", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
    ],
    patternNames: ["dummy"],
    sprite: dummy,
    remainsChoices: [treeBurnt1, treeBurnt2],
  },
  sign: {
    faction: "unit",
    scratch: colors.maroon,
    stats: {
      hp: 20,
      armor: 2,
    },
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
    remainsChoices: [treeBurnt1, treeBurnt2],
  },
  fence: {
    faction: "unit",
    scratch: colors.maroon,
    stats: {
      hp: 35,
      armor: 2,
    },
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [{ stackable: "stick", amount: 1 }],
      },
    ],
    patternNames: [],
    sprite: fence,
    remainsChoices: [fenceBurnt1, fenceBurnt2],
  },
  cactus1: {
    faction: "unit",
    scratch: colors.green,
    stats: {
      hp: 10,
      armor: 1,
      spike: 2,
    },
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "seed", amount: 1 }] }],
    patternNames: [],
    sprite: cactus1,
  },
  cactus2: {
    faction: "unit",
    scratch: colors.green,
    stats: {
      hp: 10,
      spike: 3,
    },
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "seed", amount: 1 }] }],
    patternNames: [],
    sprite: cactus2,
  },
  rock1: {
    faction: "unit",
    scratch: colors.grey,
    stats: {
      hp: 3,
      armor: 3,
    },
    equipments: [],
    drops: [
      { chance: 90, items: [{ stackable: "ore", amount: 1 }] },
      { chance: 10, items: [{ stackable: "crystal", amount: 1 }] },
    ],
    patternNames: [],
    sprite: desertRock1,
  },
  rock2: {
    faction: "unit",
    scratch: colors.grey,
    stats: {
      hp: 5,
      armor: 2,
    },
    equipments: [],
    drops: [
      { chance: 90, items: [{ stackable: "ore", amount: 1 }] },
      { chance: 10, items: [{ stackable: "gem", amount: 1 }] },
    ],
    patternNames: [],
    sprite: desertRock2,
  },
  tumbleweed: {
    faction: "unit",
    scratch: colors.maroon,
    stats: {
      hp: 5,
    },
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "stick", amount: 1 }] }],
    patternNames: ["tumbleweed"],
    sprite: tumbleweed,
  },
  hedge1: {
    faction: "unit",
    scratch: colors.green,
    stats: {
      hp: 10,
    },
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "leaf", amount: 1 }] }],
    patternNames: [],
    sprite: hedge1,
  },
  hedge2: {
    faction: "unit",
    scratch: colors.green,
    stats: {
      hp: 7,
      armor: 1,
    },
    equipments: [],
    drops: [{ chance: 100, items: [{ stackable: "leaf", amount: 1 }] }],
    patternNames: [],
    sprite: hedge2,
  },
  prism: {
    faction: "wild",
    scratch: colors.grey,
    stats: {
      hp: 8,
    },
    equipments: [
      {
        equipment: "sword",
        material: "iron",
        bound: true,
        amount: 0,
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
          { stackable: "coin", amount: 1 },
          { stat: "mp", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
    ],
    patternNames: ["prism"],
    sprite: prism.iron.default,
    evaporate: { sprite: evaporate.iron.default, fast: true },
  },
  goldPrism: {
    faction: "wild",
    scratch: colors.yellow,
    stats: {
      hp: 16,
      armor: 1,
    },
    equipments: [
      {
        equipment: "sword",
        material: "gold",
        bound: true,
        amount: 0,
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
    sprite: prism.gold.default,
    evaporate: { sprite: evaporate.gold.default, fast: true },
  },
  eye: {
    faction: "wild",
    scratch: colors.grey,
    stats: {
      hp: 1,
    },
    equipments: [
      {
        equipment: "sword",
        material: "iron",
        bound: true,
        amount: 0,
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
          { stackable: "coin", amount: 1 },
          { stat: "hp", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
    ],
    patternNames: ["eye", "chase"],
    sprite: eye.iron.default,
    evaporate: { sprite: evaporate.iron.default, fast: true },
  },
  goldEye: {
    faction: "wild",
    scratch: colors.yellow,
    stats: {
      hp: 2,
      armor: 1,
    },
    equipments: [
      {
        equipment: "sword",
        material: "gold",
        bound: true,
        amount: 0,
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
    patternNames: ["eye", "chase"],
    sprite: eye.gold.default,
    evaporate: { sprite: evaporate.gold.default, fast: true },
  },
  orb: {
    faction: "wild",
    scratch: colors.grey,
    stats: {
      hp: 5,
      mp: 1,
    },
    equipments: [
      {
        equipment: "primary",
        primary: "beam",
        material: "iron",
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
          { stackable: "coin", amount: 1 },
          { stat: "hp", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
      {
        chance: 25,
        items: [
          { stackable: "coin", amount: 1 },
          { stat: "mp", amount: 1 },
          { stat: "xp", amount: 1 },
        ],
      },
    ],
    patternNames: ["orb"],
    sprite: orb.iron.default,
    spring: { duration: 300 },
    evaporate: { sprite: evaporate.iron.default, fast: true },
  },
  goldOrb: {
    faction: "wild",
    scratch: colors.yellow,
    stats: {
      hp: 10,
      mp: 1,
      armor: 1,
    },
    equipments: [
      {
        equipment: "primary",
        primary: "beam",
        material: "gold",
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
    sprite: orb.gold.default,
    spring: { duration: 300 },
    evaporate: { sprite: evaporate.gold.default, fast: true },
  },
  diamondOrb: {
    faction: "wild",
    scratch: colors.aqua,
    stats: {
      hp: 15,
      mp: 1,
      armor: 2,
    },
    equipments: [
      {
        equipment: "primary",
        primary: "beam",
        material: "diamond",
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
    sprite: orb.diamond.default,
    spring: { duration: 300 },
    evaporate: { sprite: evaporate.diamond.default, fast: true },
  },
  fairy: {
    faction: "wild",
    scratch: colors.grey,
    stats: {
      hp: 10,
      armor: 2,
    },
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [
          {
            stackable: "resource",
            amount: 1,
            material: "wood",
            element: "air",
          },
          { stat: "xp", amount: 3 },
        ],
      },
    ],
    patternNames: ["fairy"],
    sprite: fairy,
    evaporate: { sprite: evaporate.iron.default, fast: true },
  },
  rose: {
    faction: "unit",
    scratch: colors.green,
    dormant: true,
    harvestable: { amount: 4, material: "wood", resource: "tree" },
    stats: {
      hp: 30,
      spike: 1,
      armor: -1,
    },
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [
          {
            stackable: "seed",
            amount: 1,
          },
          {
            stackable: "coin",
            amount: 2,
          },
          { stat: "xp", amount: 2 },
          {
            amount: 1,
            consume: "potion",
            material: "wood",
            element: "fire",
          },
        ],
      },
    ],
    patternNames: ["rose"],
    sprite: rose,
    remainsChoices: [bush],
  },
  violet: {
    faction: "unit",
    scratch: colors.green,
    dormant: true,
    harvestable: { amount: 4, material: "wood", resource: "tree" },
    stats: {
      hp: 30,
      mp: 1,
      armor: 0,
    },
    equipments: [
      {
        equipment: "primary",
        primary: "bolt",
        material: "iron",
        bound: true,
        amount: 1,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [
          {
            stackable: "seed",
            amount: 1,
          },
          {
            stackable: "coin",
            amount: 2,
          },
          { stat: "xp", amount: 2 },
          {
            amount: 1,
            consume: "potion",
            material: "wood",
            element: "water",
          },
        ],
      },
    ],
    patternNames: ["violet"],
    sprite: violet,
    remainsChoices: [bush],
  },
  clover: {
    faction: "unit",
    scratch: colors.green,
    dormant: true,
    harvestable: { amount: 4, material: "wood", resource: "tree" },
    stats: {
      hp: 30,
      armor: 0,
    },
    equipments: [
      {
        equipment: "sword",
        material: "wood",
        bound: true,
        amount: 0,
      },
    ],
    drops: [
      {
        chance: 50,
        items: [
          {
            stackable: "seed",
            amount: 1,
          },
          {
            stackable: "coin",
            amount: 2,
          },
          { stat: "xp", amount: 2 },
          {
            amount: 1,
            consume: "potion",
            material: "wood",
            element: "fire",
          },
        ],
      },
      {
        chance: 50,
        items: [
          {
            stackable: "seed",
            amount: 1,
          },
          {
            stackable: "coin",
            amount: 2,
          },
          { stat: "xp", amount: 2 },
          {
            amount: 1,
            consume: "potion",
            material: "wood",
            element: "water",
          },
        ],
      },
    ],
    patternNames: ["clover", "chase_slow"],
    sprite: clover,
    remainsChoices: [bush],
  },
  waveTower: {
    faction: "wild",
    scratch: colors.silver,
    stats: {
      hp: 20,
      mp: 1,
      armor: 3,
    },
    equipments: [
      {
        equipment: "primary",
        primary: "wave",
        material: "wood",
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
    sprite: waveTower.iron.default,
    evaporate: { sprite: evaporate.iron.default, fast: true },
  },
  ilexElite: {
    faction: "unit",
    scratch: colors.green,
    dormant: true,
    stats: {
      hp: 100,
      mp: 1,
      armor: 1,
    },
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [
          { stackable: "coin", amount: 5 },
          { stat: "xp", amount: 5 },
        ],
      },
    ],
    patternNames: ["ilex"],
    sprite: ilex,
    vanish: {
      spawns: [],
      remains: [],
      type: "evaporate",
      evaporate: { sprite: plantEvaporate, fast: true },
    },
    remainsChoices: [bush],
  },
  oakBoss: {
    faction: "unit",
    scratch: colors.maroon,
    dormant: true,
    stats: {
      hp: 400,
      mp: 1,
      armor: 1,
    },
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [{ stat: "xp", amount: 5 }],
      },
    ],
    patternNames: ["oak_boss"],
    sprite: oakBoss,
    vanish: {
      spawns: [{ unit: "oakChest", delta: { x: 0, y: 1 } }],
      remains: [],
      type: "plant",
      evaporate: { sprite: plantEvaporate, fast: true },
    },
  },
  oakTower: {
    faction: "wild",
    scratch: colors.silver,
    stats: {
      hp: 100,
      mp: 1,
      armor: 2,
    },
    equipments: [
      {
        equipment: "primary",
        primary: "wave",
        material: "iron",
        bound: true,
        amount: 1,
      },
    ],
    drops: [],
    patternNames: [],
    sprite: { ...waveTower.iron.default, name: "" },
    evaporate: { sprite: evaporate.iron.default, fast: true },
  },
  oakClover: {
    faction: "wild",
    scratch: colors.green,
    stats: {
      hp: 15,
      armor: 0,
    },
    equipments: [
      {
        equipment: "sword",
        element: "earth",
        bound: true,
        amount: 0,
      },
    ],
    drops: [
      {
        chance: 100,
        items: [{ stat: "hp", amount: 1 }],
      },
    ],
    patternNames: ["oak_clover"],
    sprite: clover,
  },
  oakChest: {
    faction: "unit",
    scratch: colors.grey,
    stats: {
      hp: 25,
      armor: 3,
    },
    equipments: [],
    drops: [
      {
        chance: 100,
        items: [
          {
            consume: "key",
            amount: 1,
            material: "gold",
          },
          {
            stackable: "nugget",
            amount: 1,
          },
          {
            stackable: "resource",
            amount: 1,
            material: "wood",
            element: "earth",
          },
        ],
      },
    ],
    patternNames: [],
    sprite: goldChest,
  },
  wormBoss: {
    faction: "unit",
    flying: true,
    scratch: colors.silver,
    spring: { duration: 350 },
    stats: {
      hp: 200,
      mp: 1,
      armor: 1,
    },
    equipments: [],
    drops: [],
    patternNames: ["worm_boss"],
    sprite: wormBoss,
  },
  chestBoss: {
    faction: "unit",
    scratch: colors.grey,
    dormant: true,
    stats: {
      hp: 200,
      mp: 1,
      armor: 1,
    },
    equipments: [
      {
        equipment: "sword",
        material: "ruby",
        bound: true,
        amount: 0,
      },
      {
        equipment: "primary",
        primary: "wave",
        material: "wood",
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
            amount: 1,
            material: "gold",
          },
          {
            equipment: "shield",
            amount: 1,
            material: "gold",
          },
        ],
      },
    ],
    patternNames: [],
    sprite: woodChest,
  },
};

export const generateNpcKey = (npcDistribution: NpcDistribution) => {
  const unitKeys = Object.keys(npcDistribution) as NpcType[];
  return unitKeys[distribution(...Object.values(npcDistribution))];
};

export const generateUnitData = (unitKey: UnitKey): UnitData => {
  const {
    drops,
    stats,
    patternNames,
    remainsChoices,
    harvestable,
    ...unitDefinition
  } = unitDefinitions[unitKey];
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
    stats: {
      ...emptyUnitStats,
      maxHp: stats.hp || emptyUnitStats.hp,
      maxMp: stats.mp || emptyUnitStats.mp,
      ...stats,
    },
    patterns: patternNames.map((name) => ({ name, memory: {} })),
    remains: remainsChoices ? choice(...remainsChoices) : undefined,
    harvestable: harvestable && { maximum: harvestable.amount, ...harvestable },
    flying: false,
    ...unitDefinition,
  };
};

export const generateNpcData = (npcKey: NpcType): NpcData => ({
  type: npcKey,
  ...generateUnitData(npcKey),
});

export const unitBackdrops: Partial<
  Record<UnitKey | ClassKey, Record<string, Sprite>>
> = {};
export const unitSwimmingBackdrops: Partial<
  Record<UnitKey | ClassKey, Record<string, Sprite>>
> = {};

[
  ...Object.entries(unitDefinitions),
  ...Object.entries(classDefinitions),
].forEach(([key, definition]) => {
  const unitKey = key as UnitKey | ClassKey;
  const unitBackdrop = unitBackdrops[unitKey] || {};
  const swimmingBackdrop = unitSwimmingBackdrops[unitKey] || {};

  hairColors.forEach(({ color }) => {
    if (definition.backdrop) {
      unitBackdrop[color] = recolorSprite(definition.backdrop, {
        [colors.white]: color,
      });
    }
    if (definition.swimmingBackdrop) {
      swimmingBackdrop[color] = recolorSprite(definition.swimmingBackdrop, {
        [colors.white]: color,
      });
    }

    unitBackdrops[unitKey] = unitBackdrop;
    unitSwimmingBackdrops[unitKey] = swimmingBackdrop;
  });
});
