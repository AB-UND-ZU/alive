import { previewRows, previewBounds, previewGridRows } from "./LargePreview";
import { colors } from "../game/assets/colors";
import { getUnitSprite } from "../game/assets/utils";
import { leaves, stem } from "../game/assets/sprites";
import {
  characterWidth,
  composeCharacterPixels,
} from "../components/Row/characters";

describe("large sprite portraits", () => {
  it("trims transparent margins and preserves every visible pixel", () => {
    const sprite = {
      name: "Test",
      layers: [{ char: "!", color: colors.white }],
    };
    const source = composeCharacterPixels(sprite.layers);
    const occupied = source.flatMap((color, index) => (color ? [index] : []));
    const left = Math.min(...occupied.map((index) => index % characterWidth));
    const right = Math.max(...occupied.map((index) => index % characterWidth));
    const top = Math.min(
      ...occupied.map((index) => Math.floor(index / characterWidth))
    );
    const bottom = Math.max(
      ...occupied.map((index) => Math.floor(index / characterWidth))
    );
    const rows = previewRows(sprite);
    expect(rows).toHaveLength(Math.ceil((bottom - top + 1) / 2));
    expect(rows.every((row) => row.length === right - left + 1)).toBe(true);
    rows.forEach((row, y) =>
      row.forEach((pixel, x) => {
        expect(pixel.layers[0].color).toBe(
          source[(top + y * 2) * characterWidth + left + x] || colors.black
        );
        expect(pixel.layers[1].color).toBe(
          top + y * 2 < bottom
            ? source[(top + y * 2 + 1) * characterWidth + left + x] ||
                colors.black
            : colors.black
        );
      })
    );
  });
  it("does not reserve space for empty or black sprites", () => {
    expect(previewRows({ name: "Empty", layers: [] })).toEqual([]);
    expect(
      previewRows({
        name: "Black",
        layers: [{ char: "█", color: colors.black }],
      })
    ).toEqual([]);
  });
  it("keeps an oak trunk aligned below its canopy when cropping the whole tree", () => {
    const rows = previewRows([leaves, stem]);
    const last = rows[rows.length - 1];
    expect(
      last.some((cell) =>
        cell.layers.some((layer) => layer.color === colors.maroon)
      )
    ).toBe(true);
    expect(last[0].layers.every((layer) => layer.color === colors.black)).toBe(
      true
    );
    expect(
      last[last.length - 1].layers.every(
        (layer) => layer.color === colors.black
      )
    ).toBe(true);
  });
  it("keeps related native portraits on the same cropped pixel coordinates", () => {
    const sprites = [getUnitSprite("cactus1"), getUnitSprite("cactus2")];
    const bounds = previewBounds(sprites)!;
    const rows = sprites.map((sprite) => previewRows(sprite, bounds));
    expect(rows[0].length).toBe(rows[1].length);
    expect(
      rows[0].every((row) => row.length === bounds.right - bounds.left + 1)
    ).toBe(true);
    expect(rows[1].every((row) => row.length === rows[0][0].length)).toBe(true);
    const native = composeCharacterPixels(sprites[0].layers);
    const first = rows[0][0][0];
    expect(first.layers[0].color).toBe(
      native[bounds.top * characterWidth + bounds.left] || colors.black
    );
  });
});

test("a large multi-cell portrait keeps horizontal fragments in their native positions", () => {
  const sprite = {
    name: "Block",
    layers: [{ char: "█", color: colors.white }],
  };
  const grid = previewGridRows([[sprite, sprite, sprite]]);
  expect(grid[0]).toHaveLength(characterWidth * 3);
  expect(grid).toHaveLength(8);
  expect(
    grid.every((row) =>
      row.every((cell) =>
        cell.layers.every((layer) => layer.color === colors.white)
      )
    )
  ).toBe(true);
});
