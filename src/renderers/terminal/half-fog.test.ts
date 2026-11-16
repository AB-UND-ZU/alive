import { advance, createAreaWorld } from "../../testing/harness";
import { colors } from "../../game/assets/colors";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites, createTerminalFrame } from "./frame";

it("keeps real fogged rotten leaves facing their stems over gray fog", () => {
  const world = createAreaWorld("|          |\n|  r   ♀   |\n|          |", {
    size: 48,
    legend: { r: "rotten_stem_left" },
  });
  advance(world, 2000);
  world.metadata.visibleCells = new Set();
  for (const entity of world.getEntities(["FOG"]))
    if (!entity.PLAYER) entity.FOG.visibility = "fog";
  const sprites = collectTerminalSprites(
    getSceneFrame(world, 21, 13, undefined, {
      instant: true,
      fogCells: true,
    })
  );
  const leaves = sprites.filter((sprite) =>
    sprite.terminalLayers?.some(
      (layer) => "▌▐".includes(layer.char) && layer.color === colors.green
    )
  );
  expect(leaves.length).toBeGreaterThan(0);
  const frame = createTerminalFrame(sprites, 21, 13);
  for (const leaf of leaves)
    expect(frame[Math.ceil(leaf.y)][Math.ceil(leaf.x)]).toMatchObject({
      char: "▐",
      foreground: colors.green,
      background: colors.grey,
    });
});

it("keeps colored upper and lower artwork when fog replaces empty half-cells", () => {
  const frame = createTerminalFrame(
    [
      {
        x: 0,
        y: 0,
        z: 0,
        fog: true,
        sprite: { name: "text_generic" },
        layers: [{ char: "▀", color: colors.lime }],
      },
      {
        x: 1,
        y: 0,
        z: 0,
        fog: true,
        sprite: { name: "text_generic" },
        layers: [{ char: "▄", color: colors.lime }],
      },
    ],
    2,
    1
  );
  expect(frame[0][0]).toEqual({
    char: "▄",
    foreground: colors.grey,
    background: colors.green,
  });
  expect(frame[0][1]).toEqual({
    char: "▄",
    foreground: colors.green,
    background: colors.grey,
  });
});

it("darkens both colored halves while leaving protected artwork and dialog pixels intact", () => {
  const halves = [
    { char: "▀", color: colors.red },
    { char: "▄", color: colors.blue },
  ];
  const ground = {
    x: 0,
    y: 0,
    z: 0,
    fog: true,
    sprite: { name: "text_generic" },
    layers: halves,
  };
  expect(createTerminalFrame([ground], 1, 1)[0][0]).toEqual({
    char: "▄",
    foreground: colors.navy,
    background: colors.maroon,
  });
  expect(
    createTerminalFrame([{ ...ground, floating: true }], 1, 1)[0][0]
  ).toEqual({ char: "▄", foreground: colors.blue, background: colors.red });
  expect(
    createTerminalFrame(
      [ground, { ...ground, z: 1000, fog: false }],
      1,
      1
    )[0][0]
  ).toEqual({ char: "▄", foreground: colors.blue, background: colors.red });
});
