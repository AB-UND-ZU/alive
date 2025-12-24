import { Element, Material } from "../../engine/components/item";
import { Sprite } from "../../engine/components/sprite";
import { padCenter, repeat } from "../math/std";
import { brightColors, colors, recolor } from "./colors";
import {
  addForeground,
  createText,
  mergeSprites,
  none,
  parseSprite,
} from "./sprites";

export const recolorSprite = (
  sprite: Sprite,
  colorOrMap: string | Record<string, string>
): Sprite => ({
  ...sprite,
  layers: sprite.layers.map((layer) => ({
    ...layer,
    color: recolor(layer.color, colorOrMap),
  })),
});

export const brightenSprites = (sprites: Sprite[]) =>
  sprites.map((sprite) => recolorSprite(sprite, brightColors));

export const recolorLine = (
  line: Sprite[],
  colorOrMap: string | Record<string, string>
) => line.map((pixel) => recolorSprite(pixel, colorOrMap));

export const recolorPixels = (
  pixels: Sprite[][],
  colorOrMap: string | Record<string, string>
) => pixels.map((line) => recolorLine(line, colorOrMap));

export const materialElementColors: Record<Material | Element, string> = {
  wood: colors.maroon,
  iron: colors.grey,
  gold: colors.yellow,
  diamond: colors.aqua,
  ruby: colors.fuchsia,
  air: colors.white,
  fire: colors.red,
  water: colors.blue,
  earth: colors.lime,
};

export const pixelate = (...lines: string[]) =>
  lines.map((line) => line.split(" ").map(parseSprite));

export const centerSprites = (line: Sprite[], width: number) => [
  ...repeat(none, Math.floor((width - line.length) / 2)),
  ...line,
  ...repeat(none, Math.ceil((width - line.length) / 2)),
];

export const centerLayer = (layer: Sprite[][], width: number) =>
  layer.map((line) => centerSprites(line, width));

export const overlay = (...layers: Sprite[][][]) => {
  const merged: Sprite[][] = [];

  layers.forEach((lines) => {
    lines.forEach((line, rowIndex) => {
      if (rowIndex >= merged.length) {
        merged.push([]);
      }

      const row = merged[rowIndex];
      line.forEach((sprite, columnIndex) => {
        if (columnIndex >= row.length) {
          row.push(sprite);
          return;
        }

        const cell = row[columnIndex];
        row[columnIndex] = mergeSprites(cell, sprite);
      });
    });
  });

  return merged;
};

export const pixelFrame = (
  width: number,
  height: number,
  color: string,
  type: "solid" | "dotted" | "thick" | "dashed" = "solid",
  content?: Sprite[][],
  title?: Sprite[],
  flipped = false
) => {
  const contentLayer = content
    ? [[], ...content.map((line) => [none, ...line])]
    : [];
  const titleLayer = title
    ? [...(flipped ? repeat([], height - 1) : []), centerSprites(title, width)]
    : [];

  const crop =
    type === "solid" || type === "dotted"
      ? repeat(createText(`▌${" ".repeat(width - 2)}▐`, colors.black), height)
      : [];

  const frame = Array.from({ length: height }).map((_, rowIndex) => {
    const firstRow = rowIndex === 0;
    const lastRow = rowIndex === height - 1;
    const verticalDash = type === "dashed" ? "-" : "─";
    const horizontalDash = type === "dashed" && rowIndex % 2 === 1 ? "|" : "│";

    const line = createText(
      `${firstRow ? "┌" : lastRow ? "└" : horizontalDash}${
        (firstRow && !flipped) || (lastRow && flipped)
          ? padCenter(" ".repeat(title?.length || 0), width - 2, verticalDash)
          : (firstRow || lastRow ? verticalDash : " ").repeat(width - 2)
      }${firstRow ? "┐" : lastRow ? "┘" : horizontalDash}`,
      color
    );

    if (type === "dotted") {
      return addForeground(line, colors.black, "▒");
    }

    return line;
  });

  return overlay(frame, titleLayer, contentLayer, crop);
};

export const bodyPixels = pixelate(
  "",
  "\x07▄ \x07█ \x07▀ \x07▀ \x07█ \x07▄",
  "\x07█ \x07█   \x07█ \x07█",
  "\x07▀ \x07█ \x07▄ \x07▄ \x07█ \x07▀",
  "\x07▄ \x07▄ \x07█ \x07█ \x07▄ \x07▄",
  "  \x07█ \x07█"
);

export const magePixels = pixelate(
  " \x03▄ \x03▄ \x03▄  \x03▄ \x03\u0107\u0106\x00▀",
  "\x03▀ \x03▀  \x03▀ \x03▀ \x03▀"
);

export const roguePixels = pixelate("  \x03▄ \x03█ \x03█");

export const knightPixels = pixelate(
  "  \x03▄ \x03█ \x03▄",
  "\x03▄ \x03█ \x03▀  \x03▀ \x03█ \x03\u0107\u0106\x00▀"
);

export const alienPixels = pixelate(
  "\x03▄ \x03▄    \x03▄ \x03\u0107\u0106\x00▀",
  "     \x03▀"
);

export const swordPixels = pixelate(
  "",
  "",
  "     \x0f▄ \x0f\u0107\u0106",
  "   \x0f▄ \x0f█ \x0f▀",
  " \x0f▄ \x0f█ \x0f▀",
  "\x0f█ \x0f▀"
);

export const swordElementPixels = pixelate("", "", "", "   \x0f▄ \x0f▄");

export const shieldPixels = pixelate(
  "",
  "",
  "",
  "\x0f▀ \x0f▀ \x0f▀ \x0f▀ \x0f▀ \x0f█ \x0f\u0107\u0106",
  "     \x0f█ \x0f\u0107\u0106",
  "     \x0f▀ \x0f\u0107\u0106\x00▄"
);

export const shieldElementPixels = pixelate("", "", "", "", "   \x0f▀ \x0f▀");

export const elementColors: Record<Element, string> = {
  air: colors.white,
  fire: colors.red,
  water: colors.blue,
  earth: colors.lime,
};
