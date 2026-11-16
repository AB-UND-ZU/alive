import { advance, createAreaWorld } from "../../testing/harness";
import { colors } from "../../game/assets/colors";
import { getTerminalFrame, getTerminalLayout } from "./screen";

it("keeps known fogged terrain colors in pause dots without brightening empty fog", () => {
  const area = Array.from({ length: 15 }, (_, y) => {
    const line = "s".repeat(12) + (y === 7 ? "♀" : "w") + "w".repeat(12);
    return `|${line}|`;
  }).join("\n");
  const world = createAreaWorld(area, {
    size: 48,
    legend: { s: "sand", w: "water_deep" },
  });
  advance(world, 2000);
  world.metadata.visibleCells = new Set();
  for (const entity of world.getEntities(["FOG"]))
    if (!entity.PLAYER) entity.FOG.visibility = "fog";
  const active = getTerminalFrame(world, 33, 30);
  const paused = getTerminalFrame(world, 33, 30, undefined, { paused: true });
  const { top, height, left, width } = getTerminalLayout(33, 30);
  for (const foreground of [colors.yellow, colors.blue]) {
    const cells = [];
    for (let y = top; y < top + height; y++)
      for (let x = left + 1; x < left + width - 1; x++)
        if (
          active[y][x].background === colors.grey &&
          active[y][x].foreground === foreground &&
          paused[y][x].char === "░"
        )
          cells.push(paused[y][x]);
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells)
      expect(cell).toEqual({ char: "░", foreground, background: colors.black });
  }
  const empty = [];
  for (let y = top; y < top + height; y++)
    for (let x = left + 1; x < left + width - 1; x++)
      if (
        active[y][x].background === colors.grey &&
        active[y][x].char === " " &&
        paused[y][x].char === "░"
      )
        empty.push(paused[y][x]);
  expect(empty.length).toBeGreaterThan(0);
  for (const cell of empty)
    expect(cell).toEqual({
      char: "░",
      foreground: colors.grey,
      background: colors.black,
    });
});
