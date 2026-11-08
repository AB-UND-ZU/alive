import { Item } from "../engine/components/item";
import { Sprite } from "../engine/components/sprite";
import { getItemSprite } from "../game/assets/utils";
import { getFacingLayers, mergeSprites } from "../game/assets/ui";
import { colors } from "../game/assets/colors";
import {
  composeCharacterPixels,
  characterWidth,
  characterHeight,
} from "../components/Row/characters";
import { Pixels } from "./visuals";
import { previewItem } from "./catalog";
export type PreviewBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
export function previewBounds(
  sprites: (Sprite | Sprite[])[]
): PreviewBounds | undefined {
  const points = sprites.flatMap((sprite) =>
    (Array.isArray(sprite) ? sprite : [sprite])
      .flatMap((part) => composeCharacterPixels(getFacingLayers(part)))
      .flatMap((color, index) =>
        color && color !== colors.black ? [index] : []
      )
  );
  if (!points.length) return;
  return {
    left: Math.min(...points.map((index) => index % characterWidth)),
    right: Math.max(...points.map((index) => index % characterWidth)),
    top: Math.min(...points.map((index) => Math.floor(index / characterWidth))),
    bottom: Math.max(
      ...points.map((index) => Math.floor(index / characterWidth))
    ),
  };
}
export function LargePreview({
  item,
  unit,
  sprites,
  grid,
  bounds,
}: {
  item?: Partial<Item>;
  unit?: { sprite: Sprite; backdrop?: Sprite };
  sprites?: Sprite[];
  grid?: Sprite[][];
  bounds?: PreviewBounds;
}) {
  const sprite =
    sprites?.[0] ||
    (unit?.backdrop
      ? mergeSprites(unit.backdrop, unit.sprite)
      : unit?.sprite) ||
    getItemSprite(previewItem(item || {}), "display");
  return (
    <Pixels
      className="LargePreview"
      label={sprite.name || "Unit preview"}
      rows={
        grid ? previewGridRows(grid) : previewRows(sprites || sprite, bounds)
      }
    />
  );
}

export function previewRows(
  sprite: Sprite | Sprite[],
  bounds?: PreviewBounds
): Sprite[][] {
  const pixels = (Array.isArray(sprite) ? sprite : [sprite]).flatMap((part) =>
    composeCharacterPixels(getFacingLayers(part))
  );
  const crop = bounds || previewBounds([sprite]);
  if (!crop) return [];
  const { left, right, top, bottom } = crop;
  const rows: Sprite[][] = [];
  for (let y = top; y <= bottom; y += 2)
    rows.push(
      Array.from({ length: right - left + 1 }, (_, offset) => {
        const x = left + offset;
        return {
          name: "preview_pixel_pair",
          layers: [
            {
              char: "▀",
              color: pixels[y * characterWidth + x] || colors.black,
            },
            {
              char: "▄",
              color:
                y < bottom
                  ? pixels[(y + 1) * characterWidth + x] || colors.black
                  : colors.black,
            },
          ],
        };
      })
    );
  return rows;
}

export function previewGridRows(grid: Sprite[][]): Sprite[][] {
  const width = Math.max(...grid.map((row) => row.length), 0) * characterWidth;
  const pixels: (string | undefined)[] = Array(
    width * grid.length * characterHeight
  );
  grid.forEach((row, y) =>
    row.forEach((sprite, x) => {
      composeCharacterPixels(getFacingLayers(sprite)).forEach(
        (color, index) => {
          pixels[
            (y * characterHeight + Math.floor(index / characterWidth)) * width +
              x * characterWidth +
              (index % characterWidth)
          ] = color;
        }
      );
    })
  );
  const points = pixels.flatMap((color, index) =>
    color && color !== colors.black ? [index] : []
  );
  if (!points.length) return [];
  const left = Math.min(...points.map((i) => i % width)),
    right = Math.max(...points.map((i) => i % width));
  const top = Math.min(...points.map((i) => Math.floor(i / width))),
    bottom = Math.max(...points.map((i) => Math.floor(i / width)));
  const rows: Sprite[][] = [];
  for (let y = top; y <= bottom; y += 2)
    rows.push(
      Array.from({ length: right - left + 1 }, (_, offset) => ({
        name: "preview_pixel_pair",
        layers: [
          {
            char: "▀",
            color: pixels[y * width + left + offset] || colors.black,
          },
          {
            char: "▄",
            color:
              y < bottom
                ? pixels[(y + 1) * width + left + offset] || colors.black
                : colors.black,
          },
        ],
      }))
    );
  return rows;
}
