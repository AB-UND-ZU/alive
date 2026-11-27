import { namedSprite } from "../spriteIds";
import { createTemplate, TEMPLATE_COLORS, colorPalettes } from ".";
import { Sprite, SpriteArtwork } from "../../../engine/components/sprite";
import { colors } from "../colors";

// weapon items

const swordTemplate: SpriteArtwork = {
  name: "Sword",
  layers: [{ char: "/", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "|", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "-", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "|", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "-", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
const swordElementTemplate: SpriteArtwork = {
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
export const sword = createTemplate("sword", {
  sprite: swordTemplate,
  materialElementSprite: swordElementTemplate,
});

const spearTemplate: SpriteArtwork = {
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
const spearElementTemplate: SpriteArtwork = {
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
export const spear = createTemplate("spear", {
  sprite: spearTemplate,
  materialElementSprite: spearElementTemplate,
  invertWoodIron: true,
});

const wandTemplate: SpriteArtwork = {
  name: "Wand",
  terminal: { layers: [{ char: ";", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
const wandIron: Sprite = namedSprite("wand_iron", {
  name: "Wand",
  terminal: { layers: [{ char: ";", color: colors.grey }] },
  layers: [
    { char: "\u0106", color: colors.white },
    { char: "∙", color: colors.grey },
    { char: ".", color: colors.grey },
  ],
});
const wandElementTemplate: SpriteArtwork = {
  name: "Wand",
  terminal: { layers: [{ char: ";", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.materialSecondary },
    { char: "·", color: TEMPLATE_COLORS.elementPrimary },
    { char: ".", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const wand = createTemplate("wand", {
  sprite: wandTemplate,
  materialElementSprite: wandElementTemplate,
  invertWoodIron: true,
});
wand.iron.default = wandIron;

const staffTemplate: SpriteArtwork = {
  name: "Staff",
  layers: [
    { char: "!", color: TEMPLATE_COLORS.materialPrimary },
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
    { char: ":", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const staff = createTemplate("staff", { sprite: staffTemplate });

// defensive items

const shieldTemplate: SpriteArtwork = {
  name: "Shield",
  layers: [{ char: "¬", color: TEMPLATE_COLORS.materialPrimary }],
};
const shieldElementTemplate: SpriteArtwork = {
  name: "Shield",
  layers: [
    { char: "-", color: TEMPLATE_COLORS.elementPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: "¬", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const shield = createTemplate("shield", {
  sprite: shieldTemplate,
  materialElementSprite: shieldElementTemplate,
});

// tools

const hammerTemplate: SpriteArtwork = {
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
export const hammer = createTemplate("hammer", { sprite: hammerTemplate });

const shovelTemplate: SpriteArtwork = {
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
export const shovel = createTemplate("shovel", {
  sprite: shovelTemplate,
  invertWoodIron: true,
});

const axeTemplate: SpriteArtwork = {
  name: "Axe",
  terminal: { layers: [{ char: "7", color: TEMPLATE_COLORS.materialPrimary }] },
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
const ironAxe: Sprite = namedSprite("iron_axe", {
  name: "Axe",
  terminal: { layers: [{ char: "7", color: colors.grey }] },
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
});
export const axe = createTemplate("axe", {
  sprite: axeTemplate,
  invertWoodIron: true,
});
axe.iron.default = ironAxe;

const pickaxeTemplate: SpriteArtwork = {
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
const woodPickaxe: Sprite = namedSprite("wood_pickaxe", {
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
});
const ironPickaxe: Sprite = namedSprite("iron_pickaxe", {
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
});
export const pickaxe = createTemplate("pickaxe", {
  sprite: pickaxeTemplate,
  invertWoodIron: true,
});
pickaxe.wood.default = woodPickaxe;
pickaxe.iron.default = ironPickaxe;

const hookTemplate: SpriteArtwork = {
  name: "Hook",
  terminal: { layers: [{ char: "Γ", color: TEMPLATE_COLORS.materialPrimary }] },
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
const ironHook: Sprite = namedSprite("iron_hook", {
  name: "Hook",
  terminal: { layers: [{ char: "Γ", color: colors.grey }] },
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
});
export const hook = createTemplate("hook", {
  sprite: hookTemplate,
  invertWoodIron: true,
});
hook.iron.default = ironHook;

// accessories

const bootsTemplate: SpriteArtwork = {
  name: "Boots",
  terminal: { layers: [{ char: '"', color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0116", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0111", color: TEMPLATE_COLORS.transparent },
    { char: "¡", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.transparent },
  ],
};
export const boots = createTemplate("boots", { sprite: bootsTemplate });

const amuletTemplate: SpriteArtwork = {
  name: "Amulet",
  layers: [
    { char: "┘", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▐", color: TEMPLATE_COLORS.transparent },
    { char: "┐", color: TEMPLATE_COLORS.transparent },
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const amuletElementTemplate: SpriteArtwork = {
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
export const amulet = createTemplate("amulet", {
  sprite: amuletTemplate,
  materialElementSprite: amuletElementTemplate,
});

const ringTemplate: SpriteArtwork = {
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
const ringElementTemplate: SpriteArtwork = {
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
export const ring = createTemplate("ring", {
  sprite: ringTemplate,
  materialElementSprite: ringElementTemplate,
});

// spell items

const beamSpellTemplate: SpriteArtwork = {
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
const beamSpellElementTemplate: SpriteArtwork = {
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
export const beamSpell = createTemplate("beam_spell", {
  sprite: beamSpellTemplate,
  materialElementSprite: beamSpellElementTemplate,
});

const waveSpellTemplate: SpriteArtwork = {
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
const waveSpellElementTemplate: SpriteArtwork = {
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
export const waveSpell = createTemplate("wave_spell", {
  sprite: waveSpellTemplate,
  materialElementSprite: waveSpellElementTemplate,
});

const trapSpellTemplate: SpriteArtwork = {
  name: "Trap",
  terminal: { layers: [{ char: "%", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "≡", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0103", color: TEMPLATE_COLORS.transparent },
    { char: "\u011c", color: TEMPLATE_COLORS.materialPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
  ],
};
const trapSpellElementTemplate: SpriteArtwork = {
  name: "Trap",
  terminal: { layers: [{ char: "%", color: TEMPLATE_COLORS.elementPrimary }] },
  layers: [
    { char: "≡", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0103", color: TEMPLATE_COLORS.transparent },
    { char: "\u011c", color: TEMPLATE_COLORS.elementPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
  ],
};
export const trapSpell = createTemplate("trap_spell", {
  sprite: trapSpellTemplate,
  materialElementSprite: trapSpellElementTemplate,
});

const dashSpellTemplate: SpriteArtwork = {
  name: "Dash",
  terminal: { layers: [{ char: "«", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
    { char: "»", color: TEMPLATE_COLORS.materialPrimary },
    { char: ">", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const dashSpellElementTemplate: SpriteArtwork = {
  name: "Dash",
  terminal: { layers: [{ char: "«", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "-", color: TEMPLATE_COLORS.materialPrimary },
    { char: "»", color: TEMPLATE_COLORS.elementPrimary },
    { char: ">", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const dashSpell = createTemplate("dash_spell", {
  sprite: dashSpellTemplate,
  materialElementSprite: dashSpellElementTemplate,
});

// secondary skills

const zapTemplate: SpriteArtwork = {
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
export const zap = createTemplate("zap", { sprite: zapTemplate });

const bowTemplate: SpriteArtwork = {
  name: "Bow",
  layers: [{ char: "}", color: TEMPLATE_COLORS.materialPrimary }],
};
const bowElementTemplate: SpriteArtwork = {
  name: "Bow",
  layers: [
    { char: "}", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const bow = createTemplate("bow", {
  sprite: bowTemplate,
  materialElementSprite: bowElementTemplate,
});

const slashTemplate: SpriteArtwork = {
  name: "Slash",
  terminal: { layers: [{ char: "@", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u03c3", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: ";", color: TEMPLATE_COLORS.materialPrimary },
    { char: "°", color: TEMPLATE_COLORS.transparent },
    { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const slashElementTemplate: SpriteArtwork = {
  name: "Slash",
  terminal: { layers: [{ char: "@", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u03c3", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: ";", color: TEMPLATE_COLORS.materialPrimary },
    { char: "°", color: TEMPLATE_COLORS.transparent },
    { char: "∙", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const slash = createTemplate("slash", {
  sprite: slashTemplate,
  materialElementSprite: slashElementTemplate,
});

const blockTemplate: SpriteArtwork = {
  name: "Block",
  terminal: { layers: [{ char: "O", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "0", color: TEMPLATE_COLORS.materialPrimary },
    { char: "=", color: TEMPLATE_COLORS.transparent },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: "\u0108", color: TEMPLATE_COLORS.transparent },
  ],
};
export const block = createTemplate("block", { sprite: blockTemplate });

const totemTemplate: SpriteArtwork = {
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
export const totem = createTemplate("totem", { sprite: totemTemplate });

// tools

const compassTemplate: SpriteArtwork = {
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
export const compass = createTemplate("compass", { sprite: compassTemplate });

const torchTemplate: SpriteArtwork = {
  name: "Torch",
  terminal: { layers: [{ char: "î", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "┐", color: TEMPLATE_COLORS.materialPrimary },
    { char: "─", color: TEMPLATE_COLORS.transparent },
    { char: "*", color: colors.red },
    { char: "+", color: colors.yellow },
  ],
};
const torchGold: Sprite = namedSprite("torch_gold", {
  name: "Torch",
  terminal: { layers: [{ char: "î", color: colors.yellow }] },
  layers: [
    { char: "┐", color: colors.olive },
    { char: "─", color: colors.black },
    { char: "*", color: colors.red },
    { char: "+", color: colors.yellow },
  ],
});
export const torch = createTemplate("torch", { sprite: torchTemplate });
torch.gold.default = torchGold;

const mapTemplate: SpriteArtwork = {
  name: "Map",
  terminal: { layers: [{ char: "#", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "■", color: TEMPLATE_COLORS.materialSecondary },
    { char: "≡", color: TEMPLATE_COLORS.materialPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
    { char: "+", color: TEMPLATE_COLORS.materialSecondary },
    { char: "·", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const map = createTemplate("map", {
  sprite: mapTemplate,
  invertWoodIron: true,
});

for (const [template, char] of [
  [wand, ";"],
  [shovel, "\u0118"],
  [axe, "7"],
  [pickaxe, "\u0119"],
  [hook, "Γ"],
] as const)
  for (const material of ["wood", "iron"] as const)
    for (const sprite of Object.values(template[material]))
      sprite.terminal = {
        layers: [{ char, color: colorPalettes[material].primary }],
      };
