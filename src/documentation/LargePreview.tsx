import { Item } from "../engine/components/item";
import { Sprite } from "../engine/components/sprite";
import { getItemSprite } from "../game/assets/utils";
import { getFacingLayers, mergeSprites } from "../game/assets/ui";
import { colors } from "../game/assets/colors";
import {
  composeCharacterPixels,
  characterWidth,
} from "../components/Row/characters";
import { Pixels } from "./visuals";
export function LargePreview({
  item,
  unit,
}: {
  item?: Partial<Item>;
  unit?: { sprite: Sprite; backdrop?: Sprite };
}) {
  const sprite =
    (unit?.backdrop
      ? mergeSprites(unit.backdrop, unit.sprite)
      : unit?.sprite) ||
    getItemSprite(
      {
        ...item,
        ...(item?.spell && !item.element ? { element: "fire" as const } : {}),
        ...(item?.consume === "potion" && !item.stat
          ? { stat: "hp" as const }
          : {}),
      },
      "display"
    );
  return (
    <Pixels
      className="LargePreview"
      label={sprite.name || "Unit preview"}
      rows={previewRows(sprite)}
    />
  );
}

export function previewRows(sprite: Sprite): Sprite[][] {
  const pixels = composeCharacterPixels(getFacingLayers(sprite));
  const occupied = pixels.flatMap((color, index) =>
    color && color !== colors.black ? [index] : []
  );
  if (!occupied.length) return [];
  const left = Math.min(...occupied.map((index) => index % characterWidth));
  const right = Math.max(...occupied.map((index) => index % characterWidth));
  const top = Math.min(
    ...occupied.map((index) => Math.floor(index / characterWidth))
  );
  const bottom = Math.max(
    ...occupied.map((index) => Math.floor(index / characterWidth))
  );
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
