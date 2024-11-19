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

    attack: number;
    intellect: number;
    defense: number;
    speed: number;
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

      attack: 0,
      intellect: 0,
      defense: 0,
      speed: 0,
    },
  },
  knight: {
    sprite: knight,
    items: [{ slot: "armor" }],

    maxHpCap: 60,
    maxMpCap: 20,

    stats: {
      hp: 10,
      maxHp: 10,

      mp: 0,
      maxMp: 5,

      attack: 0,
      intellect: 0,
      defense: 2,
      speed: 0,
    },
  },
  mage: {
    sprite: mage,
    items: [{ slot: "active", active: "wave1" }],

    maxHpCap: 40,
    maxMpCap: 30,

    stats: {
      hp: 10,
      maxHp: 10,

      mp: 5,
      maxMp: 5,

      attack: 0,
      intellect: 2,
      defense: 0,
      speed: 0,
    },
  },
  hunter: {
    sprite: hunter,
    items: [{ slot: "bow" }, { stackable: "arrow" }],

    maxHpCap: 50,
    maxMpCap: 20,

    stats: {
      hp: 10,
      maxHp: 10,

      mp: 0,
      maxMp: 5,

      attack: 1,
      intellect: 0,
      defense: 0,
      speed: 1,
    },
  },
};

export const getClassData = (classKey: ClassKey) => {
  return classDefinitions[classKey];
};
