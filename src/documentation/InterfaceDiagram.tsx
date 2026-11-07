import { useMemo } from "react";
import { Pixels, textSprites } from "./visuals";
import { createPreviewWorld } from "./scenes";
import { assertHero } from "../testing/harness";
import { Sprite } from "../engine/components/sprite";
import { createButton, createProgress, mergeSprites } from "../game/assets/ui";
import { getItemSprite } from "../game/assets/utils";
import { colors } from "../game/assets/colors";
import { none, pauseInvert } from "../game/assets/sprites";
export function InterfaceDiagram() {
  const rows = useMemo(() => {
    const world = createPreviewWorld("interface"),
      hero = assertHero(world);
    const grid: Sprite[][] = Array.from({ length: 24 }, () =>
      Array.from({ length: 40 }, () => none)
    );
    const put = (
      x: number,
      y: number,
      content: string | Sprite[],
      color: string = colors.white
    ) => {
      const sprites =
        typeof content === "string" ? textSprites(content, color) : content;
      sprites.forEach((sprite, index) => {
        if (x + index < 40) grid[y][x + index] = sprite;
      });
    };
    put(12, 0, createProgress(hero.STATS!, "hp", 13));
    put(12, 1, createProgress(hero.STATS!, "mp", 13));
    put(12, 2, createProgress(hero.STATS!, "xp", 13));
    put(2, 2, [pauseInvert]);
    put(31, 2, createButton("USE", 5));
    for (let y = 3; y <= 21; y++)
      put(
        0,
        y,
        y === 3
          ? "┌" + "─".repeat(38) + "┐"
          : y === 21
          ? "└" + "─".repeat(38) + "┘"
          : "│" + " ".repeat(38) + "│",
        colors.silver
      );
    put(2, 4, "↑");
    put(19, 4, "↑");
    put(33, 4, "↑");
    put(1, 5, "Pause");
    put(1, 6, "(auto-save)");
    put(15, 5, "Stats");
    ["hp", "mp", "xp"].forEach((stat, index) =>
      put(15, 6 + index, [
        getItemSprite({ stat: stat as "hp" }, "display"),
        ...textSprites(" " + stat.toUpperCase()),
      ])
    );
    put(29, 5, "Quick");
    put(29, 6, "actions:");
    put(24, 7, "Hotkeys [0]-[9]");
    put(24, 9, createButton("MAP", 6));
    put(31, 9, createButton("GEAR", 7));
    put(24, 10, "Map / equipment");
    for (const entity of world.getEntities(["SPRITE", "POSITION"])) {
      const { x, y } = entity.POSITION;
      if (x >= 0 && x < 9 && y >= 0 && y < 9)
        grid[y + 10][x + 2] = mergeSprites(grid[y + 10][x + 2], entity.SPRITE);
    }
    put(14, 12, "← Terminal");
    put(14, 13, "Move and inspect");
    put(14, 15, "Nearby action");
    put(14, 16, createButton("CRAFT", 7));
    put(17, 18, "↑");
    put(1, 19, "Skill");
    put(11, 19, "Spell");
    put(24, 19, "Equipped");
    put(4, 21, "↓");
    put(14, 21, "↓");
    put(28, 21, "↓");
    put(1, 23, createButton("SLASH", 7));
    put(11, 23, createButton("WAVE", 7));
    put(24, 23, [
      getItemSprite({ weapon: "sword", material: "wood" }, "display"),
      none,
      getItemSprite({ accessory: "torch" }, "display"),
      none,
      getItemSprite({ accessory: "map" }, "display"),
    ]);
    return grid;
  }, []);
  return (
    <div className="InterfaceScroll">
      <Pixels
        className="InterfaceDiagram"
        rows={rows}
        label="Interface: Pause and auto-save, stats, quick actions, hotkeys, map, gear, terminal, nearby actions, skills, spells and equipped items"
      />
    </div>
  );
}
