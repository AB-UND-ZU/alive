import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const scout: Sprite = {
  name: "Scout",
  layers: [{ char: "\u010b", color: colors.silver }],
};

export const hunter: Sprite = {
  name: "Hunter",
  layers: [
    { char: "│", color: colors.olive },
    { char: "|", color: colors.black },
    { char: "┐", color: colors.black },
    { char: "`", color: colors.olive },
    { char: "\u010b", color: colors.silver },
  ],
};

export const mage: Sprite = {
  name: "Mage",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "~", color: colors.olive },
  ],
};

export const knight: Sprite = {
  name: "Knight",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "^", color: colors.olive },
  ],
};

export const villager: Sprite = {
  name: "Nomad",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "'", color: colors.white },
  ],
};

export const blade: Sprite = {
  name: "Blade",
  layers: [
    { char: "+", color: colors.silver },
    { char: "-", color: colors.black },
    { char: ">", color: colors.silver },
  ],
  facing: {
    up: [
      { char: "\u0105", color: colors.silver },
      { char: "\u0115", color: colors.black },
      { char: "+", color: colors.black },
    ],
    right: [
      { char: "+", color: colors.silver },
      { char: "-", color: colors.black },
      { char: ">", color: colors.silver },
    ],
    down: [
      { char: "v", color: colors.silver },
      { char: "+", color: colors.black },
    ],
    left: [
      { char: "+", color: colors.silver },
      { char: "-", color: colors.black },
      { char: "<", color: colors.silver },
    ],
  },
};

export const fish: Sprite = {
  name: "Fish",
  layers: [
    { char: "\u0106", color: colors.blue },
    { char: "\u0119", color: colors.blue },
    { char: "∞", color: colors.blue },
  ],
};

export const shark: Sprite = {
  name: "Shark",
  layers: [
    { char: "≥", color: colors.silver },
    { char: ">", color: colors.silver },
    { char: "+", color: colors.silver },
  ],
  facing: {
    up: [
      { char: '"', color: colors.silver },
      { char: "│", color: colors.silver },
      { char: "!", color: colors.navy },
    ],
    right: [
      { char: "≥", color: colors.silver },
      { char: ">", color: colors.silver },
      { char: "+", color: colors.silver },
    ],
    down: [
      { char: '"', color: colors.silver },
      { char: "|", color: colors.silver },
      { char: "+", color: colors.navy },
    ],
    left: [
      { char: "≤", color: colors.silver },
      { char: "<", color: colors.silver },
      { char: "+", color: colors.silver },
    ],
  },
};

export const cube: Sprite = {
  name: "Cube",
  layers: [
    { char: "■", color: colors.silver },
    { char: "\u0106", color: colors.black },
    { char: "=", color: colors.silver },
    { char: "±", color: colors.silver },
  ],
};

export const goldCube: Sprite = {
  name: "Cube",
  layers: [
    { char: "■", color: colors.yellow },
    { char: "\u0106", color: colors.black },
    { char: "=", color: colors.yellow },
    { char: "±", color: colors.yellow },
  ],
};

export const fireCube: Sprite = {
  name: "Cube",
  layers: [
    { char: "■", color: colors.red },
    { char: "\u0106", color: colors.black },
    { char: "=", color: colors.red },
    { char: "±", color: colors.red },
  ],
};

export const waterCube: Sprite = {
  name: "Cube",
  layers: [
    { char: "■", color: colors.blue },
    { char: "\u0106", color: colors.black },
    { char: "=", color: colors.blue },
    { char: "±", color: colors.blue },
  ],
};

export const earthCube: Sprite = {
  name: "Cube",
  layers: [
    { char: "■", color: colors.lime },
    { char: "\u0106", color: colors.black },
    { char: "=", color: colors.lime },
    { char: "±", color: colors.lime },
  ],
};

export const prism: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.silver }],
  facing: {
    up: [{ char: "\u011d", color: colors.silver }],
    right: [{ char: "\u010f", color: colors.silver }],
    down: [{ char: "\u011e", color: colors.silver }],
    left: [{ char: "\u0110", color: colors.silver }],
  },
};

export const goldPrism: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.yellow }],
  facing: {
    up: [{ char: "\u011d", color: colors.yellow }],
    right: [{ char: "\u010f", color: colors.yellow }],
    down: [{ char: "\u011e", color: colors.yellow }],
    left: [{ char: "\u0110", color: colors.yellow }],
  },
};

export const waterPrism: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.blue }],
  facing: {
    up: [{ char: "\u011d", color: colors.blue }],
    right: [{ char: "\u010f", color: colors.blue }],
    down: [{ char: "\u011e", color: colors.blue }],
    left: [{ char: "\u0110", color: colors.blue }],
  },
};

export const firePrism: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.red }],
  facing: {
    up: [{ char: "\u011d", color: colors.red }],
    right: [{ char: "\u010f", color: colors.red }],
    down: [{ char: "\u011e", color: colors.red }],
    left: [{ char: "\u0110", color: colors.red }],
  },
};

export const orb: Sprite = {
  name: "Orb",
  layers: [{ char: "0", color: colors.silver }],
};

export const goldOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "0", color: colors.yellow }],
};

export const fireOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "0", color: colors.red }],
};

export const waterOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "0", color: colors.blue }],
};

export const earthOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "0", color: colors.lime }],
};

export const boltTower: Sprite = {
  name: "Tower",
  layers: [{ char: "Φ", color: colors.silver }],
};

export const goldBoltTower: Sprite = {
  name: "Tower",
  layers: [{ char: "Φ", color: colors.yellow }],
};

export const fireBoltTower: Sprite = {
  name: "Tower",
  layers: [{ char: "Φ", color: colors.red }],
};

export const waterBoltTower: Sprite = {
  name: "Tower",
  layers: [{ char: "Φ", color: colors.blue }],
};

export const earthBoltTower: Sprite = {
  name: "Tower",
  layers: [{ char: "Φ", color: colors.lime }],
};

export const eye: Sprite = {
  name: "Eye",
  layers: [
    { char: "\u0108", color: colors.silver },
    { char: "\u0106", color: colors.silver },
    { char: "∙", color: colors.black },
    { char: "·", color: colors.silver },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.silver },
      { char: "\u0106", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    right: [
      { char: "\u0108", color: colors.silver },
      { char: "\u0106", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    down: [
      { char: "\u0108", color: colors.silver },
      { char: "\u0106", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    left: [
      { char: "\u0108", color: colors.silver },
      { char: "\u0106", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
  },
};

export const goldEye: Sprite = {
  name: "Eye",
  layers: [
    { char: "\u0108", color: colors.yellow },
    { char: "\u0106", color: colors.yellow },
    { char: "∙", color: colors.black },
    { char: "·", color: colors.yellow },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.yellow },
      { char: "\u0106", color: colors.yellow },
      { char: "∙", color: colors.black },
    ],
    right: [
      { char: "\u0108", color: colors.yellow },
      { char: "\u0106", color: colors.yellow },
      { char: "∙", color: colors.black },
    ],
    down: [
      { char: "\u0108", color: colors.yellow },
      { char: "\u0106", color: colors.yellow },
      { char: "∙", color: colors.black },
    ],
    left: [
      { char: "\u0108", color: colors.yellow },
      { char: "\u0106", color: colors.yellow },
      { char: "∙", color: colors.black },
    ],
  },
};

export const fireEye: Sprite = {
  name: "Eye",
  layers: [
    { char: "\u0108", color: colors.red },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.black },
    { char: "·", color: colors.red },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.red },
      { char: "\u0106", color: colors.red },
      { char: "∙", color: colors.black },
    ],
    right: [
      { char: "\u0108", color: colors.red },
      { char: "\u0106", color: colors.red },
      { char: "∙", color: colors.black },
    ],
    down: [
      { char: "\u0108", color: colors.red },
      { char: "\u0106", color: colors.red },
      { char: "∙", color: colors.black },
    ],
    left: [
      { char: "\u0108", color: colors.red },
      { char: "\u0106", color: colors.red },
      { char: "∙", color: colors.black },
    ],
  },
};

export const waterEye: Sprite = {
  name: "Eye",
  layers: [
    { char: "\u0108", color: colors.blue },
    { char: "\u0106", color: colors.blue },
    { char: "∙", color: colors.black },
    { char: "·", color: colors.blue },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.blue },
      { char: "\u0106", color: colors.blue },
      { char: "∙", color: colors.black },
    ],
    right: [
      { char: "\u0108", color: colors.blue },
      { char: "\u0106", color: colors.blue },
      { char: "∙", color: colors.black },
    ],
    down: [
      { char: "\u0108", color: colors.blue },
      { char: "\u0106", color: colors.blue },
      { char: "∙", color: colors.black },
    ],
    left: [
      { char: "\u0108", color: colors.blue },
      { char: "\u0106", color: colors.blue },
      { char: "∙", color: colors.black },
    ],
  },
};

export const earthEye: Sprite = {
  name: "Eye",
  layers: [
    { char: "\u0108", color: colors.lime },
    { char: "\u0106", color: colors.lime },
    { char: "∙", color: colors.black },
    { char: "·", color: colors.lime },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.lime },
      { char: "\u0106", color: colors.lime },
      { char: "∙", color: colors.black },
    ],
    right: [
      { char: "\u0108", color: colors.lime },
      { char: "\u0106", color: colors.lime },
      { char: "∙", color: colors.black },
    ],
    down: [
      { char: "\u0108", color: colors.lime },
      { char: "\u0106", color: colors.lime },
      { char: "∙", color: colors.black },
    ],
    left: [
      { char: "\u0108", color: colors.lime },
      { char: "\u0106", color: colors.lime },
      { char: "∙", color: colors.black },
    ],
  },
};

export const ghost: Sprite = {
  name: "Soul",
  layers: [
    // 50% of silver
    { char: "\u010b", color: "#606060" },
    { char: "°", color: colors.yellow },
  ],
};

export const halo: Sprite = {
  name: "Soul",
  layers: [{ char: "°", color: colors.yellow }],
};

export const waveTower: Sprite = {
  name: "tower_wave",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.grey },
  ],
};

export const goldWaveTower: Sprite = {
  name: "tower_wave",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.yellow },
  ],
};

export const fireWaveTower: Sprite = {
  name: "tower_wave",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.red },
  ],
};

export const waterWaveTower: Sprite = {
  name: "tower_wave",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.blue },
  ],
};

export const earthWaveTower: Sprite = {
  name: "tower_wave",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.lime },
  ],
};

export const fly: Sprite = {
  name: "Fly",
  layers: [
    { char: '"', color: colors.silver },
    { char: ":", color: colors.grey },
    { char: ",", color: colors.black },
  ],
};

export const fairy: Sprite = {
  name: "Fairy",
  layers: [{ char: "\u0100", color: colors.silver }],
};
