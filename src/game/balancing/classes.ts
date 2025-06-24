import { hunter, knight, mage, scout } from "../assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { Active, Stackable } from "../../engine/components/item";
import { Equipment } from "../../engine/components/equippable";
import { Stats } from "../../engine/components/stats";
import { initialLevel } from "../../engine/systems/leveling";

export type ClassKey = "scout" | "knight" | "mage" | "hunter";

export type ClassDefinition = {
  sprite: Sprite;
  items: ({ slot: Equipment; active?: Active } | { stackable: Stackable })[];

  stats: Omit<Stats, "coin" | "stick" | "ore" | "flower" | "berry" | "leaf">;
};

const classDefinitions: Record<ClassKey, ClassDefinition> = {
  scout: {
    sprite: scout,
    items: [],

    stats: {
      hp: 25,
      maxHp: 25,
      maxHpCap: 50,

      mp: 0,
      maxMp: 10,
      maxMpCap: 30,

      xp: 0,
      maxXp: initialLevel.xp,
      maxXpCap: 99,

      level: 1,

      power: 1,
      magic: 0,
      armor: 0,
      haste: 0,
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
      maxMpCap: 20,

      xp: 0,
      maxXp: initialLevel.xp,
      maxXpCap: 99,

      level: 1,

      power: 0,
      magic: 0,
      armor: 1,
      haste: 0,
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
      maxMpCap: 30,

      xp: 0,
      maxXp: initialLevel.xp,
      maxXpCap: 99,

      level: 1,

      power: 0,
      magic: 1,
      armor: 0,
      haste: 0,
    },
  },
  hunter: {
    sprite: hunter,
    items: [],

    stats: {
      hp: 20,
      maxHp: 20,
      maxHpCap: 50,

      mp: 0,
      maxMp: 10,
      maxMpCap: 25,

      xp: 0,
      maxXp: initialLevel.xp,
      maxXpCap: 99,

      level: 1,

      power: 0,
      magic: 0,
      armor: 0,
      haste: 1,
    },
  },
};

export const getClassData = (classKey: ClassKey) => {
  return classDefinitions[classKey];
};
