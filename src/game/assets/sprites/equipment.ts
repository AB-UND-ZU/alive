import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const goldKey: Sprite = {
  name: "Key",
  layers: [
    { char: "\u0103", color: colors.yellow },
    { char: "\u011c", color: colors.black },
    { char: "º", color: colors.yellow },
  ],
};

export const ironKey: Sprite = {
  name: "Key",
  layers: [
    { char: "\u0103", color: colors.silver },
    { char: "\u011c", color: colors.black },
    { char: "º", color: colors.silver },
  ],
};

export const boat: Sprite = {
  name: "Boat",
  layers: [
    { char: "\u0115", color: colors.maroon },
    { char: "─", color: colors.grey },
  ],
};

export const bow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.maroon }],
};

export const hpFlask1: Sprite = {
  name: "Flask",
  layers: [
    { char: "'", color: colors.grey },
    { char: '\u0112', color: colors.black },
    { char: "°", color: colors.silver },
    { char: "\u011d", color: colors.red },
    { char: "\u011f", color: colors.silver },
  ],
};

export const hpFlask2: Sprite = {
  name: "Flask",
  layers: [
    { char: "'", color: colors.olive },
    { char: '\u0112', color: colors.black },
    { char: "°", color: colors.yellow },
    { char: "\u011d", color: colors.red },
    { char: "\u011f", color: colors.yellow },
  ],
};

export const mpFlask1: Sprite = {
  name: "Flask",
  layers: [
    { char: "'", color: colors.grey },
    { char: '\u0112', color: colors.black },
    { char: "°", color: colors.silver },
    { char: "\u011d", color: colors.blue },
    { char: "\u011f", color: colors.silver },
  ],
};

export const mpFlask2: Sprite = {
  name: "Flask",
  layers: [
    { char: "'", color: colors.olive },
    { char: '\u0112', color: colors.black },
    { char: "°", color: colors.yellow },
    { char: "\u011d", color: colors.blue },
    { char: "\u011f", color: colors.yellow },
  ],
};

export const bottle: Sprite = {
  name: "Bottle",
  layers: [
    { char: "\"", color: colors.grey },
    { char: "T", color: colors.silver },
    { char: "\u0106", color: colors.red },
    { char: "\u0108", color: colors.silver },
  ],
};

export const compass: Sprite = {
  name: "Compass",
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: "+", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0117", color: colors.grey },
    ],
    right: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0119", color: colors.grey },
    ],
    down: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0118", color: colors.grey },
    ],
    left: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u011a", color: colors.grey },
    ],
  },
};

export const woodStick: Sprite = {
  name: "Stick",
  layers: [{ char: "/", color: colors.maroon }],
  facing: {
    up: [{ char: "|", color: colors.maroon }],
    right: [{ char: "-", color: colors.maroon }],
    down: [{ char: "|", color: colors.maroon }],
    left: [{ char: "-", color: colors.maroon }],
  },
};

export const ironSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.grey }],
  facing: {
    up: [{ char: "|", color: colors.grey }],
    right: [{ char: "-", color: colors.grey }],
    down: [{ char: "|", color: colors.grey }],
    left: [{ char: "-", color: colors.grey }],
  },
};

export const fireSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.red }],
  facing: {
    up: [{ char: "|", color: colors.red }],
    right: [{ char: "-", color: colors.red }],
    down: [{ char: "|", color: colors.red }],
    left: [{ char: "-", color: colors.red }],
  },
};

export const goldSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.yellow }],
  facing: {
    up: [{ char: "|", color: colors.yellow }],
    right: [{ char: "-", color: colors.yellow }],
    down: [{ char: "|", color: colors.yellow }],
    left: [{ char: "-", color: colors.yellow }],
  },
};

export const woodArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.maroon }],
};

export const ironArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.grey }],
};

export const axe: Sprite = {
  name: "Axe",
  layers: [
    { char: "'", color: colors.grey },
    { char: "º", color: colors.grey },
    { char: "-", color: colors.black },
    { char: "\\", color: colors.maroon },
  ],
};

export const pickaxe: Sprite = {
  name: "Pickaxe",
  layers: [
    { char: "\u0119", color: colors.grey },
    { char: "-", color: colors.maroon },
  ],
};

export const hammer: Sprite = {
  name: "Hammer",
  layers: [
    { char: "┐", color: colors.maroon },
    { char: "─", color: colors.black },
    { char: "\u0115", color: colors.grey },
  ],
};

export const slash1: Sprite = {
  name: "Slash",
  layers: [
    { char: "σ", color: colors.silver },
    { char: "\u0106", color: colors.grey },
  ],
};

export const slash2: Sprite = {
  name: "Slash",
  layers: [
    { char: "@", color: colors.silver },
    { char: "\u0106", color: colors.grey },
  ],
};

export const shield1: Sprite = {
  name: "Shield",
  layers: [
    { char: "\u0106", color: colors.silver },
    { char: "\u0108", color: colors.silver },
    { char: "v", color: colors.silver },
    { char: "+", color: colors.grey },
  ],
};

export const shield2: Sprite = {
  name: "Shield",
  layers: [
    { char: '"', color: colors.silver },
    { char: "!", color: colors.silver },
    { char: "\u0106", color: colors.silver },
    { char: "\u0108", color: colors.silver },
    { char: "v", color: colors.silver },
    { char: "+", color: colors.grey },
  ],
};

export const volley1: Sprite = {
  name: "Volley",
  layers: [
    { char: "<", color: colors.silver },
    { char: "-", color: colors.grey },
  ],
};

export const volley2: Sprite = {
  name: "Volley",
  layers: [
    { char: "«", color: colors.grey },
    { char: "\u011a", color: colors.black },
    { char: "<", color: colors.silver },
    { char: "-", color: colors.silver },
  ],
};

export const cloak1: Sprite = {
  name: "Cloak",
  layers: [
    { char: "\u011d", color: colors.silver },
    { char: "▀", color: colors.black },
    { char: "-", color: colors.black },
    { char: "Ω", color: colors.grey },
  ],
};

export const cloak2: Sprite = {
  name: "Cloak",
  layers: [
    { char: "\u011d", color: colors.silver },
    { char: "▀", color: colors.black },
    { char: "-", color: colors.black },
    { char: "Ω", color: colors.grey },
    { char: "^", color: colors.grey },
    { char: "°", color: colors.silver },
  ],
};

export const amulet1: Sprite = {
  name: "Amulet",
  layers: [
    { char: "|", color: colors.grey },
    { char: "┐", color: colors.black },
    { char: "*", color: colors.silver },
    { char: "·", color: colors.grey },
  ],
};

export const amulet2: Sprite = {
  name: "Amulet",
  layers: [
    { char: '"', color: colors.grey },
    { char: "\u010e", color: colors.silver },
    { char: "·", color: colors.grey },
  ],
};

export const bomb: Sprite = {
  name: "Bomb",
  layers: [
    { char: "`", color: colors.maroon },
    { char: ":", color: colors.maroon },
    { char: "\u0108", color: colors.grey },
    { char: "\u0106", color: colors.grey },
  ],
};

export const haste: Sprite = {
  name: "Haste",
  layers: [
    { char: "»", color: colors.grey },
    { char: ">", color: colors.silver },
  ],
};

export const spell: Sprite = {
  name: "spell",
  layers: [{ char: "δ", color: colors.silver }],
};

export const fireSpell1: Sprite = {
  name: "spell_fire_1",
  layers: [{ char: "δ", color: colors.red }],
};

export const waterSpell1: Sprite = {
  name: "spell_water_1",
  layers: [{ char: "δ", color: colors.blue }],
};

export const earthSpell1: Sprite = {
  name: "spell_earth_1",
  layers: [{ char: "δ", color: colors.lime }],
};

export const fireSpell2: Sprite = {
  name: "spell_fire_2",
  layers: [{ char: "§", color: colors.red }],
};

export const waterSpell2: Sprite = {
  name: "spell_water_2",
  layers: [{ char: "§", color: colors.blue }],
};

export const earthSpell2: Sprite = {
  name: "spell_earth_2",
  layers: [{ char: "§", color: colors.lime }],
};
