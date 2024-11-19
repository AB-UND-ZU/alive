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

// T1-T3

export const woodBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.maroon }],
};

export const ironBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.grey }],
};

export const goldBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.yellow }],
};

// T4

export const diamondBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.aqua }],
};

export const fireBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.red }],
};

export const waterBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.blue }],
};

export const earthBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.lime }],
};

// T5

export const rubyBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.fuchsia }],
};

export const aetherBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.white }],
};

export const voidBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.white }],
};

export const rainbowBow: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: colors.white }],
};

export const hpFlask1: Sprite = {
  name: "Flask",
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
  name: "Flask",
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

export const woodArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.maroon }],
};

export const ironArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.grey }],
};

export const goldArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.yellow }],
};

// T4

export const diamondArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.aqua }],
};

export const fireArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.red }],
};

export const waterArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.blue }],
};

export const earthArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.lime }],
};

// T5

export const rubyArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.fuchsia }],
};

export const aetherArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.white }],
};

export const voidArmor: Sprite = {
  name: "Armor",
  layers: [{ char: "¬", color: colors.white }],
};

export const rainbowArmor: Sprite = {
  name: "Armor",
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
    { char: "\u011d", color: colors.teal },
    { char: "\u011e", color: colors.teal },
    { char: "\u0103", color: colors.aqua },
    { char: "-", color: colors.black },
  ],
};

export const fireCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u011d", color: colors.maroon },
    { char: "\u011e", color: colors.maroon },
    { char: "\u0103", color: colors.red },
    { char: "-", color: colors.black },
  ],
};

export const waterCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u011d", color: colors.navy },
    { char: "\u011e", color: colors.navy },
    { char: "\u0103", color: colors.blue },
    { char: "-", color: colors.black },
  ],
};

export const earthCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u011d", color: colors.green },
    { char: "\u011e", color: colors.green },
    { char: "\u0103", color: colors.lime },
    { char: "-", color: colors.black },
  ],
};

export const rubyCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u011d", color: colors.purple },
    { char: "\u011e", color: colors.purple },
    { char: "\u0103", color: colors.fuchsia },
    { char: "-", color: colors.black },
  ],
};

export const aetherCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u011d", color: colors.silver },
    { char: "\u011e", color: colors.silver },
    { char: "\u0103", color: colors.white },
    { char: "-", color: colors.black },
  ],
};

export const voidCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u011d", color: colors.silver },
    { char: "\u011e", color: colors.silver },
    { char: "\u0103", color: colors.white },
    { char: "-", color: colors.black },
  ],
};

export const rainbowCharm2: Sprite = {
  name: "Charm",
  layers: [
    { char: "\u011d", color: colors.silver },
    { char: "\u011e", color: colors.silver },
    { char: "\u0103", color: colors.white },
    { char: "-", color: colors.black },
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

export const wave: Sprite = {
  name: "Wave",
  layers: [{ char: "δ", color: colors.silver }],
};

export const fireWave1: Sprite = {
  name: "Wave",
  layers: [{ char: "δ", color: colors.red }],
};

export const waterWave1: Sprite = {
  name: "Wave",
  layers: [{ char: "δ", color: colors.blue }],
};

export const earthWave1: Sprite = {
  name: "Wave",
  layers: [{ char: "δ", color: colors.lime }],
};

export const fireWave2: Sprite = {
  name: "Wave",
  layers: [{ char: "§", color: colors.red }],
};

export const waterWave2: Sprite = {
  name: "Wave",
  layers: [{ char: "§", color: colors.blue }],
};

export const earthWave2: Sprite = {
  name: "Wave",
  layers: [{ char: "§", color: colors.lime }],
};
