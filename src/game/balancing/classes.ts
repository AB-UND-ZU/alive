import { hunter, knight, mage, scout } from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { Slot } from "../../engine/components/equippable";
import { Active, Stackable } from "../../engine/components/item";

export type ClassKey = "scout" | "knight" | "mage" | "hunter";

export type ClassDefinition = {
  sprite: Sprite;
  items: ({ slot: Slot; active?: Active } | { stackable: Stackable })[];

  maxHpCap: number;
  maxMpCap: number;

  stats: {
    hp: number;
    maxHp: number;

    mp: number;
    maxMp: number;

    power: number;
    magic: number;
    armor: number;
    haste: number;
  };
};

const classDefinitions: Record<ClassKey, ClassDefinition> = {
  scout: {
    sprite: scout,
    items: [],

    maxHpCap: 50,
    maxMpCap: 30,

    stats: {
      hp: 20,
      maxHp: 20,

      mp: 0,
      maxMp: 10,

      power: 0,
      magic: 0,
      armor: 0,
      haste: 0,
    },
  },
  knight: {
    sprite: knight,
    items: [],

    maxHpCap: 60,
    maxMpCap: 20,

    stats: {
      hp: 10,
      maxHp: 10,

      mp: 0,
      maxMp: 5,

      power: 0,
      magic: 0,
      armor: 1,
      haste: 0,
    },
  },
  mage: {
    sprite: mage,
    items: [],

    maxHpCap: 40,
    maxMpCap: 30,

    stats: {
      hp: 10,
      maxHp: 10,

      mp: 5,
      maxMp: 5,

      power: 0,
      magic: 1,
      armor: 0,
      haste: 0,
    },
  },
  hunter: {
    sprite: hunter,
    items: [],

    maxHpCap: 50,
    maxMpCap: 20,

    stats: {
      hp: 10,
      maxHp: 10,

      mp: 0,
      maxMp: 5,

      power: 1,
      magic: 0,
      armor: 0,
      haste: 1,
    },
  },
};

export const getClassData = (classKey: ClassKey) => {
  return classDefinitions[classKey];
};
