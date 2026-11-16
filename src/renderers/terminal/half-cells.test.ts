import { colors, orderedColors } from "../../game/assets/colors";
import { createText } from "../../game/assets/ui";
import { projectLayers, projectSprite } from "./sprites";

it("keeps both pixel colors using a lower block over the upper background", () => {
  for (const upper of orderedColors)
    for (const lower of orderedColors)
      for (const name of [
        "text_generic",
        "popup_background",
        "sprite_pixel_pair",
        "block_up",
        "block_down",
      ]) {
        const cell = projectLayers(
          [
            { char: "▀", color: upper },
            { char: "▄", color: lower },
          ],
          name
        );
        expect(cell).toEqual(
          upper === lower
            ? {
                char: upper === colors.black ? " " : "█",
                foreground: upper,
                background: lower,
              }
            : { char: "▄", foreground: lower, background: upper }
        );
      }
});

it("draws upper-only artwork with a colored background and black lower block", () => {
  for (const color of orderedColors.filter((color) => color !== colors.black))
    expect(projectSprite(createText("▀", color)[0])).toEqual({
      char: "▄",
      foreground: colors.black,
      background: color,
    });
});

it("uses the same half-cell representation for minimap pixels", () => {
  for (const upper of orderedColors.filter((color) => color !== colors.black))
    for (const lower of orderedColors.filter(
      (color) => color !== colors.black
    )) {
      const cell = projectLayers(
        [
          { char: "█", color: upper },
          { char: "▄", color: lower },
        ],
        "map_pixel"
      );
      expect(cell).toEqual({ char: "▄", foreground: lower, background: upper });
    }
});
