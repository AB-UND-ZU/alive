import {
  advance,
  createAreaWorld,
  findInArea,
  getEntitiesAt,
} from "../../testing/harness";
import { applySnow } from "../../engine/systems/freeze";
import { fogOfWar, snowFogOfWar } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites, createTerminalFrame } from "./frame";

it("remembers snow cover as a grey quarter-shade only on explored cells", () => {
  const area = "|♀   R |";
  const world = createAreaWorld(area, { size: 32, legend: { R: "rubble" } });
  const position = findInArea(area, "R");
  const snow = applySnow(world, position);
  world.update(0);
  const frame = () => getSceneFrame(world, 17, 9, undefined, { instant: true });
  const cell = getEntitiesAt(world, position);
  cell.forEach((entity) => {
    if (entity.FOG) entity.FOG.visibility = "fog";
  });
  const scene = frame();
  const mask = scene.find(
    (entry) => entry.entity === snow && entry.sprite.id === snowFogOfWar.id
  )!;
  const terrainMask = scene.find(
    (entry) =>
      entry.x === mask.x &&
      entry.y === mask.y &&
      entry.sprite.id === fogOfWar.id
  )!;
  expect(mask.z).toBeGreaterThan(terrainMask.z);
  expect(mask.layers).toEqual([{ char: "░", color: colors.grey }]);
  const terminal = createTerminalFrame(collectTerminalSprites(scene), 17, 9);
  expect(terminal[Math.ceil(mask.y)][Math.ceil(mask.x)]).toEqual({
    char: "░",
    foreground: colors.grey,
    background: colors.black,
  });

  for (const visibility of ["visible", "hidden"] as const) {
    cell.forEach((entity) => {
      if (entity.FOG) entity.FOG.visibility = visibility;
    });
    expect(frame().some((entry) => entry.sprite.id === snowFogOfWar.id)).toBe(
      false
    );
  }
});

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
        sprite: { id: "text_generic", name: "text_generic" },
        layers: [{ char: "▀", color: colors.lime }],
      },
      {
        x: 1,
        y: 0,
        z: 0,
        fog: true,
        sprite: { id: "text_generic", name: "text_generic" },
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
    sprite: { id: "text_generic", name: "text_generic" },
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
