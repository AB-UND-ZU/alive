import { colors } from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const boat: Sprite = {
  name: "Boat",
  layers: [
    { char: "\u0115", color: colors.maroon },
    { char: "─", color: colors.grey },
  ],
};

// active spells (no mana)

export const bombActive: Sprite = {
  name: "Bomb",
  layers: [
    { char: "`", color: colors.maroon },
    { char: ":", color: colors.maroon },
    { char: "\u0108", color: colors.grey },
    { char: "\u0106", color: colors.grey },
  ],
};

export const emptyBottle: Sprite = {
  name: "Bottle",
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: ":", color: colors.grey },
    { char: ".", color: colors.maroon },
    { char: "\u0106", color: colors.black },
  ],
};

export const emptyPotion: Sprite = {
  name: "Potion",
  layers: [
    { char: "\u011f", color: colors.silver },
    { char: "°", color: colors.grey },
  ],
};

export const emptyElixir: Sprite = {
  name: "Elixir",
  layers: [
    { char: '"', color: colors.olive },
    { char: "T", color: colors.yellow },
    { char: "\u0106", color: colors.black },
    { char: "\u0108", color: colors.yellow },
  ],
};

export const woodStickAir2: Sprite = {
  name: "Sword",
  layers: [
    { char: "/", color: colors.maroon },
    { char: "∙", color: colors.white },
  ],
  facing: {
    up: [
      { char: "|", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
    right: [
      { char: "-", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
    down: [
      { char: "|", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
    left: [
      { char: "-", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
  },
};

export const woodShieldAir2: Sprite = {
  name: "Shield",
  layers: [
    { char: "c", color: colors.white },
    { char: "S", color: colors.black },
    { char: "]", color: colors.black },
    { char: "|", color: colors.black },
    { char: "¬", color: colors.maroon },
  ],
};

export const hammer: Sprite = {
  name: "Hammer",
  layers: [
    { char: "┐", color: colors.maroon },
    { char: "─", color: colors.black },
    { char: "\u0115", color: colors.grey },
    { char: ".", color: colors.maroon },
    { char: ",", color: colors.maroon },
    { char: "∙", color: colors.maroon },
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
  layers: [
    { char: '"', color: colors.red },
    { char: 'ç', color: colors.red },
    { char: '#', color: colors.black },
    { char: "\u0101", color: colors.silver },
  ],
};

// accessories

export const woodAmuletAir2: Sprite = {
  name: "Amulet",
  layers: [
    { char: "│", color: colors.maroon },
    { char: "▐", color: colors.black },
    { char: "┐", color: colors.black },
    { char: "\u011d", color: colors.white },
    { char: "\u011e", color: colors.white },
    { char: "≡", color: colors.black },
    { char: "\u0103", color: colors.maroon },
  ],
};

export const woodRingAir2: Sprite = {
  name: "Ring",
  layers: [
    { char: "\u0117", color: colors.white },
    { char: "|", color: colors.maroon },
    { char: ".", color: colors.black },
    { char: "~", color: colors.black },
    { char: "\u0108", color: colors.maroon },
    { char: "\u0106", color: colors.black },
  ],
};

// spells

export const waveSpellWoodAir2: Sprite = {
  name: "Wave",
  layers: [
    { char: "*", color: colors.maroon },
    { char: "|", color: colors.maroon },
    { char: "+", color: colors.black },
    { char: "÷", color: colors.white },
    { char: "·", color: colors.black },
    { char: "~", color: colors.black },
  ],
};

export const trapSpellWood: Sprite = {
  name: "Trap",
  layers: [
    { char: "≡", color: colors.maroon },
    { char: "\u0103", color: colors.black },
    { char: "\u011c", color: colors.maroon },
    { char: "-", color: colors.black },
  ],
};

export const trapSpellWoodAir: Sprite = {
  name: "Trap",
  layers: [
    { char: "≡", color: colors.maroon },
    { char: "\u0103", color: colors.black },
    { char: "\u011c", color: colors.white },
    { char: "-", color: colors.black },
  ],
};
