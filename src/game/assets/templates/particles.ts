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

const waveSideDoubleTemplate: Sprite = {
  name: "wave_side_double",
  layers: [{ char: "╬", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const waveSideDoubleElementTemplate: Sprite = {
  name: "wave_side_double_element",
  layers: [{ char: "╬", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [
      { char: "╦", color: TEMPLATE_COLORS.elementPrimary },
      { char: "═", color: TEMPLATE_COLORS.materialPrimary },
    ],
    right: [
      { char: "╣", color: TEMPLATE_COLORS.elementPrimary },
      { char: "║", color: TEMPLATE_COLORS.materialPrimary },
    ],
    down: [
      { char: "╩", color: TEMPLATE_COLORS.elementPrimary },
      { char: "═", color: TEMPLATE_COLORS.materialPrimary },
    ],
    left: [
      { char: "╠", color: TEMPLATE_COLORS.elementPrimary },
      { char: "║", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
export const waveSideDouble = createTemplate({
  sprite: waveSideDoubleTemplate,
  materialElementSprite: waveSideDoubleElementTemplate,
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

const waveCornerDoubleTemplate: Sprite = {
  name: "wave_corner_double",
  layers: [],
  facing: {
    up: [{ char: "╗", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "╝", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "╚", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "╔", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const waveCornerDoubleElementTemplate: Sprite = {
  name: "wave_corner_double_element",
  layers: [],
  facing: {
    up: [
      { char: "╦", color: TEMPLATE_COLORS.elementPrimary },
      { char: "╗", color: TEMPLATE_COLORS.materialPrimary },
    ],
    right: [
      { char: "╩", color: TEMPLATE_COLORS.elementPrimary },
      { char: "╝", color: TEMPLATE_COLORS.materialPrimary },
    ],
    down: [
      { char: "╩", color: TEMPLATE_COLORS.elementPrimary },
      { char: "╚", color: TEMPLATE_COLORS.materialPrimary },
    ],
    left: [
      { char: "╦", color: TEMPLATE_COLORS.elementPrimary },
      { char: "╔", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
export const waveCornerDouble = createTemplate({
  sprite: waveCornerDoubleTemplate,
  materialElementSprite: waveCornerDoubleElementTemplate,
});

const triggerTemplate: Sprite = {
  name: "spell_trigger",
  layers: [
    { char: "\\", color: TEMPLATE_COLORS.materialPrimary },
    { char: "/", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▒", color: TEMPLATE_COLORS.transparent },
  ],
};
const triggerElementTemplate: Sprite = {
  name: "spell_trigger_element",
  layers: [
    { char: "\\", color: TEMPLATE_COLORS.elementPrimary },
    { char: "/", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▒", color: TEMPLATE_COLORS.transparent },
  ],
};
export const trigger = createTemplate({
  sprite: triggerTemplate,
  materialElementSprite: triggerElementTemplate,
});

const windSideTemplate: Sprite = {
  name: "wind_side",
  layers: [{ char: "~", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const windSideElementTemplate: Sprite = {
  name: "wind_side_element",
  layers: [{ char: "~", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const windSide = createTemplate({
  sprite: windSideTemplate,
  materialElementSprite: windSideElementTemplate,
});

const windCornerTemplate: Sprite = {
  name: "wind_corner",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "┌", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "┐", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "┘", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "└", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const windCornerElementTemplate: Sprite = {
  name: "wind_corner_element",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "┌", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "┐", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "┘", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "└", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const windCorner = createTemplate({
  sprite: windCornerTemplate,
  materialElementSprite: windCornerElementTemplate,
});

const gustSideTemplate: Sprite = {
  name: "gust_side",
  layers: [{ char: "~", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const gustSideElementTemplate: Sprite = {
  name: "gust_side_element",
  layers: [{ char: "~", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "║", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "═", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "║", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "═", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const gustSide = createTemplate({
  sprite: gustSideTemplate,
  materialElementSprite: gustSideElementTemplate,
});

const gustCornerTemplate: Sprite = {
  name: "gust_corner",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "╔", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "╗", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "╝", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "╚", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const gustCornerElementTemplate: Sprite = {
  name: "gust_corner_element",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "╔", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "╗", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "╝", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "╚", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const gustCorner = createTemplate({
  sprite: gustCornerTemplate,
  materialElementSprite: gustCornerElementTemplate,
});

const dashTemplate: Sprite = {
  name: "spell_dash",
  layers: [{ char: "+", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [
      { char: "\u0100", color: TEMPLATE_COLORS.transparent },
      { char: "\u0101", color: TEMPLATE_COLORS.transparent },
      { char: "X", color: TEMPLATE_COLORS.materialPrimary },
      { char: "Y", color: TEMPLATE_COLORS.transparent },
      { char: "!", color: TEMPLATE_COLORS.transparent },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: ",", color: TEMPLATE_COLORS.transparent },
      { char: "∙", color: TEMPLATE_COLORS.transparent },
      { char: "·", color: TEMPLATE_COLORS.materialPrimary },
    ],
    right: [
      { char: "\u0100", color: TEMPLATE_COLORS.transparent },
      { char: "\u0101", color: TEMPLATE_COLORS.transparent },
      { char: ">", color: TEMPLATE_COLORS.materialPrimary },
    ],
    down: [
      { char: "\u0100", color: TEMPLATE_COLORS.transparent },
      { char: "\u0101", color: TEMPLATE_COLORS.transparent },
      { char: "v", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0104", color: TEMPLATE_COLORS.transparent },
      { char: "\u0105", color: TEMPLATE_COLORS.materialPrimary },
      { char: "═", color: TEMPLATE_COLORS.transparent },
      { char: "i", color: TEMPLATE_COLORS.transparent },
      { char: "*", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.transparent },
      { char: "=", color: TEMPLATE_COLORS.materialPrimary },
      { char: "Y", color: TEMPLATE_COLORS.transparent },
      { char: "!", color: TEMPLATE_COLORS.transparent },
      { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    ],
    left: [
      { char: "\u0100", color: TEMPLATE_COLORS.transparent },
      { char: "\u0101", color: TEMPLATE_COLORS.transparent },
      { char: "<", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
};
const dashElementTemplate: Sprite = {
  name: "spell_dash_element",
  layers: [{ char: "+", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [
      { char: "X", color: TEMPLATE_COLORS.elementPrimary },
      { char: "Y", color: TEMPLATE_COLORS.transparent },
      { char: "!", color: TEMPLATE_COLORS.transparent },
      { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
      { char: ",", color: TEMPLATE_COLORS.transparent },
      { char: "∙", color: TEMPLATE_COLORS.transparent },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
    right: [{ char: ">", color: TEMPLATE_COLORS.elementPrimary }],
    down: [
      { char: "X", color: TEMPLATE_COLORS.elementPrimary },
      { char: "▄", color: TEMPLATE_COLORS.transparent },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
      { char: ":", color: TEMPLATE_COLORS.transparent },
    ],
    left: [{ char: "<", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const dash = createTemplate({
  sprite: dashTemplate,
  materialElementSprite: dashElementTemplate,
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
export const shot = createTemplate({
  sprite: shotTemplate,
  invertWoodIron: true,
});

const shotShadowTemplate: Sprite = {
  name: "shot_shadow",
  layers: [
    { char: "\u0100", color: TEMPLATE_COLORS.transparent },
    { char: "\u0101", color: TEMPLATE_COLORS.transparent },
    { char: "\u011c", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u011a", color: TEMPLATE_COLORS.transparent },
    { char: "-", color: TEMPLATE_COLORS.materialSecondary },
  ],
  facing: {
    up: [
      { char: "\u0100", color: TEMPLATE_COLORS.transparent },
      { char: "\u0101", color: TEMPLATE_COLORS.transparent },
      { char: "\u0117", color: TEMPLATE_COLORS.materialPrimary },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    ],
    right: [
      { char: "\u0100", color: TEMPLATE_COLORS.transparent },
      { char: "\u0101", color: TEMPLATE_COLORS.transparent },
      { char: "\u011c", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u011a", color: TEMPLATE_COLORS.transparent },
      { char: "-", color: TEMPLATE_COLORS.materialSecondary },
    ],
    down: [
      { char: "\u0100", color: TEMPLATE_COLORS.transparent },
      { char: "\u0101", color: TEMPLATE_COLORS.transparent },
      { char: "\u0118", color: TEMPLATE_COLORS.materialPrimary },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    ],
    left: [
      { char: "\u0100", color: TEMPLATE_COLORS.transparent },
      { char: "\u0101", color: TEMPLATE_COLORS.transparent },
      { char: "\u011c", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0119", color: TEMPLATE_COLORS.transparent },
      { char: "-", color: TEMPLATE_COLORS.materialSecondary },
    ],
  },
};
export const shotShadow = createTemplate({
  sprite: shotShadowTemplate,
  invertWoodIron: true,
});

// slash particles

const slashSideTemplate: Sprite = {
  name: "slash_side",
  layers: [{ char: "╗", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "╝", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const slashSide = createTemplate({ sprite: slashSideTemplate });

const slashCornerTemplate: Sprite = {
  name: "slash_corner",
  layers: [],
  facing: {
    up: [{ char: "╔", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "╗", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "╝", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "╚", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const slashCorner = createTemplate({ sprite: slashCornerTemplate });

const spearLineTemplate: Sprite = {
  name: "spear_line",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialSecondary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialSecondary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialSecondary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialSecondary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialSecondary }],
  },
};
const spearLineElementTemplate: Sprite = {
  name: "spear_line_element",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const spearLine = createTemplate({
  sprite: spearLineTemplate,
  materialElementSprite: spearLineElementTemplate,
  invertWoodIron: true,
});

const spearTipTemplate: Sprite = {
  name: "spear_tip",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const spearTip = createTemplate({
  sprite: spearTipTemplate,
  invertWoodIron: true,
});

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

// totem particles

const bannerTemplate: Sprite = {
  name: "Banner",
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "+", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const banner = createTemplate({ sprite: bannerTemplate });
