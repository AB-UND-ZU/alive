import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";

// block particles

const blockSide1Template: Sprite = {
  name: "Block",
  layers: [],
  facing: {
    up: [{ char: "·", color: TEMPLATE_COLORS.materialPrimary }],
    right: [
      { char: ":", color: TEMPLATE_COLORS.materialPrimary },
      { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    ],
    down: [{ char: "·", color: TEMPLATE_COLORS.materialPrimary }],
    left: [
      { char: ":", color: TEMPLATE_COLORS.materialPrimary },
      { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
export const blockSide1 = createTemplate({ sprite: blockSide1Template });

const blockSide2Template: Sprite = {
  name: "Block",
  layers: [],
  facing: {
    up: [
      { char: "─", color: TEMPLATE_COLORS.materialPrimary },
      { char: "+", color: TEMPLATE_COLORS.transparent },
    ],
    right: [
      { char: "│", color: TEMPLATE_COLORS.materialPrimary },
      { char: "|", color: TEMPLATE_COLORS.transparent },
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    ],
    down: [
      { char: "─", color: TEMPLATE_COLORS.materialPrimary },
      { char: "+", color: TEMPLATE_COLORS.transparent },
    ],
    left: [
      { char: "│", color: TEMPLATE_COLORS.materialPrimary },
      { char: "|", color: TEMPLATE_COLORS.transparent },
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
export const blockSide2 = createTemplate({ sprite: blockSide2Template });

const blockCorner1Template: Sprite = {
  name: "Block",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
      { char: ".", color: TEMPLATE_COLORS.transparent },
    ],
    right: [
      { char: "┘", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
      { char: ":", color: TEMPLATE_COLORS.transparent },
    ],
    down: [
      { char: "└", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
      { char: ":", color: TEMPLATE_COLORS.transparent },
    ],
    left: [
      { char: "┌", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
      { char: ".", color: TEMPLATE_COLORS.transparent },
    ],
  },
};
export const blockCorner1 = createTemplate({ sprite: blockCorner1Template });

const blockCorner2Template: Sprite = {
  name: "Block",
  layers: [],
  facing: {
    up: [
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
      { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    ],
    right: [
      { char: "|", color: TEMPLATE_COLORS.materialPrimary },
      { char: ":", color: TEMPLATE_COLORS.transparent },
      { char: ".", color: TEMPLATE_COLORS.transparent },
      { char: "+", color: TEMPLATE_COLORS.transparent },
      { char: "·", color: TEMPLATE_COLORS.materialPrimary },
    ],
    down: [
      { char: "|", color: TEMPLATE_COLORS.materialPrimary },
      { char: ":", color: TEMPLATE_COLORS.transparent },
      { char: ".", color: TEMPLATE_COLORS.transparent },
      { char: "+", color: TEMPLATE_COLORS.transparent },
      { char: "·", color: TEMPLATE_COLORS.materialPrimary },
    ],
    left: [
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
      { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
export const blockCorner2 = createTemplate({ sprite: blockCorner2Template });

// wave particles

const waveSideTemplate: Sprite = {
  name: "wave_side",
  layers: [
    { char: "┼", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.transparent },
  ],
  facing: {
    up: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const waveSideElementTemplate: Sprite = {
  name: "wave_side_element",
  layers: [
    { char: "┼", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.elementPrimary },
  ],
  facing: {
    up: [
      { char: "┬", color: TEMPLATE_COLORS.elementPrimary },
      { char: "─", color: TEMPLATE_COLORS.materialPrimary },
    ],
    right: [
      { char: "┤", color: TEMPLATE_COLORS.elementPrimary },
      { char: "│", color: TEMPLATE_COLORS.materialPrimary },
    ],
    down: [
      { char: "┴", color: TEMPLATE_COLORS.elementPrimary },
      { char: "─", color: TEMPLATE_COLORS.materialPrimary },
    ],
    left: [
      { char: "├", color: TEMPLATE_COLORS.elementPrimary },
      { char: "│", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
export const waveSide = createTemplate({
  sprite: waveSideTemplate,
  materialElementSprite: waveSideElementTemplate,
});

const waveCornerTemplate: Sprite = {
  name: "wave_corner",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    right: [
      { char: "┘", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    down: [
      { char: "└", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    left: [
      { char: "┌", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
  },
};
const waveCornerElementTemplate: Sprite = {
  name: "wave_corner_element",
  layers: [],
  facing: {
    up: [
      { char: "┬", color: TEMPLATE_COLORS.elementPrimary },
      { char: "┐", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    right: [
      { char: "┴", color: TEMPLATE_COLORS.elementPrimary },
      { char: "┘", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    down: [
      { char: "┴", color: TEMPLATE_COLORS.elementPrimary },
      { char: "└", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    left: [
      { char: "┬", color: TEMPLATE_COLORS.elementPrimary },
      { char: "┌", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
  },
};
export const waveCorner = createTemplate({
  sprite: waveCornerTemplate,
  materialElementSprite: waveCornerElementTemplate,
});

// decay sprites

const evaporateTemplate: Sprite = {
  name: "evaporate",
  layers: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
};
export const evaporate = createTemplate({ sprite: evaporateTemplate });

// arrow sprites

const shotTemplate: Sprite = {
  name: "shot",
  layers: [
    { char: "\u011c", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u011a", color: TEMPLATE_COLORS.transparent },
    { char: "-", color: TEMPLATE_COLORS.materialSecondary },
  ],
  facing: {
    up: [
      { char: "\u0117", color: TEMPLATE_COLORS.materialPrimary },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    ],
    right: [
      { char: "\u011c", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u011a", color: TEMPLATE_COLORS.transparent },
      { char: "-", color: TEMPLATE_COLORS.materialSecondary },
    ],
    down: [
      { char: "\u0118", color: TEMPLATE_COLORS.materialPrimary },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    ],
    left: [
      { char: "\u011c", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0119", color: TEMPLATE_COLORS.transparent },
      { char: "-", color: TEMPLATE_COLORS.materialSecondary },
    ],
  },
};
const shotWood: Sprite = {
  name: "shot",
  layers: [
    { char: "\u011c", color: colors.maroon },
    { char: "\u011a", color: colors.black },
    { char: "-", color: colors.maroon },
  ],
  facing: {
    up: [
      { char: "\u0117", color: colors.maroon },
      { char: "|", color: colors.maroon },
    ],
    right: [
      { char: "\u011c", color: colors.maroon },
      { char: "\u011a", color: colors.black },
      { char: "-", color: colors.maroon },
    ],
    down: [
      { char: "\u0118", color: colors.maroon },
      { char: "|", color: colors.maroon },
    ],
    left: [
      { char: "\u011c", color: colors.maroon },
      { char: "\u0119", color: colors.black },
      { char: "-", color: colors.maroon },
    ],
  },
};
const shotIron: Sprite = {
  name: "shot",
  layers: [
    { char: "\u011c", color: colors.silver },
    { char: "\u011a", color: colors.black },
    { char: "-", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "\u0117", color: colors.silver },
      { char: "|", color: colors.grey },
    ],
    right: [
      { char: "\u011c", color: colors.silver },
      { char: "\u011a", color: colors.black },
      { char: "-", color: colors.grey },
    ],
    down: [
      { char: "\u0118", color: colors.silver },
      { char: "|", color: colors.grey },
    ],
    left: [
      { char: "\u011c", color: colors.silver },
      { char: "\u0119", color: colors.black },
      { char: "-", color: colors.grey },
    ],
  },
};
export const shot = createTemplate({ sprite: shotTemplate });
shot.wood.default = shotWood;
shot.iron.default = shotIron;

// slash particles

const slashSideTemplate: Sprite = {
  name: "slash_side",
  layers: [{ char: "┐", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "┘", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const slashSide = createTemplate({ sprite: slashSideTemplate });

const slashCornerTemplate: Sprite = {
  name: "slash_corner",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "┌", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "┐", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "┘", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "└", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const slashCorner = createTemplate({ sprite: slashCornerTemplate });

// homing particles

const summonTemplate: Sprite = {
  name: "summon",
  layers: [
    { char: "■", color: TEMPLATE_COLORS.materialPrimary },
    { char: "≡", color: TEMPLATE_COLORS.transparent },
    { char: "+", color: TEMPLATE_COLORS.transparent },
    { char: "÷", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.transparent },
  ],
};
export const summon = createTemplate({ sprite: summonTemplate });

const ballTemplate: Sprite = {
  name: "ball",
  layers: [
    { char: "\u0108", color: TEMPLATE_COLORS.materialSecondary },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
  ],
};
export const ball = createTemplate({ sprite: ballTemplate });

const homingTemplate: Sprite = {
  name: "homing",
  layers: [
    { char: "*", color: TEMPLATE_COLORS.materialPrimary },
    { char: "■", color: TEMPLATE_COLORS.transparent },
    { char: ":", color: TEMPLATE_COLORS.materialPrimary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
  ],
  facing: {
    up: [
      { char: ":", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    ],
    right: [
      { char: "*", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u011a", color: TEMPLATE_COLORS.transparent },
      { char: "■", color: TEMPLATE_COLORS.transparent },
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    ],
    down: [
      { char: ".", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    ],
    left: [
      { char: "\u011a", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
export const homing = createTemplate({ sprite: homingTemplate });

const discTemplate: Sprite = {
  name: "disc",
  layers: [
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
  ],
  facing: {
    up: [
      { char: ":", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    ],
    right: [
      { char: "*", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u011a", color: TEMPLATE_COLORS.transparent },
      { char: "■", color: TEMPLATE_COLORS.transparent },
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    ],
    down: [
      { char: ".", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    ],
    left: [
      { char: "\u011a", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    ],
  },
};
export const disc = createTemplate({ sprite: discTemplate });

const blastTemplate: Sprite = {
  name: "iron_blast",
  layers: [{ char: "█", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "▄", color: TEMPLATE_COLORS.materialSecondary }],
    right: [
      { char: "▌", color: TEMPLATE_COLORS.materialPrimary },
      { char: "║", color: TEMPLATE_COLORS.materialSecondary },
      { char: "│", color: TEMPLATE_COLORS.materialSecondary },
    ],
    down: [
      { char: "▀", color: TEMPLATE_COLORS.materialSecondary },
      { char: "─", color: TEMPLATE_COLORS.materialSecondary },
    ],
    left: [
      { char: "▐", color: TEMPLATE_COLORS.materialPrimary },
      { char: "║", color: TEMPLATE_COLORS.materialSecondary },
      { char: "│", color: TEMPLATE_COLORS.materialSecondary },
    ],
  },
};
export const blast = createTemplate({ sprite: blastTemplate });

// beam particles

const boltTemplate: Sprite = {
  name: "bolt",
  layers: [{ char: "∙", color: TEMPLATE_COLORS.materialPrimary }],
  amounts: {
    single: [{ char: "∙", color: TEMPLATE_COLORS.materialPrimary }],
    double: [
      { char: "\u0106", color: TEMPLATE_COLORS.materialSecondary },
      { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    ],
    multiple: [
      { char: "\u0108", color: TEMPLATE_COLORS.materialSecondary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
const boltElementTemplate: Sprite = {
  name: "bolt_element",
  layers: [{ char: "∙", color: TEMPLATE_COLORS.elementPrimary }],
  amounts: {
    single: [{ char: "∙", color: TEMPLATE_COLORS.elementPrimary }],
    double: [
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.elementPrimary },
    ],
    multiple: [
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
    ],
  },
};
const boltWood: Sprite = {
  name: "bolt",
  layers: [{ char: "∙", color: colors.maroon }],
  amounts: {
    single: [{ char: "∙", color: colors.maroon }],
    double: [
      { char: "\u0106", color: colors.maroon },
      { char: "∙", color: colors.maroon },
    ],
    multiple: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
    ],
  },
};
export const bolt = createTemplate({
  sprite: boltTemplate,
  materialElementSprite: boltElementTemplate,
});
bolt.wood.default = boltWood;

const edgeTemplate: Sprite = {
  name: "edge",
  layers: [
    { char: "┼", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.transparent },
  ],
  facing: {
    up: [
      { char: "┴", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    right: [
      { char: "├", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    down: [
      { char: "┬", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    left: [
      { char: "┤", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
  },
};
const edgeElementTemplate: Sprite = {
  name: "edge_element",
  layers: [
    { char: "┼", color: TEMPLATE_COLORS.materialPrimary },
    { char: "┼", color: TEMPLATE_COLORS.elementPrimary },
    { char: "·", color: TEMPLATE_COLORS.transparent },
  ],
  facing: {
    up: [
      { char: "┴", color: TEMPLATE_COLORS.elementPrimary },
      { char: "─", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    right: [
      { char: "├", color: TEMPLATE_COLORS.elementPrimary },
      { char: "│", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    down: [
      { char: "┬", color: TEMPLATE_COLORS.elementPrimary },
      { char: "─", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
    left: [
      { char: "┤", color: TEMPLATE_COLORS.elementPrimary },
      { char: "│", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.transparent },
    ],
  },
};
export const edge = createTemplate({
  sprite: edgeTemplate,
  materialElementSprite: edgeElementTemplate,
});
