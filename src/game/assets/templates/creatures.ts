import { createTemplate, TEMPLATE_COLORS } from ".";
import { SpriteArtwork } from "../../../engine/components/sprite";

const prismTemplate: SpriteArtwork = {
  name: "Prism",
  layers: [{ char: "\u010f", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "\u011d", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "\u010f", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "\u011e", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "\u0110", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const prism = createTemplate("prism", { sprite: prismTemplate });

const orbTemplate: SpriteArtwork = {
  name: "Orb",
  layers: [{ char: "Φ", color: TEMPLATE_COLORS.materialPrimary }],
};
export const orb = createTemplate("orb", { sprite: orbTemplate });

const eyeTemplate: SpriteArtwork = {
  name: "Eye",
  terminal: {
    layers: [{ char: "O", color: TEMPLATE_COLORS.materialPrimary }],
    facing: {
      up: [{ char: "Ö", color: TEMPLATE_COLORS.materialPrimary }],
      right: [{ char: "Ö", color: TEMPLATE_COLORS.materialPrimary }],
      down: [{ char: "Ö", color: TEMPLATE_COLORS.materialPrimary }],
      left: [{ char: "Ö", color: TEMPLATE_COLORS.materialPrimary }],
    },
  },
  layers: [
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: "·", color: TEMPLATE_COLORS.materialPrimary },
  ],
  facing: {
    up: [
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.transparent },
    ],
    right: [
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.transparent },
    ],
    down: [
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.transparent },
    ],
    left: [
      { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
      { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
      { char: "∙", color: TEMPLATE_COLORS.transparent },
    ],
  },
};
export const eye = createTemplate("eye", { sprite: eyeTemplate });

const beamTowerTemplate: SpriteArtwork = {
  name: "Tower",
  layers: [
    { char: "│", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.transparent },
    { char: "0", color: TEMPLATE_COLORS.materialSecondary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const beamTower = createTemplate("beam_tower", {
  sprite: beamTowerTemplate,
});

const waveTowerTemplate: SpriteArtwork = {
  name: "Tower",
  layers: [
    { char: "Y", color: TEMPLATE_COLORS.materialPrimary },
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const waveTower = createTemplate("wave_tower", {
  sprite: waveTowerTemplate,
});

const cubeTemplate: SpriteArtwork = {
  name: "Cube",
  layers: [
    { char: "■", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: "=", color: TEMPLATE_COLORS.materialPrimary },
    { char: "±", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const cube = createTemplate("cube", { sprite: cubeTemplate });
