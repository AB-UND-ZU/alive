import {
  Element,
  elements,
  Material,
  materials,
} from "../../../engine/components/item";
import { Layer, Sprite } from "../../../engine/components/sprite";
import { colors, recolor } from "../colors";
import { missing } from "../sprites";

export const recolorLayers = (
  layers: Layer[],
  colorOrMap: string | Record<string, string>
): Layer[] =>
  layers.map((layer) => ({
    ...layer,
    color: recolor(layer.color, colorOrMap),
  }));

export const recolorSprite = (
  sprite: Sprite,
  colorOrMap: string | Record<string, string>
): Sprite => {
  const layers = recolorLayers(sprite.layers, colorOrMap);
  const recolored = { ...sprite, layers };

  if (sprite.facing) {
    recolored.facing = {};
    if (sprite.facing.up)
      recolored.facing.up = recolorLayers(sprite.facing.up, colorOrMap);
    if (sprite.facing.right)
      recolored.facing.right = recolorLayers(sprite.facing.right, colorOrMap);
    if (sprite.facing.down)
      recolored.facing.down = recolorLayers(sprite.facing.down, colorOrMap);
    if (sprite.facing.left)
      recolored.facing.left = recolorLayers(sprite.facing.left, colorOrMap);
  }

  if (sprite.amounts) {
    recolored.amounts = {};
    if (sprite.amounts.single)
      recolored.amounts.single = recolorLayers(
        sprite.amounts.single,
        colorOrMap
      );
    if (sprite.amounts.double)
      recolored.amounts.double = recolorLayers(
        sprite.amounts.double,
        colorOrMap
      );
    if (sprite.amounts.multiple)
      recolored.amounts.multiple = recolorLayers(
        sprite.amounts.multiple,
        colorOrMap
      );
  }

  return recolored;
};

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

export const createTemplate = ({
  sprite,
  materialElementSprite,
}: {
  sprite: Sprite;
  materialElementSprite?: Sprite;
}) => {
  const sprites: Record<
    Material | "default",
    Record<Element | "default", Sprite>
  > = {} as any;

  // material sprites
  materials.forEach((material) => {
    const materialPalette = colorPalettes[material];
    sprites[material] = {
      default: recolorSprite(sprite, {
        [TEMPLATE_COLORS.transparent]: colors.black,
        [TEMPLATE_COLORS.materialPrimary]: materialPalette.primary,
        [TEMPLATE_COLORS.materialSecondary]: materialPalette.secondary,
        [TEMPLATE_COLORS.elementPrimary]: colors.black,
        [TEMPLATE_COLORS.elementSecondary]: colors.black,
      }),
    } as any;
  });

  // pure element sprites, reusing material templates as element
  sprites.default = { default: missing } as any;
  elements.forEach((element) => {
    const elementPalette = colorPalettes[element];
    sprites.default[element] = recolorSprite(sprite, {
      [TEMPLATE_COLORS.transparent]: colors.black,
      [TEMPLATE_COLORS.materialPrimary]: elementPalette.primary,
      [TEMPLATE_COLORS.materialSecondary]: elementPalette.secondary,
      [TEMPLATE_COLORS.elementPrimary]: colors.black,
      [TEMPLATE_COLORS.elementSecondary]: colors.black,
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

      sprites[material][element] = recolorSprite(
        materialElementSprite || sprite,
        {
          [TEMPLATE_COLORS.transparent]: colors.black,
          [TEMPLATE_COLORS.materialPrimary]: materialPalette.primary,
          [TEMPLATE_COLORS.materialSecondary]: materialPalette.secondary,
          [TEMPLATE_COLORS.elementPrimary]: elementPrimary,
          [TEMPLATE_COLORS.elementSecondary]: elementPalette.secondary,
        }
      );
    });
  });

  return sprites;
};
