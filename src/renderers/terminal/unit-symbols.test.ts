import { createWorld } from "../../engine";
import { getParticleAmount } from "../../engine/systems/magic";
import { colors } from "../../game/assets/colors";
import * as sprites from "../../game/assets/sprites";
import { eye } from "../../game/assets/templates/creatures";
import { rage2 } from "../../game/assets/ui";
import { trigger, banner } from "../../game/assets/templates/particles";
import { projectSprite } from "./sprites";

it("keeps furniture, terrain and small units recognizable using authored terminal characters", () => {
  for (const [sprite, char, foreground] of [
    [sprites.egg, "•", colors.white],
    [sprites.dummy, "Ω", colors.grey],
    [sprites.pot, "&", colors.maroon],
    [sprites.anvil, "▬", colors.silver],
    [sprites.kettle, "U", colors.silver],
    [sprites.table, "╥", colors.maroon],
    [sprites.chairLeft, "└", colors.maroon],
    [sprites.chairRight, "┘", colors.maroon],
    [sprites.sand, "░", colors.black],
    [sprites.beach, "▒", colors.black],
    [sprites.gravel1, "%", colors.grey],
    [sprites.gravel2, "%", colors.grey],
  ] as const)
    expect(projectSprite(sprite)).toMatchObject({ char, foreground });
});

it("keeps the catalog golem icon separate from the original world head layers", () => {
  expect(projectSprite(sprites.golemUnit)).toMatchObject({
    char: "☻",
    foreground: colors.silver,
  });
  expect(projectSprite(sprites.golem)).toMatchObject({
    char: " ",
    foreground: colors.grey,
    background: colors.grey,
  });
  for (const direction of ["up", "right", "down", "left"] as const)
    expect(projectSprite(sprites.golem, direction)).toMatchObject({
      char: "○",
      foreground: colors.olive,
      background: colors.grey,
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

it("uses a backslash for placed traps and keeps the rage symbol on a red background", () => {
  expect(projectSprite(trigger.iron.default)).toMatchObject({ char: "\\" });
  expect(projectSprite(trigger.iron.fire)).toMatchObject({ char: "\\" });
  expect(projectSprite(rage2)).toMatchObject({
    char: "‼",
    foreground: colors.black,
    background: colors.red,
  });
});

it("uses circles only for zero damage and crosses for positive damage", () => {
  const world = createWorld();
  for (const sprite of [sprites.meleeHit, sprites.magicHit, sprites.trueHit])
    for (const [damage, char] of [
      [0, "o"],
      [1, "x"],
      [2, "x"],
      [3, "x"],
      [4, "x"],
      [5, "X"],
      [10, "X"],
    ] as const)
      expect(
        projectSprite(sprite, undefined, getParticleAmount(world, damage)).char
      ).toBe(char);
});
