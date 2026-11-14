import { createTemplate, TEMPLATE_COLORS, colorPalettes } from ".";
import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";

// weapon items

const swordTemplate: Sprite = {
  name: "Sword",
  layers: [{ char: "/", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "|", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "-", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "|", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "-", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const swordElementTemplate: Sprite = {
  name: "Sword",
  layers: [
    { char: "/", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.elementPrimary },
  ],
  facing: {
    up: [
      { char: "|", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
    right: [
      { char: "-", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
    down: [
      { char: "|", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
    left: [
      { char: "-", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
  },
};
export const sword = createTemplate({
  sprite: swordTemplate,
  materialElementSprite: swordElementTemplate,
});

const spearTemplate: Sprite = {
  name: "Spear",
  layers: [
    { char: "─", color: TEMPLATE_COLORS.materialPrimary },
    { char: "-", color: TEMPLATE_COLORS.materialSecondary },
  ],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialSecondary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialSecondary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialSecondary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialSecondary }],
  },
};
const spearElementTemplate: Sprite = {
  name: "Spear",
  layers: [
    { char: "─", color: TEMPLATE_COLORS.materialPrimary },
    { char: "-", color: TEMPLATE_COLORS.materialSecondary },
    { char: "·", color: TEMPLATE_COLORS.elementPrimary },
  ],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialSecondary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialSecondary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialSecondary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialSecondary }],
  },
};
export const spear = createTemplate({
  sprite: spearTemplate,
  materialElementSprite: spearElementTemplate,
  invertWoodIron: true,
});

const wandTemplate: Sprite = {
  name: "Wand",
  terminal: { layers: [{ char: ";", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
const wandIron: Sprite = {
  name: "Wand",
  terminal: { layers: [{ char: ";", color: colors.grey }] },
  layers: [
    { char: "\u0106", color: colors.white },
    { char: "∙", color: colors.grey },
    { char: ".", color: colors.grey },
  ],
};
const wandElementTemplate: Sprite = {
  name: "Wand",
  terminal: { layers: [{ char: ";", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
    { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    { char: ".", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const wand = createTemplate({
  sprite: wandTemplate,
  materialElementSprite: wandElementTemplate,
  invertWoodIron: true,
});
wand.iron.default = wandIron;

const staffTemplate: Sprite = {
  name: "Staff",
  layers: [
    { char: "!", color: TEMPLATE_COLORS.materialPrimary },
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
    { char: ":", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const staff = createTemplate({ sprite: staffTemplate });

// defensive items

const shieldTemplate: Sprite = {
  name: "Shield",
  layers: [{ char: "¬", color: TEMPLATE_COLORS.materialPrimary }],
};
const shieldElementTemplate: Sprite = {
  name: "Shield",
  layers: [
    { char: "-", color: TEMPLATE_COLORS.elementPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: "¬", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const shield = createTemplate({
  sprite: shieldTemplate,
  materialElementSprite: shieldElementTemplate,
});

// tools

const hammerTemplate: Sprite = {
  name: "Hammer",
  terminal: {
    layers: [{ char: "\u0117", color: TEMPLATE_COLORS.materialPrimary }],
  },
  layers: [
    { char: "|", color: TEMPLATE_COLORS.materialPrimary },
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
    { char: "'", color: TEMPLATE_COLORS.materialSecondary },
    { char: "°", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const hammer = createTemplate({ sprite: hammerTemplate });

const shovelTemplate: Sprite = {
  name: "Shovel",
  terminal: {
    layers: [{ char: "\u0118", color: TEMPLATE_COLORS.materialPrimary }],
  },
  layers: [
    { char: "I", color: TEMPLATE_COLORS.materialSecondary },
    { char: "i", color: TEMPLATE_COLORS.transparent },
    { char: "\u0118", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const shovel = createTemplate({
  sprite: shovelTemplate,
  invertWoodIron: true,
});

const axeTemplate: Sprite = {
  name: "Axe",
  terminal: { layers: [{ char: "Γ", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "'", color: TEMPLATE_COLORS.materialPrimary },
    { char: "º", color: TEMPLATE_COLORS.materialPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
    { char: "\\", color: TEMPLATE_COLORS.materialSecondary },
  ],
  facing: {
    up: [
      { char: "'", color: TEMPLATE_COLORS.materialPrimary },
      { char: "º", color: TEMPLATE_COLORS.materialPrimary },
      { char: "-", color: TEMPLATE_COLORS.transparent },
      { char: "\\", color: TEMPLATE_COLORS.materialSecondary },
    ],
    right: [
      { char: "'", color: TEMPLATE_COLORS.materialPrimary },
      { char: "º", color: TEMPLATE_COLORS.materialPrimary },
      { char: "-", color: TEMPLATE_COLORS.transparent },
      { char: "\\", color: TEMPLATE_COLORS.materialSecondary },
    ],
    down: [
      { char: "'", color: TEMPLATE_COLORS.materialPrimary },
      { char: "º", color: TEMPLATE_COLORS.materialPrimary },
      { char: "-", color: TEMPLATE_COLORS.transparent },
      { char: "/", color: TEMPLATE_COLORS.materialSecondary },
    ],
    left: [
      { char: "'", color: TEMPLATE_COLORS.materialPrimary },
      { char: "º", color: TEMPLATE_COLORS.materialPrimary },
      { char: "-", color: TEMPLATE_COLORS.transparent },
      { char: "/", color: TEMPLATE_COLORS.materialSecondary },
    ],
  },
};
const ironAxe: Sprite = {
  name: "Axe",
  terminal: { layers: [{ char: "Γ", color: colors.grey }] },
  layers: [
    { char: "'", color: colors.white },
    { char: "º", color: colors.white },
    { char: "-", color: colors.black },
    { char: "\\", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "'", color: colors.white },
      { char: "º", color: colors.white },
      { char: "-", color: colors.black },
      { char: "\\", color: colors.grey },
    ],
    right: [
      { char: "'", color: colors.white },
      { char: "º", color: colors.white },
      { char: "-", color: colors.black },
      { char: "\\", color: colors.grey },
    ],
    down: [
      { char: "'", color: colors.white },
      { char: "º", color: colors.white },
      { char: "-", color: colors.black },
      { char: "/", color: colors.grey },
    ],
    left: [
      { char: "'", color: colors.white },
      { char: "º", color: colors.white },
      { char: "-", color: colors.black },
      { char: "/", color: colors.grey },
    ],
  },
};
export const axe = createTemplate({
  sprite: axeTemplate,
  invertWoodIron: true,
});
axe.iron.default = ironAxe;

const pickaxeTemplate: Sprite = {
  name: "Pickaxe",
  terminal: {
    layers: [{ char: "\u0119", color: TEMPLATE_COLORS.materialPrimary }],
  },
  layers: [
    { char: "\u0119", color: TEMPLATE_COLORS.materialPrimary },
    { char: "-", color: TEMPLATE_COLORS.materialSecondary },
  ],
  facing: {
    up: [
      { char: "\u0117", color: TEMPLATE_COLORS.materialPrimary },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    ],
    right: [
      { char: "\u0119", color: TEMPLATE_COLORS.materialPrimary },
      { char: "-", color: TEMPLATE_COLORS.materialSecondary },
    ],
    down: [
      { char: "\u0118", color: TEMPLATE_COLORS.materialPrimary },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    ],
    left: [
      { char: "\u011a", color: TEMPLATE_COLORS.materialPrimary },
      { char: "-", color: TEMPLATE_COLORS.materialSecondary },
    ],
  },
};
const woodPickaxe: Sprite = {
  name: "Pickaxe",
  terminal: { layers: [{ char: "\u0119", color: colors.maroon }] },
  layers: [
    { char: "\u0119", color: colors.grey },
    { char: "-", color: colors.maroon },
  ],
  facing: {
    up: [
      { char: "\u0117", color: colors.white },
      { char: "|", color: colors.maroon },
    ],
    right: [
      { char: "\u0119", color: colors.white },
      { char: "-", color: colors.maroon },
    ],
    down: [
      { char: "\u0118", color: colors.white },
      { char: "|", color: colors.maroon },
    ],
    left: [
      { char: "\u011a", color: colors.white },
      { char: "-", color: colors.maroon },
    ],
  },
};
const ironPickaxe: Sprite = {
  name: "Pickaxe",
  terminal: { layers: [{ char: "\u0119", color: colors.grey }] },
  layers: [
    { char: "\u0119", color: colors.white },
    { char: "-", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "\u0117", color: colors.white },
      { char: "|", color: colors.silver },
    ],
    right: [
      { char: "\u0119", color: colors.white },
      { char: "-", color: colors.silver },
    ],
    down: [
      { char: "\u0118", color: colors.white },
      { char: "|", color: colors.silver },
    ],
    left: [
      { char: "\u011a", color: colors.white },
      { char: "-", color: colors.silver },
    ],
  },
};
export const pickaxe = createTemplate({
  sprite: pickaxeTemplate,
  invertWoodIron: true,
});
pickaxe.wood.default = woodPickaxe;
pickaxe.iron.default = ironPickaxe;

const hookTemplate: Sprite = {
  name: "Hook",
  terminal: { layers: [{ char: "⌠", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "│", color: TEMPLATE_COLORS.materialSecondary },
    { char: "┐", color: TEMPLATE_COLORS.transparent },
    { char: "'", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
  ],
  facing: {
    up: [
      { char: "│", color: colors.grey },
      { char: "┐", color: TEMPLATE_COLORS.transparent },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
    ],
    right: [
      { char: "└", color: colors.grey },
      { char: "│", color: TEMPLATE_COLORS.materialSecondary },
      { char: "┐", color: TEMPLATE_COLORS.transparent },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
    ],
    down: [
      { char: "│", color: TEMPLATE_COLORS.materialSecondary },
      { char: "┘", color: TEMPLATE_COLORS.materialSecondary },
      { char: "┐", color: colors.grey },
      { char: "-", color: TEMPLATE_COLORS.transparent },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
    ],
    left: [
      { char: "┘", color: colors.grey },
      { char: "│", color: TEMPLATE_COLORS.materialSecondary },
      { char: "┌", color: TEMPLATE_COLORS.transparent },
      { char: "|", color: TEMPLATE_COLORS.materialSecondary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
    ],
  },
};
const ironHook: Sprite = {
  name: "Hook",
  terminal: { layers: [{ char: "⌠", color: colors.grey }] },
  layers: [
    { char: "│", color: colors.grey },
    { char: "┐", color: colors.black },
    { char: "'", color: colors.white },
    { char: "|", color: colors.grey },
    { char: "\u0106", color: colors.white },
    { char: "∙", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "│", color: colors.grey },
      { char: "┐", color: colors.black },
      { char: "|", color: colors.grey },
      { char: "\u0106", color: colors.white },
      { char: "∙", color: colors.grey },
    ],
    right: [
      { char: "└", color: colors.grey },
      { char: "│", color: colors.grey },
      { char: "┐", color: colors.black },
      { char: "|", color: colors.grey },
      { char: "\u0106", color: colors.white },
      { char: "∙", color: colors.grey },
    ],
    down: [
      { char: "│", color: colors.grey },
      { char: "┘", color: colors.grey },
      { char: "┐", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "|", color: colors.grey },
      { char: "\u0106", color: colors.white },
      { char: "∙", color: colors.grey },
    ],
    left: [
      { char: "┘", color: colors.grey },
      { char: "│", color: colors.grey },
      { char: "┌", color: colors.black },
      { char: "|", color: colors.grey },
      { char: "\u0106", color: colors.white },
      { char: "∙", color: colors.grey },
    ],
  },
};
export const hook = createTemplate({
  sprite: hookTemplate,
  invertWoodIron: true,
});
hook.iron.default = ironHook;

// accessories

const bootsTemplate: Sprite = {
  name: "Boots",
  terminal: { layers: [{ char: "ⁿ", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0116", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0111", color: TEMPLATE_COLORS.transparent },
    { char: "¡", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.transparent },
  ],
};
export const boots = createTemplate({ sprite: bootsTemplate });

const amuletTemplate: Sprite = {
  name: "Amulet",
  layers: [
    { char: "┘", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▐", color: TEMPLATE_COLORS.transparent },
    { char: "┐", color: TEMPLATE_COLORS.transparent },
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const amuletElementTemplate: Sprite = {
  name: "Amulet",
  layers: [
    { char: "│", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▐", color: TEMPLATE_COLORS.transparent },
    { char: "┐", color: TEMPLATE_COLORS.transparent },
    { char: "\u011e", color: TEMPLATE_COLORS.elementPrimary },
    { char: "≡", color: TEMPLATE_COLORS.transparent },
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const amulet = createTemplate({
  sprite: amuletTemplate,
  materialElementSprite: amuletElementTemplate,
});

const ringTemplate: Sprite = {
  name: "Ring",
  terminal: { layers: [{ char: "ô", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "|", color: TEMPLATE_COLORS.materialPrimary },
    { char: ".", color: TEMPLATE_COLORS.transparent },
    { char: "~", color: TEMPLATE_COLORS.transparent },
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
  ],
};
const ringElementTemplate: Sprite = {
  name: "Ring",
  terminal: { layers: [{ char: "ô", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "|", color: TEMPLATE_COLORS.elementPrimary },
    { char: ".", color: TEMPLATE_COLORS.transparent },
    { char: "~", color: TEMPLATE_COLORS.transparent },
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
  ],
};
export const ring = createTemplate({
  sprite: ringTemplate,
  materialElementSprite: ringElementTemplate,
});

// spell items

const beamSpellTemplate: Sprite = {
  name: "Beam",
  terminal: { layers: [{ char: ":", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "±", color: TEMPLATE_COLORS.materialPrimary },
    { char: "■", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0108", color: TEMPLATE_COLORS.transparent },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const beamSpellElementTemplate: Sprite = {
  name: "Beam",
  terminal: { layers: [{ char: ":", color: TEMPLATE_COLORS.elementPrimary }] },
  layers: [
    { char: "±", color: TEMPLATE_COLORS.materialPrimary },
    { char: "■", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0108", color: TEMPLATE_COLORS.transparent },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const beamSpell = createTemplate({
  sprite: beamSpellTemplate,
  materialElementSprite: beamSpellElementTemplate,
});

const waveSpellTemplate: Sprite = {
  name: "Wave",
  layers: [
    { char: "*", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.materialPrimary },
    { char: "+", color: TEMPLATE_COLORS.transparent },
    { char: "÷", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.transparent },
    { char: "~", color: TEMPLATE_COLORS.transparent },
  ],
};
const waveSpellElementTemplate: Sprite = {
  name: "Wave",
  layers: [
    { char: "*", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.materialPrimary },
    { char: "+", color: TEMPLATE_COLORS.transparent },
    { char: "÷", color: TEMPLATE_COLORS.elementPrimary },
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.transparent },
    { char: "~", color: TEMPLATE_COLORS.transparent },
  ],
};
export const waveSpell = createTemplate({
  sprite: waveSpellTemplate,
  materialElementSprite: waveSpellElementTemplate,
});

const trapSpellTemplate: Sprite = {
  name: "Trap",
  terminal: { layers: [{ char: "%", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "≡", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0103", color: TEMPLATE_COLORS.transparent },
    { char: "\u011c", color: TEMPLATE_COLORS.materialPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
  ],
};
const trapSpellElementTemplate: Sprite = {
  name: "Trap",
  terminal: { layers: [{ char: "%", color: TEMPLATE_COLORS.elementPrimary }] },
  layers: [
    { char: "≡", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0103", color: TEMPLATE_COLORS.transparent },
    { char: "\u011c", color: TEMPLATE_COLORS.elementPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
  ],
};
export const trapSpell = createTemplate({
  sprite: trapSpellTemplate,
  materialElementSprite: trapSpellElementTemplate,
});

const dashSpellTemplate: Sprite = {
  name: "Dash",
  layers: [
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
    { char: "»", color: TEMPLATE_COLORS.materialPrimary },
    { char: ">", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const dashSpellElementTemplate: Sprite = {
  name: "Dash",
  layers: [
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
    { char: "»", color: TEMPLATE_COLORS.elementPrimary },
    { char: ">", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const dashSpell = createTemplate({
  sprite: dashSpellTemplate,
  materialElementSprite: dashSpellElementTemplate,
});

// secondary skills

const zapTemplate: Sprite = {
  name: "Zap",
  terminal: { layers: [{ char: "÷", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "%", color: TEMPLATE_COLORS.materialPrimary },
    { char: "/", color: TEMPLATE_COLORS.transparent },
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u011c", color: TEMPLATE_COLORS.transparent },
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const zap = createTemplate({ sprite: zapTemplate });

const bowTemplate: Sprite = {
  name: "Bow",
  layers: [{ char: "}", color: TEMPLATE_COLORS.materialPrimary }],
};
const bowElementTemplate: Sprite = {
  name: "Bow",
  layers: [
    { char: "}", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const bow = createTemplate({
  sprite: bowTemplate,
  materialElementSprite: bowElementTemplate,
});

const slashTemplate: Sprite = {
  name: "Slash",
  layers: [
    { char: "\u03c3", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: ";", color: TEMPLATE_COLORS.materialPrimary },
    { char: "°", color: TEMPLATE_COLORS.transparent },
    { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const slashElementTemplate: Sprite = {
  name: "Slash",
  layers: [
    { char: "\u03c3", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: ";", color: TEMPLATE_COLORS.materialPrimary },
    { char: "°", color: TEMPLATE_COLORS.transparent },
    { char: "∙", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const slash = createTemplate({
  sprite: slashTemplate,
  materialElementSprite: slashElementTemplate,
});

const blockTemplate: Sprite = {
  name: "Block",
  layers: [
    { char: "0", color: TEMPLATE_COLORS.materialPrimary },
    { char: "=", color: TEMPLATE_COLORS.transparent },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: "\u0108", color: TEMPLATE_COLORS.transparent },
  ],
};
export const block = createTemplate({ sprite: blockTemplate });

const totemTemplate: Sprite = {
  name: "Totem",
  terminal: { layers: [{ char: "T", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "x", color: TEMPLATE_COLORS.materialPrimary },
    { char: "=", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▄", color: TEMPLATE_COLORS.transparent },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.materialPrimary },
    { char: "+", color: TEMPLATE_COLORS.transparent },
    { char: "÷", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const totem = createTemplate({ sprite: totemTemplate });

// tools

const compassTemplate: Sprite = {
  name: "Compass",
  terminal: {
    layers: [{ char: "\u0111", color: TEMPLATE_COLORS.materialPrimary }],
    facing: {
      up: [{ char: "\u0117", color: TEMPLATE_COLORS.materialPrimary }],
      right: [{ char: "\u0119", color: TEMPLATE_COLORS.materialPrimary }],
      down: [{ char: "\u0118", color: TEMPLATE_COLORS.materialPrimary }],
      left: [{ char: "\u011a", color: TEMPLATE_COLORS.materialPrimary }],
    },
  },
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "+", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.materialSecondary },
  ],
  facing: {
    up: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
      { char: "\u0117", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.materialSecondary },
    ],
    right: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
      { char: "\u0119", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.materialSecondary },
    ],
    down: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
      { char: "\u0118", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.materialSecondary },
    ],
    left: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
      { char: "\u011a", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.materialSecondary },
    ],
  },
};
export const compass = createTemplate({ sprite: compassTemplate });

const torchTemplate: Sprite = {
  name: "Torch",
  terminal: { layers: [{ char: "î", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "┐", color: TEMPLATE_COLORS.materialPrimary },
    { char: "─", color: TEMPLATE_COLORS.transparent },
    { char: "*", color: colors.red },
    { char: "+", color: colors.yellow },
  ],
};
const torchGold: Sprite = {
  name: "Torch",
  terminal: { layers: [{ char: "î", color: colors.yellow }] },
  layers: [
    { char: "┐", color: colors.olive },
    { char: "─", color: colors.black },
    { char: "*", color: colors.red },
    { char: "+", color: colors.yellow },
  ],
};
export const torch = createTemplate({ sprite: torchTemplate });
torch.gold.default = torchGold;

const mapTemplate: Sprite = {
  name: "Map",
  layers: [
    { char: "■", color: TEMPLATE_COLORS.materialSecondary },
    { char: "≡", color: TEMPLATE_COLORS.materialPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
    { char: "+", color: TEMPLATE_COLORS.materialSecondary },
    { char: "·", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const map = createTemplate({
  sprite: mapTemplate,
  invertWoodIron: true,
});

for (const [template, char] of [
  [wand, ";"],
  [shovel, "\u0118"],
  [axe, "Γ"],
  [pickaxe, "\u0119"],
  [hook, "⌠"],
] as const)
  for (const material of ["wood", "iron"] as const)
    for (const sprite of Object.values(template[material]))
      sprite.terminal = {
        layers: [{ char, color: colorPalettes[material].primary }],
      };
