import { portalMap } from "./WarpMap";
import { getWarpMap, warpBlink } from "../game/assets/warp";
import { levelConfig } from "../game/levels";
import { LevelName } from "../engine/components/level";
import { frameWidth } from "../game/assets/utils";
import { colors } from "../game/assets/colors";

describe("portal world map", () => {
  it.each([
    ["LEVEL_MENU", colors.white, true, false],
    ["LEVEL_TUTORIAL", colors.lime, false, false],
    ["LEVEL_ISLAND", colors.red, false, true],
  ] as const)(
    "uses the native state for %s selected from Menu",
    (selected, color, current, locked) => {
      const { world, portal } = portalMap(selected);
      const original = JSON.stringify(portal.POPUP.lines);
      const map = getWarpMap(world, portal);
      expect(map.currentLevel).toBe(current);
      expect(map.lockedLevel).toBe(locked);
      const level = levelConfig[selected];
      const frame = map.content[level.mapOffsetY];
      expect(
        frame.some((cell) => cell.layers.some((layer) => layer.color === color))
      ).toBe(true);
      expect(JSON.stringify(portal.POPUP.lines)).toBe(original);
    }
  );

  it("keeps the destination marker at its configured map offset and blinks it", () => {
    const { world, portal } = portalMap();
    const destination = levelConfig.LEVEL_TUTORIAL;
    const x = Math.floor((frameWidth - 2) / 2) + destination.mapOffsetX;
    const y = destination.mapOffsetY + 2;
    world.metadata.gameEntity.RENDERABLE.generation = 0;
    expect(getWarpMap(world, portal).content[y][x].layers).toContainEqual({
      char: "\u010b",
      color: colors.lime,
    });
    world.metadata.gameEntity.RENDERABLE.generation = warpBlink;
    expect(getWarpMap(world, portal).content[y][x].layers).not.toContainEqual({
      char: "\u010b",
      color: colors.lime,
    });
  });

  it("shows Island as reachable from Dungeon using the level connections", () => {
    const { world, portal } = portalMap("LEVEL_ISLAND", "LEVEL_TUTORIAL");
    const map = getWarpMap(world, portal);
    expect(map.lockedLevel).toBe(false);
    expect(map.level).toBe(levelConfig.LEVEL_ISLAND);
    expect(levelConfig.LEVEL_ISLAND.warps).toEqual([] as LevelName[]);
  });
});

test("the complete map shows every native level frame at once", () => {
  const { completePortalMap } = require("./WarpMap");
  const rows = completePortalMap();
  for (const [key, color] of [
    ["LEVEL_MENU", colors.lime],
    ["LEVEL_TUTORIAL", colors.lime],
    ["LEVEL_ISLAND", colors.lime],
  ] as const) {
    expect(
      rows[levelConfig[key].mapOffsetY].some(
        (cell: { layers: { color: string }[] }) =>
          cell.layers.some((layer) => layer.color === color)
      )
    ).toBe(true);
  }
});
