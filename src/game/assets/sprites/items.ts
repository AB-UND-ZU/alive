import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const heart: Sprite = {
  name: "Heart",
  layers: [{ char: "\u0102", color: colors.red }],
};

export const heartUp: Sprite = {
  name: "Heart",
  layers: [
    { char: "\u0102", color: colors.red },
    { char: "^", color: colors.lime },
  ],
};

export const apple1: Sprite = {
  name: "Apple",
  layers: [{ char: "∙", color: colors.red }],
  amounts: {
    single: [
      { char: "┐", color: colors.maroon },
      { char: "#", color: colors.green },
      { char: "∙", color: colors.red },
    ],
  },
};

export const apple2: Sprite = {
  name: "Apple",
  layers: [{ char: "∙", color: colors.red }],
  amounts: {
    single: [
      { char: "┐", color: colors.maroon },
      { char: "Θ", color: colors.green },
      { char: "∙", color: colors.red },
    ],
  },
};

export const mana: Sprite = {
  name: "Mana",
  layers: [{ char: "\u0103", color: colors.blue }],
};

export const manaUp: Sprite = {
  name: "Mana",
  layers: [
    { char: "\u0103", color: colors.blue },
    { char: "^", color: colors.lime },
  ],
};

export const xp: Sprite = {
  name: "XP",
  layers: [{ char: "+", color: colors.lime }],
  amounts: {
    single: [{ char: "+", color: colors.lime }],
    double: [
      { char: "-", color: colors.lime },
      { char: "|", color: colors.lime },
    ],
    multiple: [{ char: "┼", color: colors.lime }],
  },
};

export const fireEssence: Sprite = {
  name: "Fire",
  layers: [{ char: "æ", color: colors.red }],
};

export const waterEssence: Sprite = {
  name: "Water",
  layers: [{ char: "æ", color: colors.blue }],
};

export const coin: Sprite = {
  name: "Coin",
  layers: [
    { char: "\u0106", color: colors.yellow },
    { char: "∙", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "\u0106", color: colors.yellow },
      { char: "∙", color: colors.black },
    ],
    double: [{ char: "\u0108", color: colors.yellow }],
    multiple: [{ char: "o", color: colors.yellow }],
  },
};

export const stick: Sprite = {
  name: "Stick",
  layers: [{ char: "-", color: colors.maroon }],
  amounts: {
    single: [{ char: "-", color: colors.maroon }],
    double: [{ char: "=", color: colors.maroon }],
    multiple: [{ char: "≡", color: colors.maroon }],
  },
};

export const wood: Sprite = {
  name: "Wood",
  layers: [
    { char: "■", color: colors.maroon },
    { char: "▒", color: colors.black },
  ],
};

export const spike: Sprite = {
  name: "Spike",
  layers: [
    { char: "<", color: colors.green },
    { char: ">", color: colors.green },
  ],
};

export const seedDrop: Sprite = {
  name: "Seed",
  layers: [{ char: "'", color: colors.purple }],
  amounts: {
    single: [{ char: "'", color: colors.purple }],
    double: [{ char: '"', color: colors.purple }],
    multiple: [{ char: "°", color: colors.purple }],
  },
};

export const seed: Sprite = {
  name: "Seed",
  layers: [{ char: "'", color: colors.purple }],
  amounts: {
    single: [
      { char: "'", color: colors.purple },
      { char: "\u03c4", color: colors.olive },
    ],
    double: [
      { char: '"', color: colors.purple },
      { char: "\u03c4", color: colors.olive },
    ],
    multiple: [
      { char: "°", color: colors.purple },
      { char: "\u03c4", color: colors.olive },
    ],
  },
};

export const seedStack: Sprite = {
  name: "Seeds",
  layers: [
    { char: "\u011c", color: colors.purple },
    { char: "-", color: colors.black },
  ],
};

export const herbDrop: Sprite = {
  name: "Herb",
  layers: [{ char: "∙", color: colors.teal }],
  amounts: {
    single: [{ char: "∙", color: colors.teal }],
    double: [{ char: "\u0106", color: colors.teal }],
    multiple: [{ char: "*", color: colors.teal }],
  },
};

export const herb: Sprite = {
  name: "Herb",
  layers: [{ char: "∙", color: colors.teal }],
  amounts: {
    single: [
      { char: "∙", color: colors.teal },
      { char: ",", color: colors.olive },
      { char: "\u011b", color: colors.black },
    ],
    double: [
      { char: "\u0106", color: colors.teal },
      { char: ",", color: colors.olive },
      { char: "\u011b", color: colors.black },
    ],
    multiple: [
      { char: ",", color: colors.olive },
      { char: "\u011b", color: colors.black },
      { char: "*", color: colors.teal },
    ],
  },
};

export const herbStack: Sprite = {
  name: "Herbs",
  layers: [{ char: "\u010e", color: colors.teal }],
};

export const ironDrop: Sprite = {
  name: "Iron",
  layers: [{ char: "∙", color: colors.silver }],
  amounts: {
    multiple: [
      { char: ":", color: colors.silver },
      { char: "∙", color: colors.silver },
      { char: "\u011b", color: colors.black },
      { char: ".", color: colors.silver },
    ],
  },
};

export const iron: Sprite = {
  name: "iron_ore",
  layers: [{ char: "∙", color: colors.silver }],
  amounts: {
    single: [
      { char: "█", color: colors.grey },
      { char: "∙", color: colors.silver },
    ],
    double: [
      { char: "█", color: colors.grey },
      { char: ":", color: colors.silver },
    ],
    multiple: [
      { char: "█", color: colors.grey },
      { char: ":", color: colors.silver },
      { char: "∙", color: colors.silver },
      { char: "\u011b", color: colors.grey },
      { char: ".", color: colors.silver },
    ],
  },
};

export const goldOre: Sprite = {
  name: "Gold",
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.yellow },
    { char: "·", color: colors.grey },
  ],
};

export const arrow: Sprite = {
  name: "Arrow",
  layers: [
    { char: "»", color: colors.grey },
    { char: "-", color: colors.maroon },
  ],
};

export const map: Sprite = {
  name: "Map",
  layers: [
    { char: "■", color: colors.silver },
    { char: "≡", color: colors.olive },
    { char: "-", color: colors.black },
    { char: "+", color: colors.silver },
  ],
};
