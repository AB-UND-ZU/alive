import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite } from "../../../engine/components/sprite";

const prismTemplate: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: TEMPLATE_COLORS.materialPrimary }],
  facing: {
    up: [{ char: "\u011d", color: TEMPLATE_COLORS.materialPrimary }],
    right: [{ char: "\u010f", color: TEMPLATE_COLORS.materialPrimary }],
    down: [{ char: "\u011e", color: TEMPLATE_COLORS.materialPrimary }],
    left: [{ char: "\u0110", color: TEMPLATE_COLORS.materialPrimary }],
  },
};
export const prism = createTemplate({ sprite: prismTemplate });

const orbTemplate: Sprite = {
  name: "Orb",
  layers: [{ char: "Φ", color: TEMPLATE_COLORS.materialPrimary }],
};
export const orb = createTemplate({ sprite: orbTemplate });

const eyeTemplate: Sprite = {
  name: "Eye",
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
export const eye = createTemplate({ sprite: eyeTemplate });

const beamTowerTemplate: Sprite = {
  name: "Tower",
  layers: [
    { char: "│", color: TEMPLATE_COLORS.materialPrimary },
    { char: "|", color: TEMPLATE_COLORS.transparent },
    { char: "0", color: TEMPLATE_COLORS.materialSecondary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: "∙", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const beamTower = createTemplate({ sprite: beamTowerTemplate });

const waveTowerTemplate: Sprite = {
  name: "Tower",
  layers: [
    { char: "Y", color: TEMPLATE_COLORS.materialPrimary },
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const waveTower = createTemplate({ sprite: waveTowerTemplate });

const cubeTemplate: Sprite = {
  name: "Cube",
  layers: [
    { char: "■", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.transparent },
    { char: "=", color: TEMPLATE_COLORS.materialPrimary },
    { char: "±", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const cube = createTemplate({ sprite: cubeTemplate });
