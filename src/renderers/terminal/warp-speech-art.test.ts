import { createAreaWorld } from "../../testing/harness";
import { levelConfig } from "../../game/levels";
import { colors } from "../../game/assets/colors";
import { getWarpMap } from "../../game/assets/warp";
import {
  bubbleUp,
  bubbleRight,
  bubbleDown,
  bubbleLeft,
  shoutUp,
  shoutRight,
  shoutDown,
  shoutLeft,
  allyLine,
} from "../../game/assets/sprites";
import { frameWidth } from "../../game/assets/utils";
import { projectSprite } from "./sprites";

it.each([
  ["LEVEL_MENU", colors.white, false],
  ["LEVEL_TUTORIAL", colors.lime, false],
  ["LEVEL_ISLAND", colors.red, true],
] as const)("keeps the hero marker shape for %s in the warp map", (selected, color, locked) => {
  const world = createAreaWorld("|♀∩|", { level: "LEVEL_MENU" });
  const portal = world.getEntities(["WARPABLE", "POPUP"])[0];
  portal.POPUP.horizontalIndex = portal.POPUP.tabs.indexOf("warp");
  const config = levelConfig[selected];
  portal.POPUP.verticalIndezes[portal.POPUP.horizontalIndex] = config.mapOffsetY;
  world.metadata.gameEntity.RENDERABLE.generation = 0;
  const map = getWarpMap(world, portal);
  const x = Math.floor((frameWidth - 2) / 2) + config.mapOffsetX;
  const y = config.mapOffsetY + 2;
  expect(projectSprite(map.content[y][x])).toMatchObject({
    char: "♀",
    foreground: color,
  });
  expect(map.lockedLevel).toBe(locked);
  expect(map.selection[y][x].layers).toContainEqual({
    char: locked ? "\u0100" : "\u010b",
    color,
  });
});

it("renders speech connectors in their matching bright color", () => {
  for (const [sprite, char] of [
    [bubbleUp, "╙"],
    [bubbleRight, "╜"],
    [bubbleDown, "╖"],
    [bubbleLeft, "╓"],
  ] as const) {
    expect(projectSprite(sprite)).toEqual({
      char,
      foreground: colors.white,
    });
    expect(sprite.layers[0].color).toBe(colors.silver);
  }
  for (const [sprite, char] of [
    [shoutUp, "╙"],
    [shoutRight, "╜"],
    [shoutDown, "╖"],
    [shoutLeft, "╓"],
  ] as const) {
    expect(projectSprite(sprite)).toEqual({ char, foreground: colors.red });
    expect(sprite.layers[0].color).toBe(colors.maroon);
  }
  for (const facing of [undefined, "up", "down"] as const)
    expect(projectSprite(allyLine, facing).foreground).toBe(colors.green);
});
