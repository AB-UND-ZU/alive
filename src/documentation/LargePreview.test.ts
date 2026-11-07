import { previewRows } from "./LargePreview";
import { colors } from "../game/assets/colors";
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
});
