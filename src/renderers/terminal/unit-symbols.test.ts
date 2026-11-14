import { colors } from "../../game/assets/colors";
import * as sprites from "../../game/assets/sprites";
import { eye } from "../../game/assets/templates/creatures";
import { banner } from "../../game/assets/templates/particles";
import { projectSprite } from "./sprites";

it("keeps furniture, terrain and small units recognizable using authored terminal characters", () => {
  for (const [sprite, char, foreground] of [
    [sprites.egg, "•", colors.white],
    [sprites.dummy, "Ω", colors.white],
    [sprites.anvil, "▬", colors.silver],
    [sprites.kettle, "U", colors.blue],
    [sprites.table, "╥", colors.maroon],
    [sprites.chairLeft, "└", colors.maroon],
    [sprites.chairRight, "┘", colors.maroon],
    [sprites.sand, "%", colors.yellow],
    [sprites.beach, "%", colors.yellow],
    [sprites.gravel1, "%", colors.grey],
    [sprites.gravel2, "%", colors.grey],
  ] as const)
    expect(projectSprite(sprite)).toMatchObject({ char, foreground });
});

it("uses a filled face for the golem head and keeps the sleeping rock formation solid", () => {
  expect(projectSprite(sprites.golemUnit)).toMatchObject({
    char: "☻",
    foreground: colors.silver,
  });
  expect(projectSprite(sprites.golem)).toMatchObject({
    char: "█",
    foreground: colors.silver,
  });
  for (const direction of ["up", "right", "down", "left"] as const)
    expect(projectSprite(sprites.golem, direction)).toMatchObject({
      char: "☻",
      foreground: colors.silver,
    });
});

it("keeps the eye and placed totem variants consistent in every material and direction", () => {
  for (const [material, foreground] of [
    ["wood", colors.maroon],
    ["iron", colors.grey],
    ["gold", colors.yellow],
    ["diamond", colors.aqua],
    ["ruby", colors.fuchsia],
  ] as const) {
    expect(projectSprite(eye[material].default)).toMatchObject({
      char: "O",
      foreground,
    });
    for (const direction of ["up", "right", "down", "left"] as const)
      expect(projectSprite(eye[material].default, direction)).toMatchObject({
        char: "Ö",
        foreground,
      });
    expect(projectSprite(banner[material].default)).toMatchObject({
      char: "t",
      foreground,
    });
  }
});
