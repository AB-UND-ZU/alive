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

// active spells (no mana)

export const bowActive: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.white }],
};

export const slashActive: Sprite = {
  name: "Slash",
  layers: [{ char: "@", color: colors.white }],
};

export const blockActive: Sprite = {
  name: "Block",
  layers: [
    { char: "0", color: colors.white },
    { char: "\u0106", color: colors.black },
    { char: "\u0108", color: colors.black },
  ],
};

export const bombActive: Sprite = {
  name: "Bomb",
  layers: [
    { char: "`", color: colors.maroon },
    { char: ":", color: colors.maroon },
    { char: "\u0108", color: colors.grey },
    { char: "\u0106", color: colors.grey },
  ],
};

export const flask1: Sprite = {
  name: "Flask",
  layers: [
    { char: "\u011f", color: colors.silver },
    { char: "°", color: colors.grey },
  ],
};

export const flask2: Sprite = {
  name: "Flask",
  layers: [
    { char: '"', color: colors.grey },
    { char: "T", color: colors.silver },
    { char: "\u0106", color: colors.black },
    { char: "\u0108", color: colors.silver },
  ],
};

export const hpFlask1: Sprite = {
  name: "Potion",
  layers: [
    { char: "\u011d", color: colors.red },
    { char: "\u011f", color: colors.silver },
    { char: "°", color: colors.grey },
  ],
};

export const hpFlask2: Sprite = {
  name: "Flask",
  layers: [
    { char: '"', color: colors.grey },
    { char: "T", color: colors.silver },
    { char: "\u0106", color: colors.red },
    { char: "\u0108", color: colors.silver },
  ],
};

export const mpFlask1: Sprite = {
  name: "Potion",
  layers: [
    { char: "\u011d", color: colors.blue },
    { char: "\u011f", color: colors.silver },
    { char: "°", color: colors.grey },
  ],
};

export const mpFlask2: Sprite = {
  name: "Flask",
  layers: [
    { char: '"', color: colors.grey },
    { char: "T", color: colors.silver },
    { char: "\u0106", color: colors.blue },
    { char: "\u0108", color: colors.silver },
  ],
};

export const compass: Sprite = {
  name: "Compass",
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "+", color: colors.grey },
    { char: "·", color: colors.silver },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
      { char: "\u0117", color: colors.grey },
      { char: "·", color: colors.silver },
    ],
    right: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
      { char: "\u0119", color: colors.grey },
      { char: "·", color: colors.silver },
    ],
    down: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
      { char: "\u0118", color: colors.grey },
      { char: "·", color: colors.silver },
    ],
    left: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
      { char: "\u011a", color: colors.grey },
      { char: "·", color: colors.silver },
    ],
  },
};

export const goldCompass: Sprite = {
  name: "Compass",
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: "+", color: colors.yellow },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0117", color: colors.yellow },
    ],
    right: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0119", color: colors.yellow },
    ],
    down: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0118", color: colors.yellow },
    ],
    left: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u011a", color: colors.yellow },
    ],
  },
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

// T1-T3

export const woodStick: Sprite = {
  name: "Sword",
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

// T4

export const diamondSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.aqua }],
  facing: {
    up: [{ char: "|", color: colors.aqua }],
    right: [{ char: "-", color: colors.aqua }],
    down: [{ char: "|", color: colors.aqua }],
    left: [{ char: "-", color: colors.aqua }],
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

export const waterSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.blue }],
  facing: {
    up: [{ char: "|", color: colors.blue }],
    right: [{ char: "-", color: colors.blue }],
    down: [{ char: "|", color: colors.blue }],
    left: [{ char: "-", color: colors.blue }],
  },
};

export const earthSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.lime }],
  facing: {
    up: [{ char: "|", color: colors.lime }],
    right: [{ char: "-", color: colors.lime }],
    down: [{ char: "|", color: colors.lime }],
    left: [{ char: "-", color: colors.lime }],
  },
};

// T5

export const rubySword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.fuchsia }],
  facing: {
    up: [{ char: "|", color: colors.fuchsia }],
    right: [{ char: "-", color: colors.fuchsia }],
    down: [{ char: "|", color: colors.fuchsia }],
    left: [{ char: "-", color: colors.fuchsia }],
  },
};

export const aetherSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.white }],
  facing: {
    up: [{ char: "|", color: colors.white }],
    right: [{ char: "-", color: colors.white }],
    down: [{ char: "|", color: colors.white }],
    left: [{ char: "-", color: colors.white }],
  },
};

export const voidSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.white }],
  facing: {
    up: [{ char: "|", color: colors.white }],
    right: [{ char: "-", color: colors.white }],
    down: [{ char: "|", color: colors.white }],
    left: [{ char: "-", color: colors.white }],
  },
};

export const rainbowSword: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: colors.white }],
  facing: {
    up: [{ char: "|", color: colors.white }],
    right: [{ char: "-", color: colors.white }],
    down: [{ char: "|", color: colors.white }],
    left: [{ char: "-", color: colors.white }],
  },
};

// T1-T3

export const woodShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.maroon }],
};

export const ironShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.grey }],
};

export const goldShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.yellow }],
};

// T4

export const diamondShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.aqua }],
};

export const fireShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.red }],
};

export const waterShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.blue }],
};

export const earthShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.lime }],
};

// T5

export const rubyShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.fuchsia }],
};

export const aetherShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.white }],
};

export const voidShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.white }],
};

export const rainbowShield: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: colors.white }],
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

export const fishingRod: Sprite = {
  name: "Rod",
  layers: [
    { char: "│", color: colors.maroon },
    { char: "┐", color: colors.black },
    { char: "'", color: colors.grey },
    { char: "|", color: colors.maroon },
    { char: "\u0106", color: colors.grey },
    { char: "∙", color: colors.maroon },
  ],
  facing: {
    up: [
      { char: "┘", color: colors.grey },
      { char: "┐", color: colors.maroon },
      { char: "\u0106", color: colors.grey },
      { char: "∙", color: colors.maroon },
    ],
    right: [
      { char: "└", color: colors.grey },
      { char: "│", color: colors.maroon },
      { char: "\u0106", color: colors.grey },
      { char: "∙", color: colors.maroon },
    ],
    down: [
      { char: "┌", color: colors.grey },
      { char: "└", color: colors.maroon },
      { char: "\u0106", color: colors.grey },
      { char: "∙", color: colors.maroon },
    ],
    left: [
      { char: "┘", color: colors.grey },
      { char: "│", color: colors.maroon },
      { char: "\u0106", color: colors.grey },
      { char: "∙", color: colors.maroon },
    ],
  },
};

export const rush1: Sprite = {
  name: "Rush",
  layers: [
    { char: "-", color: colors.grey },
    { char: ">", color: colors.silver },
  ],
};

export const rush2: Sprite = {
  name: "Rush",
  layers: [
    { char: "»", color: colors.grey },
    { char: "-", color: colors.silver },
    { char: ">", color: colors.silver },
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

// passives

export const charm: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0103", color: colors.silver },
    { char: "-", color: colors.black },
  ],
};

export const diamondCharm1: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0103", color: colors.aqua },
    { char: "-", color: colors.black },
  ],
};

export const fireCharm1: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0103", color: colors.red },
    { char: "-", color: colors.black },
  ],
};

export const waterCharm1: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0103", color: colors.blue },
    { char: "-", color: colors.black },
  ],
};

export const earthCharm1: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0103", color: colors.lime },
    { char: "-", color: colors.black },
  ],
};

export const diamondCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0117", color: colors.aqua },
    { char: "\u0118", color: colors.aqua },
    { char: "+", color: colors.black },
    { char: ":", color: colors.teal },
    { char: ".", color: colors.aqua },
    { char: "∙", color: colors.teal },
    { char: "·", color: colors.black },
  ],
};

export const fireCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0117", color: colors.red },
    { char: "\u0118", color: colors.red },
    { char: "+", color: colors.black },
    { char: ":", color: colors.maroon },
    { char: ".", color: colors.red },
    { char: "∙", color: colors.maroon },
    { char: "·", color: colors.black },
  ],
};

export const waterCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0117", color: colors.blue },
    { char: "\u0118", color: colors.blue },
    { char: "+", color: colors.black },
    { char: ":", color: colors.navy },
    { char: ".", color: colors.blue },
    { char: "∙", color: colors.navy },
    { char: "·", color: colors.black },
  ],
};

export const earthCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0117", color: colors.lime },
    { char: "\u0118", color: colors.lime },
    { char: "+", color: colors.black },
    { char: ":", color: colors.green },
    { char: ".", color: colors.lime },
    { char: "∙", color: colors.green },
    { char: "·", color: colors.black },
  ],
};

export const rubyCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0117", color: colors.fuchsia },
    { char: "\u0118", color: colors.fuchsia },
    { char: "+", color: colors.black },
    { char: ":", color: colors.purple },
    { char: ".", color: colors.fuchsia },
    { char: "∙", color: colors.purple },
    { char: "·", color: colors.black },
  ],
};

export const aetherCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0117", color: colors.white },
    { char: "\u0118", color: colors.white },
    { char: "+", color: colors.black },
    { char: ":", color: colors.silver },
    { char: ".", color: colors.white },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.black },
  ],
};

export const voidCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0117", color: colors.white },
    { char: "\u0118", color: colors.white },
    { char: "+", color: colors.black },
    { char: ":", color: colors.silver },
    { char: ".", color: colors.white },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.black },
  ],
};

export const rainbowCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u0117", color: colors.white },
    { char: "\u0118", color: colors.white },
    { char: "+", color: colors.black },
    { char: ":", color: colors.silver },
    { char: ".", color: colors.white },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.black },
  ],
};

export const pet: Sprite = {
  name: "Pet",
  layers: [{ char: "\u0101", color: colors.silver }],
};

export const diamondPet1: Sprite = {
  name: "Pet",
  layers: [{ char: "\u0101", color: colors.aqua }],
};

export const firePet1: Sprite = {
  name: "Pet",
  layers: [{ char: "\u0101", color: colors.red }],
};

export const waterPet1: Sprite = {
  name: "Pet",
  layers: [{ char: "\u0101", color: colors.blue }],
};

export const earthPet1: Sprite = {
  name: "Pet",
  layers: [{ char: "\u0101", color: colors.lime }],
};

export const diamondPet2: Sprite = {
  name: "Pet",
  layers: [
    { char: '"', color: colors.teal },
    { char: "\u0101", color: colors.aqua },
  ],
};

export const firePet2: Sprite = {
  name: "Pet",
  layers: [
    { char: '"', color: colors.maroon },
    { char: "\u0101", color: colors.red },
  ],
};

export const waterPet2: Sprite = {
  name: "Pet",
  layers: [
    { char: '"', color: colors.navy },
    { char: "\u0101", color: colors.blue },
  ],
};

export const earthPet2: Sprite = {
  name: "Pet",
  layers: [
    { char: '"', color: colors.green },
    { char: "\u0101", color: colors.lime },
  ],
};

export const rubyPet2: Sprite = {
  name: "Pet",
  layers: [
    { char: '"', color: colors.purple },
    { char: "\u0101", color: colors.fuchsia },
  ],
};

export const aetherPet2: Sprite = {
  name: "Pet",
  layers: [
    { char: '"', color: colors.silver },
    { char: "\u0101", color: colors.white },
  ],
};

export const voidPet2: Sprite = {
  name: "Pet",
  layers: [
    { char: '"', color: colors.silver },
    { char: "\u0101", color: colors.white },
  ],
};

export const rainbowPet2: Sprite = {
  name: "Pet",
  layers: [
    { char: '"', color: colors.silver },
    { char: "\u0101", color: colors.white },
  ],
};

export const ironAmulet1: Sprite = {
  name: "Amulet",
  layers: [
    { char: "|", color: colors.grey },
    { char: "┐", color: colors.black },
    { char: "*", color: colors.silver },
    { char: "·", color: colors.grey },
  ],
};

export const ironAmulet2: Sprite = {
  name: "Amulet",
  layers: [
    { char: '"', color: colors.grey },
    { char: "\u010e", color: colors.silver },
    { char: "·", color: colors.grey },
  ],
};

export const ironRing1: Sprite = {
  name: "Ring",
  layers: [
    { char: "|", color: colors.silver },
    { char: ".", color: colors.black },
    { char: "~", color: colors.black },
    { char: "\u0108", color: colors.grey },
    { char: "\u0106", color: colors.black },
  ],
};

export const ironRing2: Sprite = {
  name: "Ring",
  layers: [
    { char: "\u0117", color: colors.silver },
    { char: ".", color: colors.black },
    { char: ":", color: colors.grey },
    { char: "\u0108", color: colors.grey },
    { char: "\u0106", color: colors.black },
  ],
};

// spells

export const waveSpell: Sprite = {
  name: "Wave",
  layers: [
    { char: "±", color: colors.grey },
    { char: "■", color: colors.grey },
    { char: "\u0108", color: colors.black },
    { char: "\u0106", color: colors.silver },
    { char: "∙", color: colors.grey },
  ],
};

export const fireWave1Spell: Sprite = {
  name: "Wave",
  layers: [
    { char: "±", color: colors.maroon },
    { char: "■", color: colors.maroon },
    { char: "\u0108", color: colors.black },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.maroon },
  ],
};

export const waterWave1Spell: Sprite = {
  name: "Wave",
  layers: [
    { char: "±", color: colors.navy },
    { char: "■", color: colors.navy },
    { char: "\u0108", color: colors.black },
    { char: "\u0106", color: colors.blue },
    { char: "∙", color: colors.navy },
  ],
};

export const earthWave1Spell: Sprite = {
  name: "Wave",
  layers: [
    { char: "±", color: colors.green },
    { char: "■", color: colors.green },
    { char: "\u0108", color: colors.black },
    { char: "\u0106", color: colors.lime },
    { char: "∙", color: colors.green },
  ],
};

export const fireWave2Spell: Sprite = {
  name: "Wave",
  layers: [
    { char: "\u0100", color: colors.maroon },
    { char: "■", color: colors.black },
    { char: "I", color: colors.black },
    { char: "\u0108", color: colors.red },
    { char: "\u0106", color: colors.maroon },
  ],
};

export const waterWave2Spell: Sprite = {
  name: "Wave",
  layers: [
    { char: "\u0100", color: colors.navy },
    { char: "■", color: colors.black },
    { char: "I", color: colors.black },
    { char: "\u0108", color: colors.blue },
    { char: "\u0106", color: colors.navy },
  ],
};

export const earthWave2Spell: Sprite = {
  name: "Wave",
  layers: [
    { char: "\u0100", color: colors.green },
    { char: "■", color: colors.black },
    { char: "I", color: colors.black },
    { char: "\u0108", color: colors.lime },
    { char: "\u0106", color: colors.green },
  ],
};

export const beamSpell: Sprite = {
  name: "Beam",
  layers: [
    { char: "*", color: colors.grey },
    { char: "■", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "|", color: colors.grey },
    { char: "+", color: colors.silver },
    { char: "·", color: colors.black },
    { char: "~", color: colors.black },
  ],
};

export const fireBeam1Spell: Sprite = {
  name: "Beam",
  layers: [
    { char: "*", color: colors.maroon },
    { char: "■", color: colors.black },
    { char: "-", color: colors.maroon },
    { char: "|", color: colors.maroon },
    { char: "+", color: colors.red },
    { char: "·", color: colors.black },
    { char: "~", color: colors.black },
  ],
};

export const waterBeam1Spell: Sprite = {
  name: "Beam",
  layers: [
    { char: "*", color: colors.navy },
    { char: "■", color: colors.black },
    { char: "-", color: colors.navy },
    { char: "|", color: colors.navy },
    { char: "+", color: colors.blue },
    { char: "·", color: colors.black },
    { char: "~", color: colors.black },
  ],
};

export const earthBeam1Spell: Sprite = {
  name: "Beam",
  layers: [
    { char: "*", color: colors.green },
    { char: "■", color: colors.black },
    { char: "-", color: colors.green },
    { char: "|", color: colors.green },
    { char: "+", color: colors.lime },
    { char: "·", color: colors.black },
    { char: "~", color: colors.black },
  ],
};

export const fireBeam2Spell: Sprite = {
  name: "Beam",
  layers: [
    { char: "¬", color: colors.red },
    { char: "Γ", color: colors.black },
    { char: "|", color: colors.red },
    { char: "╬", color: colors.maroon },
  ],
};

export const waterBeam2Spell: Sprite = {
  name: "Beam",
  layers: [
    { char: "¬", color: colors.blue },
    { char: "Γ", color: colors.black },
    { char: "|", color: colors.blue },
    { char: "╬", color: colors.navy },
  ],
};

export const earthBeam2Spell: Sprite = {
  name: "Beam",
  layers: [
    { char: "¬", color: colors.lime },
    { char: "Γ", color: colors.black },
    { char: "|", color: colors.lime },
    { char: "╬", color: colors.green },
  ],
};
