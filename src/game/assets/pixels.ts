import { Orientation } from "../../engine/components/orientable";
import { pixelCircle } from "../math/tracing";
import { Sprite } from "../../engine/components/sprite";
import { ClassKey } from "../balancing/classes";
import { rotateOrientation } from "../math/path";
import { padCenter, repeat, reversed } from "../math/std";
import { colors } from "./colors";
import { none } from "./sprites";
import {
  addForeground,
  createText,
  mergeSprites,
  parseSprite,
  recolorSprite,
} from "./ui";

export const recolorLine = (
  line: Sprite[],
  colorOrMap: string | Record<string, string>
) => line.map((pixel) => recolorSprite(pixel, colorOrMap));

export const recolorPixels = (
  pixels: Sprite[][],
  colorOrMap: string | Record<string, string>
) => pixels.map((line) => recolorLine(line, colorOrMap));

export const pixelate = (...lines: string[]) =>
  lines.map((line) => line.split(" ").map(parseSprite));

export const centerSprites = (
  line: Sprite[],
  width: number,
  placeholder = none
) => [
  ...repeat(placeholder, Math.floor((width - line.length) / 2)),
  ...line,
  ...repeat(placeholder, Math.ceil((width - line.length) / 2)),
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

export const getCircleOrientations = (radius?: number) => {
  let quarterCircle: {
    x: number;
    y: number;
    orientation: Orientation;
    corner?: boolean;
  }[] = [
    { x: 10, y: 0, orientation: "right" },
    { x: 10, y: 1, orientation: "right" },
    { x: 10, y: 2, orientation: "down", corner: true },
    { x: 9, y: 2, orientation: "up", corner: true },
    { x: 9, y: 3, orientation: "right" },
    { x: 9, y: 4, orientation: "down", corner: true },
    { x: 8, y: 4, orientation: "down" },
    { x: 7, y: 4, orientation: "up", corner: true },
    { x: 7, y: 5, orientation: "down", corner: true },
    { x: 6, y: 5, orientation: "down" },
    { x: 5, y: 5, orientation: "down" },
    { x: 4, y: 5, orientation: "up", corner: true },
    { x: 4, y: 6, orientation: "down", corner: true },
    { x: 3, y: 6, orientation: "down" },
    { x: 2, y: 6, orientation: "down" },
    { x: 1, y: 6, orientation: "down" },
    { x: 0, y: 6, orientation: "down" },
  ];

  if (radius !== undefined) {
    const cells = pixelCircle({ x: 0, y: 0 }, radius, undefined, true);
    const bottom = Math.max(...cells.map((cell) => cell.y));
    let previousX =
      Math.max(...cells.filter((cell) => cell.y === 0).map((cell) => cell.x)) +
      1;
    quarterCircle = [{ x: previousX, y: 0, orientation: "right" }];
    for (let y = 1; y <= bottom + 1; y += 1) {
      const row = cells.filter((cell) => cell.y === y);
      const x = row.length ? Math.max(...row.map((cell) => cell.x)) + 1 : 0;
      if (x === previousX) {
        quarterCircle.push({ x, y, orientation: "right" });
      } else {
        quarterCircle.push({
          x: previousX,
          y,
          orientation: "down",
          corner: true,
        });
        for (let offsetX = previousX - 1; offsetX > x; offsetX -= 1) {
          quarterCircle.push({ x: offsetX, y, orientation: "down" });
        }
        quarterCircle.push({
          x,
          y,
          orientation: x === 0 ? "down" : "up",
          corner: x !== 0,
        });
      }
      previousX = x;
    }
  }

  const fullCircle = [];
  for (let orientationIndex = 0; orientationIndex < 4; orientationIndex += 1) {
    const flipVertical = orientationIndex === 0 || orientationIndex === 3;
    const flipHorizontal = orientationIndex >= 2;
    const flippedQuarter =
      flipHorizontal !== flipVertical
        ? [...reversed(quarterCircle)]
        : quarterCircle;

    // skip last element to be placed by next quarter
    for (
      let quarterIndex = 0;
      quarterIndex < flippedQuarter.length - 1;
      quarterIndex += 1
    ) {
      const segment = flippedQuarter[quarterIndex];
      fullCircle.push({
        x: flipHorizontal ? -segment.x : segment.x,
        y: flipVertical ? -segment.y : segment.y,
        orientation: segment.corner
          ? rotateOrientation(segment.orientation, orientationIndex - 1)
          : segment.orientation,
        corner: segment.corner,
      });
    }
  }

  return fullCircle;
};

export const kettlePixels = pixelate(
  "\x08▄ \x08▄     \x08▄ \x08▄",
  "\x08█ \x08█ \x0c█ \x0c█ \x0c█ \x0c█ \x08█ \x08█",
  "\x08█ \x08█ \x0c█ \x0c█ \x0c█ \x0c█ \x08█ \x08█",
  "\x08▀ \x08█ \x08█ \x08▀ \x08▀ \x08█ \x08█ \x08▀"
);

export const anvilPixels = pixelate(
  "\x08█ \x08█ \x08█ \x08█ \x08█ \x08█",
  "\x07▄ \x08█ \x08█ \x08█ \x08█ \x07▄",
  "  \x08█ \x08█",
  "\x08▀ \x08▀ \x08▀ \x08▀ \x08▀ \x08▀"
);

export const anviOffsetPixels = pixelate(
  "\x08▄ \x08▄ \x08▄ \x08▄ \x08▄ \x08▄",
  "\x08▀ \x08█ \x08█ \x08█ \x08█ \x08▀",
  "\x07▀ \x08▀ \x08█ \x08█ \x08▀ \x07▀",
  "\x08▄ \x08▄ \x08█ \x08█ \x08▄ \x08▄"
);

export const anvilLargePixels = pixelate(
  "\x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█",
  "\x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█",
  "  \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█",
  "\x07█ \x07█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x07█ \x07█",
  "    \x08█ \x08█ \x08█ \x08█",
  "    \x08█ \x08█ \x08█ \x08█",
  "\x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█ \x08█"
);

export const brewingPixels = pixelate("", "   \x0f▄ \x0f▄", "   \x04▀ \x04▀");

export const bodyPixels = pixelate(
  "",
  "\x07▄ \x07█ \x07▀ \x07▀ \x07█ \x07▄",
  "\x07█ \x07█   \x07█ \x07█",
  "\x07▀ \x07█ \x07▄ \x07▄ \x07█ \x07▀",
  "\x07▄ \x07▄ \x07█ \x07█ \x07▄ \x07▄",
  "  \x07█ \x07█"
);

export const magePixels = pixelate(
  " \x0f▄ \x0f▄ \x0f▄  \x0f▄ \x0f\u0107\u0106\x00▀",
  "\x0f▀ \x0f▀  \x0f▀ \x0f▀ \x0f▀"
);

export const roguePixels = pixelate("  \x0f▄ \x0f█ \x0f█");

export const knightPixels = pixelate(
  "  \x0f▄ \x0f█ \x0f▄",
  "\x0f▄ \x0f█ \x0f▀  \x0f▀ \x0f█ \x0f\u0107\u0106\x00▀"
);

export const alienPixels = pixelate(
  "\x0f▄ \x0f▄    \x0f▄ \x0f\u0107\u0106\x00▀",
  "     \x0f▀"
);

export const swordPixels = pixelate(
  "",
  "",
  "     \x0f▄ \x0f\u0107\u0106",
  "   \x0f▄ \x0f█ \x0f▀",
  " \x0f▄ \x0f█ \x0f▀",
  "\x0f█ \x0f▀"
);

export const spearPixels = pixelate(
  "",
  "",
  "",
  "\x0f▄ \x0f▄ \x0f▄ \x0f▄ \x0f▄ \x0f▄ \x0f▄"
);

export const wandPixels = pixelate(
  "",
  "",
  "",
  "  \x08▄ \x0f▄\x08▀ \x0f▄\x08▀ \x08▄",
  "  \x08▀ \x0f▀\x08▄ \x0f▀\x08▄ \x08▀",
  "   \x0f█ \x0f█"
);

export const weaponElementPixels = pixelate("", "", "", "   \x0f▄ \x0f▄");

export const shieldPixels = pixelate(
  "",
  "",
  "",
  "\x0f▀ \x0f▀ \x0f▀ \x0f▀ \x0f▀ \x0f█ \x0f\u0107\u0106",
  "     \x0f█ \x0f\u0107\u0106",
  "     \x0f▀ \x0f\u0107\u0106\x00▄"
);

export const shieldElementPixels = pixelate("", "", "", "\x0f▄");

export const displayedClasses = [
  "rogue",
  "knight",
  "mage",
  "???",
] as ClassKey[];

export const hairColors = [
  {
    name: "Brown",
    color: colors.maroon,
  },
  {
    name: "Blonde",
    color: colors.olive,
  },
  {
    name: "Golden",
    color: colors.yellow,
  },
  {
    name: "White",
    color: colors.white,
  },
  {
    name: "Grey",
    color: colors.grey,
  },
  {
    name: "Purple",
    color: colors.purple,
  },
  {
    name: "Pink",
    color: colors.fuchsia,
  },
];
