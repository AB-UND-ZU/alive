import { createAreaWorld, advance } from "../../testing/harness";
import { createViewpoint } from "../../engine/entities";
import { getTerminalFrame, getTerminalLayout } from "./screen";
import { colors } from "../../game/assets/colors";
import {
  fountain,
  fountainHealing,
  fountainCorner,
  fountainSide,
  fountainDrop,
  fountainHeal,
  spawnerPulse,
  woodChest,
  ironChest,
  goldChest,
  diamondChest,
  rubyChest,
  tumbleweed,
} from "../../game/assets/sprites";
import {
  doorClosed,
  doorOpen,
  portClosed,
  portOpen,
  entryClosed,
  entryClosedDisplay,
  fenceDoorClosed,
  fenceDoorOpen,
  palisadeDoorClosed,
  palisadeDoorOpen,
  barrierDoorClosed,
  barrierDoorOpen,
} from "../../game/assets/templates/units";
import { key } from "../../game/assets/templates/items";
import { projectSprite } from "./sprites";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites, createTerminalFrame } from "./frame";

it("draws the fountain as a connected blue frame around dark water and a center spout", () => {
  const frame = [
    [
      projectSprite(fountainCorner, "left"),
      projectSprite(fountainSide, "up"),
      projectSprite(fountainCorner, "up"),
    ],
    [
      projectSprite(fountainSide, "left"),
      projectSprite(fountain),
      projectSprite(fountainSide, "right"),
    ],
    [
      projectSprite(fountainCorner, "down"),
      projectSprite(fountainSide, "down"),
      projectSprite(fountainCorner, "right"),
    ],
  ];
  expect(
    frame.map((row) => row.map((cell) => cell.char).join("")).join("\n")
  ).toBe("┌─┐\n│v│\n└─┘");
  expect(frame.flat().every((cell) => cell.background === colors.navy)).toBe(
    true
  );
  expect(frame.flat().every((cell) => cell.foreground === colors.blue)).toBe(
    true
  );
  expect(projectSprite(fountainHealing)).toMatchObject({
    char: "v",
    foreground: colors.lime,
  });
  for (const amount of [undefined, 1, 2, 3]) {
    expect(projectSprite(fountainDrop, undefined, amount).foreground).toBe(
      colors.blue
    );
    expect(projectSprite(fountainHeal, undefined, amount).foreground).toBe(
      colors.lime
    );
  }
});

it("uses matching key colors on closed entries and gates, with no glyph after opening", () => {
  for (const closed of [
    doorClosed,
    portClosed,
    entryClosed,
    entryClosedDisplay,
    fenceDoorClosed,
    palisadeDoorClosed,
    barrierDoorClosed,
  ]) {
    expect(projectSprite(closed.wood.default)).toMatchObject({
      char: "╒",
      foreground: colors.black,
    });
    for (const material of ["iron", "gold", "diamond", "ruby"] as const)
      expect(projectSprite(closed[material].default)).toMatchObject({
        char: "╒",
        foreground: projectSprite(key[material].default).foreground,
      });
  }
  for (const open of [
    doorOpen,
    portOpen,
    fenceDoorOpen,
    palisadeDoorOpen,
    barrierDoorOpen,
  ])
    for (const material of ["wood", "iron", "gold", "diamond", "ruby"] as const)
      expect(projectSprite(open[material].default)).toEqual({
        char: " ",
        foreground: colors.black,
      });
});

it("keeps chest material colors and a visible tumbleweed without an item background", () => {
  for (const chest of [
    woodChest,
    ironChest,
    goldChest,
    diamondChest,
    rubyChest,
  ])
    expect(projectSprite(chest).char).toBe("⌂");
  expect(projectSprite(tumbleweed)).toEqual({
    char: "○",
    foreground: colors.maroon,
  });
  expect(projectSprite(spawnerPulse)).toEqual({
    char: " ",
    foreground: colors.black,
  });
});

it("renders the same fountain frame through the game scene and terminal interface", () => {
  const world = createAreaWorld(
    `
|     |
|  ⌠  |
|     |
|  ♀  |
|     |
`,
    { size: 64 }
  );
  createViewpoint(world, {
    POSITION: { x: 2, y: 1 },
    VIEWABLE: { active: true, priority: 100, spring: { duration: 0 } },
    RENDERABLE: { generation: 0 },
  });
  advance(world, 2100);
  const layout = getTerminalLayout(80, 30);
  const x = Math.floor(layout.width / 2);
  const y = Math.floor(layout.height / 2);
  const scene = getSceneFrame(world, layout.width, layout.height, undefined, {
    instant: true,
    fogCells: true,
  }).filter((entry) => !entry.particle || entry.particleName === "fountain");
  const geometry = createTerminalFrame(
    collectTerminalSprites(scene),
    layout.width,
    layout.height
  );
  expect(
    geometry
      .slice(y - 1, y + 2)
      .map((row) =>
        row
          .slice(x - 1, x + 2)
          .map((cell) => cell.char)
          .join("")
      )
      .join("\n")
  ).toBe("┌─┐\n│v│\n└─┘");
  const animated = getTerminalFrame(world, 80, 30)
    .slice(layout.top + y - 1, layout.top + y + 2)
    .flatMap((row) => row.slice(layout.left + x - 1, layout.left + x + 2));
  expect(animated.every((cell) => cell.background === colors.navy)).toBe(true);
  expect(animated.every((cell) => cell.char !== "≈")).toBe(true);
});
