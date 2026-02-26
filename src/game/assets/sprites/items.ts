import { colors } from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const heart: Sprite = {
  name: "HP",
  layers: [{ char: "\u0102", color: colors.red }],
};

export const heartUp: Sprite = {
  name: "Max HP",
  layers: [
    { char: "\u0102", color: colors.red },
    { char: "^", color: colors.lime },
  ],
};

export const mana: Sprite = {
  name: "MP",
  layers: [{ char: "\u0103", color: colors.blue }],
};

export const manaUp: Sprite = {
  name: "Max MP",
  layers: [
    { char: "\u0103", color: colors.blue },
    { char: "^", color: colors.lime },
  ],
};

export const shroom: Sprite = {
  name: "Shroom",
  layers: [
    { char: "\u0106", color: colors.maroon },
    { char: ":", color: colors.black },
    { char: ".", color: colors.silver },
  ],
};

export const appleDrop: Sprite = {
  name: "Apple",
  layers: [
    { char: "∙", color: colors.red },
    { char: ":", color: colors.lime },
    { char: ".", color: colors.black },
    { char: "\u0106", color: colors.red },
  ],
};

export const apple: Sprite = {
  name: "Apple",
  layers: [
    { char: ":", color: colors.lime },
    { char: ".", color: colors.black },
    { char: "\u0106", color: colors.red },
  ],
  amounts: {
    single: [
      { char: "┐", color: colors.maroon },
      { char: "Θ", color: colors.green },
      { char: ":", color: colors.lime },
      { char: ".", color: colors.green },
      { char: "\u0106", color: colors.red },
    ],
  },
};

export const bananaDrop: Sprite = {
  name: "Banana",
  layers: [
    { char: "«", color: colors.yellow },
    { char: "-", color: colors.black },
  ],
};

export const banana: Sprite = {
  name: "Banana",
  layers: [
    { char: "«", color: colors.yellow },
    { char: "-", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "┐", color: colors.olive },
      { char: "─", color: colors.black },
      { char: "W", color: colors.green },
      { char: "|", color: colors.green },
      { char: ".", color: colors.olive },
      { char: "«", color: colors.yellow },
      { char: "-", color: colors.green },
    ],
  },
};

export const coconutDrop: Sprite = {
  name: "Coconut",
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: "\u0106", color: colors.black },
    { char: "+", color: colors.maroon },
    { char: ":", color: colors.maroon },
  ],
};

export const coconut: Sprite = {
  name: "Coconut",
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: "\u0106", color: colors.black },
    { char: "+", color: colors.maroon },
    { char: ":", color: colors.maroon },
  ],
  amounts: {
    single: [
      { char: "T", color: colors.green },
      { char: "\u0104", color: colors.green },
      { char: "▄", color: colors.black },
      { char: '"', color: colors.green },
      { char: "┐", color: colors.olive },
      { char: "+", color: colors.olive },
      { char: "─", color: colors.black },
      { char: "∙", color: colors.olive },
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.black },
      { char: "+", color: colors.maroon },
      { char: ":", color: colors.maroon },
    ],
  },
};

export const gem: Sprite = {
  name: "Gem",
  layers: [
    { char: "+", color: colors.green },
    { char: "÷", color: colors.black },
    { char: "·", color: colors.lime },
  ],
};

export const crystal: Sprite = {
  name: "Crystal",
  layers: [
    { char: "\u0106", color: colors.teal },
    { char: "÷", color: colors.black },
    { char: "∙", color: colors.blue },
  ],
};

export const level: Sprite = {
  name: "Level",
  layers: [{ char: "#", color: colors.silver }],
};

export const xp: Sprite = {
  name: "XP",
  layers: [
    { char: "*", color: colors.lime },
    { char: "─", color: colors.black },
    { char: "·", color: colors.lime },
  ],
  amounts: {
    single: [
      { char: "*", color: colors.lime },
      { char: "─", color: colors.black },
      { char: "·", color: colors.lime },
    ],
    double: [{ char: "x", color: colors.lime }],
    multiple: [{ char: "X", color: colors.lime }],
  },
};

export const power: Sprite = {
  name: "Power",
  layers: [
    { char: "=", color: colors.green },
    { char: "|", color: colors.green },
    { char: "▀", color: colors.black },
    { char: "+", color: colors.green },
    { char: "-", color: colors.black },
    { char: "x", color: colors.lime },
    { char: "∙", color: colors.green },
    { char: "·", color: colors.lime },
  ],
};

export const wisdom: Sprite = {
  name: "Wisdom",
  layers: [
    { char: "\u0103", color: colors.lime },
    { char: "\u011c", color: colors.green },
    { char: "-", color: colors.lime },
  ],
};

export const armor: Sprite = {
  name: "Armor",
  layers: [
    { char: "\u0108", color: colors.lime },
    { char: "v", color: colors.lime },
    { char: "\u0106", color: colors.green },
    { char: "∙", color: colors.lime },
  ],
};

export const resist: Sprite = {
  name: "Resist",
  layers: [
    { char: "\u0106", color: colors.lime },
    { char: "\u0108", color: colors.lime },
    { char: "v", color: colors.lime },
    { char: "+", color: colors.green },
  ],
};

export const vision: Sprite = {
  name: "Vision",
  layers: [
    { char: "\u0108", color: colors.lime },
    { char: "\u0106", color: colors.green },
    { char: "·", color: colors.lime },
  ],
};

export const haste: Sprite = {
  name: "Haste",
  layers: [
    { char: "\u0119", color: colors.green },
    { char: "»", color: colors.lime },
  ],
};

export const damp: Sprite = {
  name: "Damp",
  layers: [
    { char: "*", color: colors.olive },
    { char: "+", color: colors.yellow },
  ],
};

export const thaw: Sprite = {
  name: "Thaw",
  layers: [
    { char: "\u0101", color: colors.teal },
    { char: "\u0100", color: colors.aqua },
    { char: "■", color: colors.teal },
    { char: "▒", color: colors.black },
  ],
};

export const spike: Sprite = {
  name: "Spike",
  layers: [
    { char: "<", color: colors.red },
    { char: ">", color: colors.maroon },
  ],
};

export const logging: Sprite = {
  name: "Logging",
  layers: [
    { char: "'", color: colors.lime },
    { char: "º", color: colors.lime },
    { char: "-", color: colors.black },
    { char: "\\", color: colors.green },
  ],
};

export const mining: Sprite = {
  name: "Mining",
  layers: [
    { char: "\u0119", color: colors.lime },
    { char: "-", color: colors.green },
  ],
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

export const nugget: Sprite = {
  name: "Nugget",
  layers: [{ char: "\u011c", color: colors.yellow }],
};

export const ingot: Sprite = {
  name: "Ingot",
  layers: [
    { char: "■", color: colors.olive },
    { char: "+", color: colors.yellow },
    { char: "\u011c", color: colors.yellow },
    { char: "Ö", color: colors.black },
  ],
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

export const leaf: Sprite = {
  name: "Leaf",
  layers: [
    { char: "+", color: colors.lime },
    { char: "\u011c", color: colors.lime },
    { char: "\u0119", color: colors.black },
    { char: "-", color: colors.green },
  ],
  amounts: {
    single: [
      { char: "+", color: colors.lime },
      { char: "\u011c", color: colors.lime },
      { char: "\u0119", color: colors.black },
      { char: "-", color: colors.green },
    ],
    double: [
      { char: "\u0103", color: colors.green },
      { char: "\u011c", color: colors.lime },
      { char: "─", color: colors.lime },
      { char: "-", color: colors.green },
    ],
    multiple: [
      { char: "\u0103", color: colors.lime },
      { char: "\u011c", color: colors.green },
      { char: "∞", color: colors.lime },
      { char: "-", color: colors.green },
    ],
  },
};

export const seed: Sprite = {
  name: "Seed",
  layers: [
    { char: ",", color: colors.maroon },
    { char: "+", color: colors.green },
    { char: "·", color: colors.lime },
  ],
};

export const berryDrop: Sprite = {
  name: "Berry",
  layers: [{ char: "'", color: colors.purple }],
  amounts: {
    single: [{ char: "'", color: colors.purple }],
    double: [{ char: '"', color: colors.purple }],
    multiple: [{ char: "°", color: colors.purple }],
  },
};

export const berry: Sprite = {
  name: "Berry",
  layers: [
    { char: "'", color: colors.purple },
    { char: "\u03c4", color: colors.olive },
  ],
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

export const fruit: Sprite = {
  name: "Fruit",
  layers: [{ char: "\u0105", color: colors.purple }],
};

export const flowerDrop: Sprite = {
  name: "Flower",
  layers: [{ char: "\u0106", color: colors.teal }],
  amounts: {
    single: [{ char: "\u0106", color: colors.teal }],
    double: [
      { char: "\u0106", color: colors.teal },
      { char: "+", color: colors.teal },
    ],
    multiple: [{ char: "*", color: colors.teal }],
  },
};

export const flower: Sprite = {
  name: "Flower",
  layers: [
    { char: ",", color: colors.olive },
    { char: "\u0106", color: colors.teal },
  ],
  amounts: {
    single: [
      { char: ",", color: colors.olive },
      { char: "\u0106", color: colors.teal },
    ],
    double: [
      { char: ",", color: colors.olive },
      { char: "\u0106", color: colors.teal },
      { char: "+", color: colors.teal },
    ],
    multiple: [
      { char: ",", color: colors.olive },
      { char: "*", color: colors.teal },
    ],
  },
};

export const herb: Sprite = {
  name: "Herb",
  layers: [
    { char: "\u010e", color: colors.teal },
    { char: "·", color: colors.teal },
  ],
};

export const oreDrop: Sprite = {
  name: "Ore",
  layers: [{ char: "∙", color: colors.silver }],
  amounts: {
    single: [{ char: "∙", color: colors.silver }],
    double: [{ char: ":", color: colors.silver }],
    multiple: [
      { char: ":", color: colors.silver },
      { char: "∙", color: colors.silver },
      { char: "\u011b", color: colors.black },
      { char: ".", color: colors.silver },
    ],
  },
};

export const ore: Sprite = {
  name: "Ore",
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

export const oreDisplay: Sprite = {
  name: "Ore",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: colors.grey },
    { char: "∙", color: colors.silver },
  ],
};

export const iron: Sprite = {
  name: "Iron",
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.silver },
    { char: "·", color: colors.grey },
  ],
};

export const gold: Sprite = {
  name: "Gold",
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.yellow },
    { char: "·", color: colors.grey },
  ],
};

export const diamond: Sprite = {
  name: "Diamond",
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.aqua },
    { char: "·", color: colors.grey },
  ],
};

export const diamondGem: Sprite = {
  name: "Diamond",
  layers: [
    { char: "\u0103", color: colors.aqua },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.aqua },
  ],
};

export const ruby: Sprite = {
  name: "Ruby",
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.fuchsia },
    { char: "·", color: colors.grey },
  ],
};

export const rubyGem: Sprite = {
  name: "Ruby",
  layers: [
    { char: "\u0103", color: colors.fuchsia },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.fuchsia },
  ],
};

export const arrow: Sprite = {
  name: "Arrow",
  layers: [
    { char: "»", color: colors.white },
    { char: "\u0119", color: colors.black },
    { char: "─", color: colors.white },
    { char: "-", color: colors.grey },
  ],
};

export const doubleArrow: Sprite = {
  name: "Arrow",
  layers: [
    { char: "»", color: colors.grey },
    { char: "─", color: colors.grey },
    { char: "-", color: colors.maroon },
  ],
};

export const charge: Sprite = {
  name: "Charge",
  layers: [
    { char: "^", color: colors.grey },
    { char: "\u011f", color: colors.white },
    { char: "\u0115", color: colors.black },
  ],
};

export const worm: Sprite = {
  name: "Worm",
  layers: [
    { char: "≈", color: colors.maroon },
    { char: "\u0115", color: colors.black },
  ],
  facing: {
    up: [
      { char: "=", color: colors.maroon },
      { char: "\u0115", color: colors.black },
    ],
    right: [
      { char: "=", color: colors.maroon },
      { char: "\u0115", color: colors.black },
    ],
    down: [
      { char: "=", color: colors.maroon },
      { char: "\u0115", color: colors.black },
    ],
    left: [
      { char: "=", color: colors.maroon },
      { char: "\u0115", color: colors.black },
    ],
  },
};

export const algae: Sprite = {
  name: "Algae",
  layers: [
    { char: "v", color: colors.green },
    { char: "|", color: colors.green },
    { char: "~", color: colors.black },
  ],
};

export const note: Sprite = {
  name: "Note",
  layers: [
    { char: "\u0115", color: colors.grey },
    { char: "\u0103", color: colors.silver },
    { char: "▀", color: colors.black },
  ],
};

export const noteRead: Sprite = {
  name: "Note",
  layers: [
    { char: "\u0115", color: colors.grey },
    { char: "\u0103", color: colors.silver },
    { char: "-", color: colors.grey },
  ],
};

export const aetherGem: Sprite = {
  name: "Aether",
  layers: [
    { char: "\u0103", color: colors.white },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.white },
  ],
};

export const voidShard: Sprite = {
  name: "Shard",
  layers: [
    { char: "+", color: colors.grey },
    { char: "\u011c", color: colors.silver },
  ],
};

export const voidGem: Sprite = {
  name: "Void",
  layers: [
    { char: "\u0103", color: colors.silver },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.silver },
  ],
};

export const rainbowShard: Sprite = {
  name: "Shard",
  layers: [
    { char: "+", color: colors.olive },
    { char: "\u011c", color: colors.yellow },
  ],
};

export const rainbowGem: Sprite = {
  name: "Rainbow",
  layers: [
    { char: "\u0103", color: colors.yellow },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.yellow },
  ],
};

export const vine: Sprite = {
  name: "Vine",
  layers: [
    { char: "\u0119", color: colors.olive },
    { char: "-", color: colors.black },
    { char: "·", color: colors.olive },
    { char: ":", color: colors.olive },
  ],
};

export const avocadoOpen: Sprite = {
  name: "Avocado",
  layers: [
    { char: "!", color: colors.green },
    { char: "|", color: colors.grey },
    { char: ":", color: colors.green },
    { char: "+", color: colors.green },
    { char: ".", color: colors.black },
    { char: "=", color: colors.green },
    { char: "\u0106", color: colors.lime },
    { char: "\u0108", color: colors.green },
  ],
};

export const avocadoSeed: Sprite = {
  name: "Avocado",
  layers: [
    { char: "!", color: colors.green },
    { char: ".", color: colors.black },
    { char: "=", color: colors.green },
    { char: "\u0106", color: colors.lime },
    { char: "\u0108", color: colors.green },
    { char: "∙", color: colors.maroon },
  ],
};

export const avocadoClosed: Sprite = {
  name: "Avocado",
  layers: [
    { char: "!", color: colors.maroon },
    { char: "|", color: colors.grey },
    { char: ":", color: colors.maroon },
    { char: ".", color: colors.black },
    { char: "=", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u0108", color: colors.maroon },
  ],
};

export const avocadoHanging: Sprite = {
  name: "Avocado",
  layers: [
    { char: "┘", color: colors.grey },
    { char: "┐", color: colors.black },
    { char: "!", color: colors.maroon },
    { char: "|", color: colors.grey },
    { char: ":", color: colors.maroon },
    { char: ".", color: colors.black },
    { char: "=", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u0108", color: colors.maroon },
  ],
};

export const lemon: Sprite = {
  name: "Lemon",
  layers: [
    { char: "`", color: colors.maroon },
    { char: "'", color: colors.green },
    { char: ":", color: colors.yellow },
    { char: "\u0106", color: colors.yellow },
    { char: "\u0108", color: colors.yellow },
    { char: ".", color: colors.yellow },
  ],
};

export const grain: Sprite = {
  name: "Grain",
  layers: [{ char: "·", color: colors.olive }],
};

export const golemHead: Sprite = {
  name: "Head",
  layers: [
    { char: "■", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "÷", color: colors.grey },
    { char: "\u0100", color: colors.black },
    { char: "∙", color: colors.grey },
    { char: ".", color: colors.grey },
  ],
};
