import { createTemplate, TEMPLATE_COLORS } from ".";
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
    { char: "─", color: TEMPLATE_COLORS.materialSecondary },
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
  ],
  facing: {
    up: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "│", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "─", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const spearElementTemplate: Sprite = {
  name: "Spear",
  layers: [
    { char: "─", color: TEMPLATE_COLORS.materialSecondary },
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.elementPrimary },
  ],
  facing: {
    up: [
      { char: "│", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
    right: [
      { char: "─", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
    down: [
      { char: "│", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
    left: [
      { char: "─", color: TEMPLATE_COLORS.materialPrimary },
      { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    ],
  },
};
export const spear = createTemplate({
  sprite: spearTemplate,
  materialElementSprite: spearElementTemplate,
});

const wandTemplate: Sprite = {
  name: "Wand",
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialSecondary },
    { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const wandIron: Sprite = {
  name: "Wand",
  layers: [
    { char: "\u0106", color: colors.grey },
    { char: "∙", color: colors.white },
    { char: ".", color: colors.white },
  ],
};
const wandElementTemplate: Sprite = {
  name: "Wand",
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialSecondary },
    { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const wand = createTemplate({
  sprite: wandTemplate,
  materialElementSprite: wandElementTemplate,
});
wand.iron.default = wandIron;

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

// harvesting

const shovelTemplate: Sprite = {
  name: "Shovel",
  layers: [
    { char: "I", color: TEMPLATE_COLORS.materialPrimary },
    { char: "i", color: TEMPLATE_COLORS.transparent },
    { char: "\u0118", color: TEMPLATE_COLORS.materialSecondary },
    { char: "|", color: TEMPLATE_COLORS.materialPrimary },
    { char: ".", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const shovel = createTemplate({ sprite: shovelTemplate });

const axeTemplate: Sprite = {
  name: "Axe",
  layers: [
    { char: "'", color: TEMPLATE_COLORS.materialSecondary },
    { char: "º", color: TEMPLATE_COLORS.materialSecondary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
    { char: "\\", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const axe = createTemplate({ sprite: axeTemplate });

const pickaxeTemplate: Sprite = {
  name: "Pickaxe",
  layers: [
    { char: "\u0119", color: TEMPLATE_COLORS.materialSecondary },
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const pickaxe = createTemplate({ sprite: pickaxeTemplate });

// accessories

const bootsTemplate: Sprite = {
  name: "Boots",
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

// secondary items

const raiseTemplate: Sprite = {
  name: "Raise",
  layers: [
    { char: "%", color: TEMPLATE_COLORS.materialPrimary },
    { char: "/", color: TEMPLATE_COLORS.transparent },
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u011c", color: TEMPLATE_COLORS.transparent },
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const raise = createTemplate({ sprite: raiseTemplate });

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

// tools

const compassTemplate: Sprite = {
  name: "Compass",
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
  layers: [
    { char: "┐", color: TEMPLATE_COLORS.materialPrimary },
    { char: "─", color: TEMPLATE_COLORS.transparent },
    { char: "*", color: colors.red },
    { char: "+", color: colors.yellow },
  ],
};
const torchGold: Sprite = {
  name: "Torch",
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
    { char: "■", color: TEMPLATE_COLORS.materialPrimary },
    { char: "≡", color: TEMPLATE_COLORS.materialSecondary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
    { char: "+", color: TEMPLATE_COLORS.materialPrimary },
    { char: "·", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const map = createTemplate({ sprite: mapTemplate });
