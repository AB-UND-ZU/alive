import { namedSprite } from "../spriteIds";
import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite, SpriteArtwork } from "../../../engine/components/sprite";
import { colors } from "../colors";

// block particles

const blockSide1Template: SpriteArtwork = {
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
export const blockSide1 = createTemplate("block_side1", {
  sprite: blockSide1Template,
});

const blockSide2Template: SpriteArtwork = {
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
export const blockSide2 = createTemplate("block_side2", {
  sprite: blockSide2Template,
});

const blockCorner1Template: SpriteArtwork = {
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
export const blockCorner1 = createTemplate("block_corner1", {
  sprite: blockCorner1Template,
});

const blockCorner2Template: SpriteArtwork = {
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
export const blockCorner2 = createTemplate("block_corner2", {
  sprite: blockCorner2Template,
});

// wave particles

const waveSideTemplate: SpriteArtwork = {
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
const waveSideElementTemplate: SpriteArtwork = {
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
export const waveSide = createTemplate("wave_side", {
  sprite: waveSideTemplate,
  materialElementSprite: waveSideElementTemplate,
});

const waveSideDoubleTemplate: SpriteArtwork = {
  name: "wave_side_double",
  layers: [{ char: "╬", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const waveSideDoubleElementTemplate: SpriteArtwork = {
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
export const waveSideDouble = createTemplate("wave_side_double", {
  sprite: waveSideDoubleTemplate,
  materialElementSprite: waveSideDoubleElementTemplate,
});

const waveCornerTemplate: SpriteArtwork = {
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
const waveCornerElementTemplate: SpriteArtwork = {
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
export const waveCorner = createTemplate("wave_corner", {
  sprite: waveCornerTemplate,
  materialElementSprite: waveCornerElementTemplate,
});

const waveCornerDoubleTemplate: SpriteArtwork = {
  name: "wave_corner_double",
  layers: [],
  facing: {
    up: [{ char: "╗", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "╝", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "╚", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "╔", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const waveCornerDoubleElementTemplate: SpriteArtwork = {
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
export const waveCornerDouble = createTemplate("wave_corner_double", {
  sprite: waveCornerDoubleTemplate,
  materialElementSprite: waveCornerDoubleElementTemplate,
});

const triggerTemplate: SpriteArtwork = {
  name: "spell_trigger",
  terminal: { layers: [{ char: "\\", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\\", color: TEMPLATE_COLORS.materialPrimary },
    { char: "/", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▒", color: TEMPLATE_COLORS.transparent },
  ],
};
const triggerElementTemplate: SpriteArtwork = {
  name: "spell_trigger_element",
  terminal: { layers: [{ char: "\\", color: TEMPLATE_COLORS.elementPrimary }] },
  layers: [
    { char: "\\", color: TEMPLATE_COLORS.elementPrimary },
    { char: "/", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▒", color: TEMPLATE_COLORS.transparent },
  ],
};
export const trigger = createTemplate("trigger", {
  sprite: triggerTemplate,
  materialElementSprite: triggerElementTemplate,
});

const triggerLine = (char: string, color = TEMPLATE_COLORS.materialPrimary) => [
  { char, color },
  ...(char === "|" ? [{ char: "║", color: TEMPLATE_COLORS.transparent }] : []),
  { char: "▒", color: TEMPLATE_COLORS.transparent },
];

const triggerSideTemplate: SpriteArtwork = {
  name: "spell_trigger_side",
  layers: triggerLine("|"),
  facing: {
    right: triggerLine("-"),
    left: triggerLine("-"),
  },
};
export const triggerSide = createTemplate("trigger_side", {
  sprite: triggerSideTemplate,
  materialElementSprite: {
    ...triggerSideTemplate,
    layers: triggerLine("|", TEMPLATE_COLORS.elementPrimary),
  },
});

const triggerCornerTemplate: SpriteArtwork = {
  name: "spell_trigger_corner",
  layers: triggerLine("\\"),
  facing: {
    right: triggerLine("/"),
    left: triggerLine("/"),
  },
};
export const triggerCorner = createTemplate("trigger_corner", {
  sprite: triggerCornerTemplate,
  materialElementSprite: {
    ...triggerCornerTemplate,
    layers: triggerLine("\\", TEMPLATE_COLORS.elementPrimary),
  },
});

export const trapBorder = ["─", "┐", "│", "┘", "─", "└", "│", "┌"].map(
  (char, index) =>
    createTemplate(`trap_border_${index}`, {
      sprite: {
        name: "trap_border",
        layers: [{ char, color: TEMPLATE_COLORS.materialPrimary }],
      },
      materialElementSprite: {
        name: "trap_border",
        layers: [
          {
            char,
            color:
              index % 2
                ? TEMPLATE_COLORS.materialPrimary
                : TEMPLATE_COLORS.elementPrimary,
          },
        ],
      },
    })
);

const windSideTemplate: SpriteArtwork = {
  name: "wind_side",
  layers: [{ char: "~", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const windSideElementTemplate: SpriteArtwork = {
  name: "wind_side_element",
  layers: [{ char: "~", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const windSide = createTemplate("wind_side", {
  sprite: windSideTemplate,
  materialElementSprite: windSideElementTemplate,
});

const windCornerTemplate: SpriteArtwork = {
  name: "wind_corner",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "┌", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "┐", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "┘", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "└", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const windCornerElementTemplate: SpriteArtwork = {
  name: "wind_corner_element",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "┌", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "┐", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "┘", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "└", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const windCorner = createTemplate("wind_corner", {
  sprite: windCornerTemplate,
  materialElementSprite: windCornerElementTemplate,
});

const gustSideTemplate: SpriteArtwork = {
  name: "gust_side",
  layers: [{ char: "~", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const gustSideElementTemplate: SpriteArtwork = {
  name: "gust_side_element",
  layers: [{ char: "~", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "║", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "═", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "║", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "═", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const gustSide = createTemplate("gust_side", {
  sprite: gustSideTemplate,
  materialElementSprite: gustSideElementTemplate,
});

const gustCornerTemplate: SpriteArtwork = {
  name: "gust_corner",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "╔", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "╗", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "╝", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "╚", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const gustCornerElementTemplate: SpriteArtwork = {
  name: "gust_corner_element",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "╔", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "╗", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "╝", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "╚", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const gustCorner = createTemplate("gust_corner", {
  sprite: gustCornerTemplate,
  materialElementSprite: gustCornerElementTemplate,
});

const dashTemplate: SpriteArtwork = {
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
const dashElementTemplate: SpriteArtwork = {
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
export const dash = createTemplate("dash", {
  sprite: dashTemplate,
  materialElementSprite: dashElementTemplate,
});

// decay sprites

const evaporateTemplate: SpriteArtwork = {
  name: "evaporate",
  layers: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
};
export const evaporate = createTemplate("evaporate", {
  sprite: evaporateTemplate,
});

// arrow sprites

const shotTemplate: SpriteArtwork = {
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
export const shot = createTemplate("shot", {
  sprite: shotTemplate,
  invertWoodIron: true,
});

const shotShadowTemplate: SpriteArtwork = {
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
export const shotShadow = createTemplate("shot_shadow", {
  sprite: shotShadowTemplate,
  invertWoodIron: true,
});

// slash particles

const slashSideTemplate: SpriteArtwork = {
  name: "slash_side",
  layers: [{ char: "╗", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "╝", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "═", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "║", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const slashSide = createTemplate("slash_side", {
  sprite: slashSideTemplate,
});

const slashCornerTemplate: SpriteArtwork = {
  name: "slash_corner",
  layers: [],
  facing: {
    up: [{ char: "╔", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "╗", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "╝", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "╚", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const slashCorner = createTemplate("slash_corner", {
  sprite: slashCornerTemplate,
});

const spearLineTemplate: SpriteArtwork = {
  name: "spear_line",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialSecondary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialSecondary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialSecondary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialSecondary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialSecondary }],
  },
};
const spearLineElementTemplate: SpriteArtwork = {
  name: "spear_line_element",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.elementPrimary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.elementPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.elementPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.elementPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.elementPrimary }],
  },
};
export const spearLine = createTemplate("spear_line", {
  sprite: spearLineTemplate,
  materialElementSprite: spearLineElementTemplate,
  invertWoodIron: true,
});

const spearTipTemplate: SpriteArtwork = {
  name: "spear_tip",
  layers: [{ char: "┼", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const spearTip = createTemplate("spear_tip", {
  sprite: spearTipTemplate,
  invertWoodIron: true,
});

// homing particles

const summonTemplate: SpriteArtwork = {
  name: "summon",
  layers: [
    { char: "■", color: TEMPLATE_COLORS.materialPrimary },
    { char: "≡", color: TEMPLATE_COLORS.transparent },
    { char: "+", color: TEMPLATE_COLORS.transparent },
    { char: "÷", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.transparent },
  ],
};
export const summon = createTemplate("summon", { sprite: summonTemplate });

const ballTemplate: SpriteArtwork = {
  name: "ball",
  layers: [
    { char: "\u0108", color: TEMPLATE_COLORS.materialSecondary },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
  ],
};
export const ball = createTemplate("ball", { sprite: ballTemplate });

const homingTemplate: SpriteArtwork = {
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
export const homing = createTemplate("homing", { sprite: homingTemplate });

const discTemplate: SpriteArtwork = {
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
export const disc = createTemplate("disc", { sprite: discTemplate });

const blastTemplate: SpriteArtwork = {
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
export const blast = createTemplate("blast", { sprite: blastTemplate });

// beam particles

const boltTemplate: SpriteArtwork = {
  name: "bolt",
  terminal: { layers: [{ char: "•", color: TEMPLATE_COLORS.materialPrimary }] },
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
const boltElementTemplate: SpriteArtwork = {
  name: "bolt_element",
  terminal: { layers: [{ char: "•", color: TEMPLATE_COLORS.elementPrimary }] },
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
const boltWood: Sprite = namedSprite("bolt_wood", {
  name: "bolt",
  terminal: { layers: [{ char: "•", color: colors.maroon }] },
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
});
export const bolt = createTemplate("bolt", {
  sprite: boltTemplate,
  materialElementSprite: boltElementTemplate,
});
bolt.wood.default = boltWood;

const edgeTemplate: SpriteArtwork = {
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
const edgeElementTemplate: SpriteArtwork = {
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
export const edge = createTemplate("edge", {
  sprite: edgeTemplate,
  materialElementSprite: edgeElementTemplate,
});

// totem particles

const bannerTemplate: SpriteArtwork = {
  name: "Banner",
  terminal: { layers: [{ char: "t", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "+", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const banner = createTemplate("banner", { sprite: bannerTemplate });
