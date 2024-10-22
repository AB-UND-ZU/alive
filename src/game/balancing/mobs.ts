import { Pattern } from "../../engine/components/behaviour";
import { Countable } from "../../engine/components/countable";
import { eye, goldEye, goldTriangle, triangle } from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { distribution } from "../math/std";

export type MobKey =
  | "spawnTriangle"
  | "triangle"
  | "goldTriangle"
  | "eye"
  | "goldEye";

export type MobDistribution = Partial<Record<MobKey, number>>;

export type MobDefinition = {
  damage: number;
  hp: number;
  drops: {
    chance: number;
    items: { counter: keyof Countable; amount: number }[];
  }[];
  pattern: Pattern["name"];
  sprite: Sprite;
};

export type MobStat = {
  damage: number;
  hp: number;
  items: { counter: keyof Countable; amount: number }[];
  pattern: Pattern["name"];
  sprite: Sprite;
};

const mobDefinitions: Record<MobKey, MobDefinition> = {
  spawnTriangle: {
    damage: 1,
    hp: 3,
    drops: [{ chance: 100, items: [{ counter: "gold", amount: 1 }] }],
    pattern: "triangle",
    sprite: triangle,
  },
  triangle: {
    damage: 1,
    hp: 3,
    drops: [
      { chance: 85, items: [{ counter: "gold", amount: 1 }] },
      { chance: 15, items: [{ counter: "mp", amount: 1 }] },
    ],
    pattern: "triangle",
    sprite: triangle,
  },
  goldTriangle: {
    damage: 2,
    hp: 15,
    drops: [
      {
        chance: 100,
        items: [
          { counter: "xp", amount: 1 },
          { counter: "gold", amount: 2 },
          { counter: "mp", amount: 1 },
        ],
      },
    ],
    pattern: "triangle",
    sprite: goldTriangle,
  },
  eye: {
    damage: 1,
    hp: 1,
    drops: [
      { chance: 85, items: [{ counter: "gold", amount: 1 }] },
      { chance: 15, items: [{ counter: "hp", amount: 1 }] },
    ],
    pattern: "eye",
    sprite: eye,
  },
  goldEye: {
    damage: 5,
    hp: 1,
    drops: [
      {
        chance: 100,
        items: [
          { counter: "xp", amount: 1 },
          { counter: "gold", amount: 2 },
          { counter: "hp", amount: 1 },
        ],
      },
    ],
    pattern: "eye",
    sprite: goldEye,
  },
};

export const generateMobKey = (mobDistribution: MobDistribution) => {
  const mobKeys = Object.keys(mobDistribution) as MobKey[];
  return mobKeys[distribution(...Object.values(mobDistribution))];
};

export const generateMobStat = (mobKey: MobKey): MobStat => {
  const { drops, ...mobDefinition } = mobDefinitions[mobKey];
  const items = drops.map((drop) => drop.items)[
    distribution(...drops.map((drop) => drop.chance))
  ];

  return {
    items,
    ...mobDefinition,
  };
};
