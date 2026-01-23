import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";

export const scout: Sprite = {
  name: "Scout",
  layers: [{ char: "\u010b", color: colors.silver }],
};

export const rogue: Sprite = {
  name: "Rogue",
  layers: [
    { char: "`", color: colors.white },
    { char: "\u010b", color: colors.silver },
  ],
};

export const rogueBackdrop: Sprite = {
  name: "Rogue",
  layers: [
    { char: "┘", color: colors.white },
    { char: "|", color: colors.black },
    { char: "-", color: colors.black },
  ],
};

export const swimmingRogue: Sprite = {
  name: "Rogue",
  layers: [
    { char: "`", color: colors.white },
    { char: "\u010b", color: colors.silver },
  ],
};

export const swimmingRogueBackdrop: Sprite = {
  name: "Rogue",
  layers: [
    { char: "┘", color: colors.white },
    { char: "|", color: colors.navy },
    { char: "-", color: colors.navy },
  ],
};

export const mage: Sprite = {
  name: "Mage",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "~", color: colors.white },
  ],
};

export const knight: Sprite = {
  name: "Knight",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "^", color: colors.white },
  ],
};

export const bandit: Sprite = {
  name: "Bandit",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "'", color: colors.white },
  ],
};

export const alien: Sprite = {
  name: "???",
  layers: [{ char: "\u010b", color: colors.silver }],
};

export const alienBackdrop: Sprite = {
  name: "???",
  layers: [
    { char: "Ä", color: colors.white },
    { char: "A", color: colors.black },

    { char: "å", color: colors.white },
    { char: "á", color: colors.black },
    { char: "'", color: colors.black },
  ],
};

export const swimmingAlienBackdrop: Sprite = {
  name: "???",
  layers: [
    { char: "Ä", color: colors.white },
    { char: "A", color: colors.navy },

    { char: "å", color: colors.white },
    { char: "á", color: colors.navy },
    { char: "'", color: colors.navy },
  ],
};

export const chief: Sprite = {
  ...bandit,
  name: "Chief",
};

export const blade: Sprite = {
  name: "Blade",
  layers: [
    { char: "+", color: colors.grey },
    { char: "-", color: colors.black },
    { char: ">", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "\u0105", color: colors.grey },
      { char: "\u0115", color: colors.black },
      { char: "+", color: colors.black },
    ],
    right: [
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: ">", color: colors.grey },
    ],
    down: [
      { char: "v", color: colors.grey },
      { char: "+", color: colors.black },
    ],
    left: [
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "<", color: colors.grey },
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
    { char: "≥", color: colors.grey },
    { char: ">", color: colors.grey },
    { char: "+", color: colors.grey },
  ],
  facing: {
    up: [
      { char: '"', color: colors.grey },
      { char: "│", color: colors.grey },
      { char: "!", color: colors.navy },
    ],
    right: [
      { char: "≥", color: colors.grey },
      { char: ">", color: colors.grey },
      { char: "+", color: colors.grey },
    ],
    down: [
      { char: '"', color: colors.grey },
      { char: "|", color: colors.grey },
      { char: "+", color: colors.navy },
    ],
    left: [
      { char: "≤", color: colors.grey },
      { char: "<", color: colors.grey },
      { char: "+", color: colors.grey },
    ],
  },
};

export const cube: Sprite = {
  name: "Cube",
  layers: [
    { char: "■", color: colors.grey },
    { char: "\u0106", color: colors.black },
    { char: "=", color: colors.grey },
    { char: "±", color: colors.grey },
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
  layers: [{ char: "\u010f", color: colors.grey }],
  facing: {
    up: [{ char: "\u011d", color: colors.grey }],
    right: [{ char: "\u010f", color: colors.grey }],
    down: [{ char: "\u011e", color: colors.grey }],
    left: [{ char: "\u0110", color: colors.grey }],
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
  layers: [{ char: "Φ", color: colors.grey }],
};

export const goldOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "Φ", color: colors.yellow }],
};

export const diamondOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "Φ", color: colors.aqua }],
};

export const fireOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "Φ", color: colors.red }],
};

export const waterOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "Φ", color: colors.blue }],
};

export const earthOrb: Sprite = {
  name: "Orb",
  layers: [{ char: "Φ", color: colors.lime }],
};

export const beamTower: Sprite = {
  name: "Tower",
  layers: [
    { char: "│", color: colors.grey },
    { char: "|", color: colors.black },
    { char: "0", color: colors.silver },
    { char: "\u0106", color: colors.black },
    { char: "∙", color: colors.grey },
  ],
};

export const fireBeamTower: Sprite = {
  name: "Tower",
  layers: [
    { char: "│", color: colors.maroon },
    { char: "|", color: colors.black },
    { char: "0", color: colors.red },
    { char: "\u0106", color: colors.black },
    { char: "∙", color: colors.maroon },
  ],
};

export const waterBeamTower: Sprite = {
  name: "Tower",
  layers: [
    { char: "│", color: colors.navy },
    { char: "|", color: colors.black },
    { char: "0", color: colors.blue },
    { char: "\u0106", color: colors.black },
    { char: "∙", color: colors.navy },
  ],
};

export const earthBeamTower: Sprite = {
  name: "Tower",
  layers: [
    { char: "│", color: colors.green },
    { char: "|", color: colors.black },
    { char: "0", color: colors.lime },
    { char: "\u0106", color: colors.black },
    { char: "∙", color: colors.green },
  ],
};

export const eye: Sprite = {
  name: "Eye",
  layers: [
    { char: "\u0108", color: colors.grey },
    { char: "\u0106", color: colors.grey },
    { char: "∙", color: colors.black },
    { char: "·", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.grey },
      { char: "\u0106", color: colors.grey },
      { char: "∙", color: colors.black },
    ],
    right: [
      { char: "\u0108", color: colors.grey },
      { char: "\u0106", color: colors.grey },
      { char: "∙", color: colors.black },
    ],
    down: [
      { char: "\u0108", color: colors.grey },
      { char: "\u0106", color: colors.grey },
      { char: "∙", color: colors.black },
    ],
    left: [
      { char: "\u0108", color: colors.grey },
      { char: "\u0106", color: colors.grey },
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
  name: "Tower",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.grey },
  ],
};

export const waveTowerCharged: Sprite = {
  name: "Tower",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.white },
  ],
};

export const goldWaveTower: Sprite = {
  name: "Tower",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.yellow },
  ],
};

export const fireWaveTower: Sprite = {
  name: "Tower",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.red },
  ],
};

export const waterWaveTower: Sprite = {
  name: "Tower",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.blue },
  ],
};

export const earthWaveTower: Sprite = {
  name: "Tower",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.lime },
  ],
};

export const spider: Sprite = {
  name: "Spider",
  layers: [
    { char: '"', color: colors.silver },
    { char: "\u010e", color: colors.silver },
    { char: "I", color: colors.black },
    { char: "+", color: colors.silver },
    { char: ":", color: colors.silver },
    { char: ".", color: colors.black },
    { char: "·", color: colors.black },
  ],
};

export const snake: Sprite = {
  name: "Snake",
  layers: [{ char: "@", color: colors.silver }],
  facing: {
    up: [
      { char: "@", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    right: [
      { char: "@", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    down: [
      { char: "@", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    left: [
      { char: "@", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
  },
};

export const fly: Sprite = {
  name: "Fly",
  layers: [
    { char: '"', color: colors.silver },
    { char: "+", color: colors.grey },
    { char: "÷", color: colors.black },
    { char: "∙", color: colors.black },
    { char: ":", color: colors.grey },
    { char: ",", color: colors.black },
  ],
};

export const fairy: Sprite = {
  name: "Fairy",
  layers: [{ char: "\u0100", color: colors.grey }],
};

export const oakBoss: Sprite = {
  name: "Oak",
  layers: [
    { char: "\u0106", color: colors.green },
    { char: "\u0107", color: colors.green },
    { char: "▄", color: colors.black },
    { char: "░", color: colors.black },
    { char: "┐", color: colors.maroon },
    { char: "-", color: colors.green },
  ],
};

export const chestBoss: Sprite = {
  name: "",
  layers: [
    { char: "■", color: colors.grey },
    { char: "+", color: colors.red },
    { char: ":", color: colors.grey },
    { char: "±", color: colors.maroon },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.maroon },
  ],
};
