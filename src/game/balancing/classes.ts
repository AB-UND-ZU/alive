import { rogue, knight, mage, swimmingRogue, alien } from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { Stackable } from "../../engine/components/item";
import { Equipment } from "../../engine/components/equippable";
import { UnitStats } from "../../engine/components/stats";
import { initialLevel } from "../../engine/systems/leveling";

export const classes = ["rogue", "knight", "mage", '???'] as const;

export type ClassKey = (typeof classes)[number];

export type ClassDefinition = {
  sprite: Sprite;
  swimming?: Sprite;
  items: ({ slot: Equipment } | { stackable: Stackable })[];

  stats: UnitStats;
};

const classDefinitions: Record<ClassKey, ClassDefinition> = {
  rogue: {
    sprite: rogue,
    swimming: swimmingRogue,
    items: [],

    stats: {
      hp: 25,
      maxHp: 25,
      maxHpCap: 50,

      mp: 0,
      maxMp: 10,
      maxMpCap: 25,

      xp: 0,
      maxXp: initialLevel.xp,
      maxXpCap: 99,

      level: 1,

      power: 1,
      wisdom: 0,
      armor: 0,
      resist: 0,
      haste: 1,
      vision: 0,
      damp: 0,
      thaw: 0,
      spike: 0,
    },
  },
  knight: {
    sprite: knight,
    items: [],

    stats: {
      hp: 30,
      maxHp: 30,
      maxHpCap: 60,

      mp: 0,
      maxMp: 5,
      maxMpCap: 15,

      xp: 0,
      maxXp: initialLevel.xp,
      maxXpCap: 99,

      level: 1,

      power: 0,
      wisdom: 0,
      armor: 1,
      resist: 1,
      haste: 0,
      vision: 0,
      damp: 0,
      thaw: 0,
      spike: 0,
    },
  },
  mage: {
    sprite: mage,
    items: [],

    stats: {
      hp: 20,
      maxHp: 20,
      maxHpCap: 40,

      mp: 0,
      maxMp: 15,
      maxMpCap: 35,

      xp: 0,
      maxXp: initialLevel.xp,
      maxXpCap: 99,

      level: 1,

      power: 0,
      wisdom: 1,
      armor: 0,
      resist: 0,
      haste: 0,
      vision: 1,
      damp: 0,
      thaw: 0,
      spike: 0,
    },
  },
  '???': {
    sprite: alien,
    items: [],

    stats: {
      hp: 15,
      maxHp: 15,
      maxHpCap: 75,

      mp: 0,
      maxMp: 0,
      maxMpCap: 0,

      xp: 0,
      maxXp: initialLevel.xp,
      maxXpCap: 99,

      level: 1,

      power: 0,
      wisdom: 0,
      armor: 0,
      resist: 0,
      haste: 0,
      vision: 0,
      damp: 2,
      thaw: 4,
      spike: 1,
    },
  },
};

export const getClassData = (classKey: ClassKey) => {
  const { stats, ...definition } = classDefinitions[classKey];

  return {
    ...definition,
    stats: { ...stats },
  };
};
