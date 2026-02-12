import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite } from "../../../engine/components/sprite";

// craftables

const spiritTemplate: Sprite = {
  name: "Spirit",
  layers: [{ char: "æ", color: TEMPLATE_COLORS.elementPrimary }],
};
export const spirit = createTemplate({
  sprite: spiritTemplate,
  materialElementSprite: spiritTemplate,
});

// consumables

const keyTemplate: Sprite = {
  name: "Key",
  layers: [
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u011c", color: TEMPLATE_COLORS.transparent },
    { char: "º", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const key = createTemplate({ sprite: keyTemplate });

const bottleTemplate: Sprite = {
  name: "Bottle",
  layers: [
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
    { char: ":", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const bottle = createTemplate({ sprite: bottleTemplate });

const potionTemplate: Sprite = {
  name: "Potion",
  layers: [
    { char: "\u011d", color: TEMPLATE_COLORS.elementPrimary },
    { char: "\u011f", color: TEMPLATE_COLORS.materialSecondary },
    { char: "°", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const potion = createTemplate({ sprite: potionTemplate });

const elixirTemplate: Sprite = {
  name: "Elixir",
  layers: [
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
    { char: "T", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const elixir = createTemplate({ sprite: elixirTemplate });
