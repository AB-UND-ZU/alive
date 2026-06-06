import {
  Element,
  elements,
  Material,
  materials,
} from "../../../engine/components/item";
import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";
import { missing } from "../sprites";
import { recolorSprite } from "../ui";

export const colorPalettes: Record<
  Material | Element,
  { primary: string; secondary: string }
> = {
  wood: { primary: colors.maroon, secondary: colors.grey },
  iron: { primary: colors.grey, secondary: colors.silver },
  gold: { primary: colors.yellow, secondary: colors.olive },
  diamond: { primary: colors.aqua, secondary: colors.teal },
  ruby: { primary: colors.fuchsia, secondary: colors.purple },

  air: { primary: colors.white, secondary: colors.silver },
  fire: { primary: colors.red, secondary: colors.maroon },
  water: { primary: colors.blue, secondary: colors.navy },
  earth: { primary: colors.lime, secondary: colors.green },
};

export const TEMPLATE_COLORS = {
  transparent: "TRANSPARENT",
  materialPrimary: "MATERIAL_PRIMARY",
  materialSecondary: "MATERIAL_SECONDARY",
  elementPrimary: "ELEMENT_PRIMARY",
  elementSecondary: "ELEMENT_SECONDARY",
};

export type SpriteTemplate = Record<
  Material | "default",
  Record<Element | "default", Sprite>
>;
export type PartialSpriteTemplate = Partial<
  Record<Material | "default", Partial<Record<Element | "default", Sprite>>>
>;

export const createTemplate = ({
  sprite,
  elementSprite,
  materialElementSprite,
  invertWoodIron,
}: {
  sprite: Sprite;
  elementSprite?: Sprite;
  materialElementSprite?: Sprite;
  invertWoodIron?: boolean;
}) => {
  const sprites: SpriteTemplate = {} as any;

  // material sprites
  materials.forEach((material) => {
    const materialPalette = colorPalettes[material];
    const shouldInvert = invertWoodIron && ["wood", "iron"].includes(material);
    const materialPrimary = shouldInvert
      ? materialPalette.secondary
      : materialPalette.primary;
    const materialSecondary = shouldInvert
      ? materialPalette.primary
      : materialPalette.secondary;
    sprites[material] = {
      default: recolorSprite(sprite, {
        [TEMPLATE_COLORS.transparent]: colors.black,
        [TEMPLATE_COLORS.materialPrimary]: materialPrimary,
        [TEMPLATE_COLORS.materialSecondary]: materialSecondary,
        [TEMPLATE_COLORS.elementPrimary]: colors.black,
        [TEMPLATE_COLORS.elementSecondary]: colors.black,
      }),
    } as any;
  });

  // pure element sprites, reusing material templates as element
  sprites.default = { default: missing } as any;
  elements.forEach((element) => {
    const elementPalette = colorPalettes[element];
    sprites.default[element] = recolorSprite(elementSprite || sprite, {
      [TEMPLATE_COLORS.transparent]: colors.black,
      [TEMPLATE_COLORS.materialPrimary]: elementSprite
        ? colors.black
        : elementPalette.primary,
      [TEMPLATE_COLORS.materialSecondary]: elementSprite
        ? colors.black
        : elementPalette.secondary,
      [TEMPLATE_COLORS.elementPrimary]: elementSprite
        ? elementPalette.primary
        : colors.black,
      [TEMPLATE_COLORS.elementSecondary]: elementSprite
        ? elementPalette.secondary
        : colors.black,
    });
  });

  // material and element sprites
  materials.forEach((material) => {
    const materialPalette = colorPalettes[material];
    elements.forEach((element) => {
      const elementPalette = colorPalettes[element];

      // fix low constrast on air element with gold material
      const elementPrimary =
        material === "gold" && element === "air"
          ? colors.grey
          : elementPalette.primary;

      // invert wood and iron for contrast with player
      const shouldInvert =
        invertWoodIron && ["wood", "iron"].includes(material);
      const materialPrimary = shouldInvert
        ? materialPalette.secondary
        : materialPalette.primary;
      const materialSecondary = shouldInvert
        ? materialPalette.primary
        : materialPalette.secondary;

      sprites[material][element] = recolorSprite(
        materialElementSprite || sprite,
        {
          [TEMPLATE_COLORS.transparent]: colors.black,
          [TEMPLATE_COLORS.materialPrimary]: materialPrimary,
          [TEMPLATE_COLORS.materialSecondary]: materialSecondary,
          [TEMPLATE_COLORS.elementPrimary]: elementPrimary,
          [TEMPLATE_COLORS.elementSecondary]: elementPalette.secondary,
        }
      );
    });
  });

  return sprites;
};
