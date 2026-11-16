import {
  act,
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
} from "../../testing/harness";
import { createCell } from "../../bindings/creation";
import { collectItem } from "../../engine/systems/collect";
import { placeDrop } from "../../features/items/helpers";
import { projectSprite } from "./sprites";
import { mountVessel, unmountVessel } from "../../engine/systems/vessel";
import { queueMessage } from "../../game/assets/utils";
import { submitChat } from "../../engine/systems/popup";
import { colors } from "../../game/assets/colors";
import { path } from "../../game/assets/sprites";
import {
  createSpriteButton,
  createButton,
  createText,
  underline,
} from "../../game/assets/ui";
import { getSceneFrame } from "../interface/frame";
import {
  collectTerminalSprites,
  createTerminalFrame,
  TerminalSprite,
} from "./frame";
import { getTerminalFrame } from "./screen";

it("keeps disabled underlined shortcuts olive on the same gray button background", () => {
  const cells = createSpriteButton(
    [
      ...underline(createText("M", colors.black), colors.black),
      ...createText("AP", colors.black),
    ],
    5,
    true,
    false,
    false,
    "yellow"
  );
  const frame = createTerminalFrame(
    cells.map((sprite, x) => ({
      sprite,
      x,
      y: 0,
      z: 10,
      layers: sprite.layers,
      terminalLayers: sprite.terminal?.layers,
    })),
    5,
    1
  )[0];
  expect(frame.every((cell) => cell.background === colors.grey)).toBe(true);
  expect(frame[1]).toMatchObject({ char: "M", foreground: colors.olive });
  expect(frame[2]).toMatchObject({ char: "A", foreground: colors.black });
});

it("shows every unassigned hotkey number in the quick-action dialog", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  act(world, "use");
  advance(world, 2000);
  const numbers = getTerminalFrame(world, 33, 24)
    .flat()
    .filter(
      (cell) =>
        cell.background === colors.grey &&
        cell.foreground === colors.olive &&
        /[0-9]/.test(cell.char)
    )
    .map((cell) => cell.char);
  expect(numbers.sort()).toEqual([..."0123456789"]);
});

it("keeps path patterning without filling the background under occupants", () => {
  const ground: TerminalSprite = {
    x: 0,
    y: 0,
    z: 0,
    sprite: path,
    layers: path.layers,
  };
  const unit: TerminalSprite = {
    x: 0,
    y: 0,
    z: 1,
    unit: true,
    sprite: { name: "text_generic" },
    layers: [{ char: "Ω", color: colors.grey }],
  };
  expect(createTerminalFrame([ground], 1, 1)[0][0]).toMatchObject({
    char: "░",
    foreground: colors.silver,
  });
  expect(createTerminalFrame([ground, unit], 1, 1)[0][0]).toMatchObject({
    char: "Ω",
    background: colors.black,
  });
});

it("renders a speech line above the unit it overlaps", () => {
  const world = createAreaWorld("|  D  |\n|  ♀  |\n|     |", {
    size: 48,
    legend: { D: "dummy" },
  });
  advance(world, 2000);
  const hero = assertHero(world);
  submitChat(world, hero, "HELLO");
  advance(world, 200);
  const scene = getSceneFrame(world, 15, 11, undefined, { instant: true });
  const sprites = collectTerminalSprites(scene);
  const unit = sprites.find((sprite) => sprite.unit && !sprite.hero)!;
  expect(unit).toBeDefined();
  const text = sprites.find(
    (sprite) =>
      sprite.dialog &&
      Math.ceil(sprite.x) === Math.ceil(unit.x) &&
      Math.ceil(sprite.y) === Math.ceil(unit.y)
  );
  expect(text).toBeDefined();
  expect(text!.z).toBeGreaterThan(unit.z);
  expect(
    createTerminalFrame(sprites, 15, 11)[Math.ceil(unit.y)][Math.ceil(unit.x)]
      .char
  ).toBe("L");
});

it("keeps the hero's normal background on paths", () => {
  const world = createAreaWorld("|     |\n|  ♀  |\n|     |", { size: 48 });
  const hero = assertHero(world);
  createCell(world, { ...hero.POSITION! }, "path", "visible");
  advance(world, 2000);
  const scene = getSceneFrame(world, 15, 11, undefined, { instant: true });
  const sprites = collectTerminalSprites(scene);
  const body = sprites.find((sprite) => sprite.hero)!;
  expect(
    createTerminalFrame(sprites, 15, 11)[Math.ceil(body.y)][Math.ceil(body.x)]
  ).toMatchObject({ char: "♀", background: colors.black });
});

it("keeps interaction buttons above NPCs and effects while the hero stays visible", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  const scene = getSceneFrame(world, 11, 9, undefined, {
    instant: true,
  }).filter((entry) => entry.entity === hero);
  const body = scene.find((entry) => /body\d+$/.test(entry.key))!;
  const npc = { ...hero, PLAYER: undefined };
  const button = createButton("USE", 5, false, false, false, "lime")[1];
  const overlay = {
    ...body,
    key: body.key.replace(/body\d+$/, "particle999"),
    particle: hero,
    entity: npc,
    particleSequence: "popupInteract",
    sprite: button,
    layers: button.layers,
    terminalLayers: button.terminal?.layers,
    z: 9.2,
  };
  const x = Math.ceil(body.x),
    y = Math.ceil(body.y);
  const npcScene = scene.map((entry) => ({ ...entry, entity: npc }));
  expect(
    createTerminalFrame(collectTerminalSprites([...npcScene, overlay]), 11, 9)[
      y
    ][x].char
  ).toBe("U");
  const damageSprite = createText("9", colors.red)[0];
  const damage = {
    ...overlay,
    key: body.key.replace(/body\d+$/, "particle2000"),
    particleSequence: "transientMessage",
    sprite: damageSprite,
    layers: damageSprite.layers,
    terminalLayers: undefined,
    z: 11,
  };
  expect(
    createTerminalFrame(
      collectTerminalSprites([...npcScene, overlay, damage]),
      11,
      9
    )[y][x].char
  ).toBe("U");
  expect(
    createTerminalFrame(collectTerminalSprites([...scene, damage]), 11, 9)[y][x]
      .char
  ).toBe("♀");
  const labels = createButton("USE", 5, false, false, false, "lime").map(
    (sprite, index) => ({
      ...overlay,
      x: body.x + index - 1,
      key: body.key.replace(/body\d+$/, `particle${1000 + index}`),
      sprite,
      layers: sprite.layers,
      terminalLayers: sprite.terminal?.layers,
    })
  );
  const clear = createTerminalFrame(
    collectTerminalSprites([...scene, ...labels]),
    11,
    9
  );
  expect(clear[y][x].char).toBe("♀");
  expect(
    clear[y - 1]
      .slice(x - 1, x + 4)
      .map((cell) => cell.char)
      .join("")
  ).toBe("[USE]");
  const speech = createText("D", colors.black, colors.white)[0];
  const line = {
    ...overlay,
    particleSequence: "dialogText",
    sprite: speech,
    layers: speech.layers,
    terminalLayers: speech.terminal?.layers,
  };
  expect(
    createTerminalFrame(collectTerminalSprites([...scene, line]), 11, 9)[y][x]
  ).toMatchObject({
    char: "♀",
    foreground: colors.white,
    background: colors.black,
  });
});

it("shows transient messages above an open dialog until they expire", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  act(world, "gear");
  advance(world, 2000);
  queueMessage(world, hero, {
    line: createText("Saved", colors.lime),
    fast: true,
    delay: 0,
    orientation: "up",
  });
  advance(world, 100);
  const scene = getSceneFrame(world, 33, 14, undefined, { instant: true });
  const messages = scene.filter(
    (entry) => entry.particleSequence === "transientMessage"
  );
  expect(messages).toHaveLength(5);
  const frame = createTerminalFrame(collectTerminalSprites(scene), 33, 14);
  for (const message of messages) {
    expect(frame[Math.ceil(message.y)][Math.ceil(message.x)]).toMatchObject({
      char: message.layers[message.layers.length - 1].char,
      foreground: colors.lime,
      background: colors.black,
    });
  }
  advance(world, 2000);
  expect(
    getSceneFrame(world, 33, 14, undefined, { instant: true }).some(
      (entry) => entry.particleSequence === "transientMessage"
    )
  ).toBe(false);
  expect(hero.PLAYER.popup).toBeDefined();
});

it.each([
  { stackable: "apple" as const, amount: 2 },
  { weapon: "sword" as const, material: "wood" as const, amount: 1 },
])("keeps collection messages readable over walls for %o", (item) => {
  const world = createAreaWorld(
    "|           |\n|     ♀     |\n|           |",
    { size: 48 }
  );
  const hero = assertHero(world);
  for (let x = 0; x < 11; x++)
    createCell(world, { x, y: hero.POSITION.y - 1 }, "mountain", "visible");
  const drop = placeDrop(
    world,
    { x: hero.POSITION.x + 1, y: hero.POSITION.y },
    [item]
  );
  collectItem(world, hero, drop, "right");
  const messages = () =>
    getSceneFrame(world, 33, 13, undefined, { instant: true }).filter(
      (entry) => entry.particleSequence === "transientMessage"
    );
  advanceUntil(world, () => messages().length > 0, 2000);
  const scene = getSceneFrame(world, 33, 13, undefined, { instant: true });
  const frame = createTerminalFrame(collectTerminalSprites(scene), 33, 13);
  expect(messages().length).toBeGreaterThan(0);
  for (const message of messages()) {
    const expected = projectSprite(message.sprite);
    const cell = frame[Math.ceil(message.y)][Math.ceil(message.x)];
    expect(cell).toEqual(expected);
    expect(cell.foreground).not.toBe(cell.background);
  }
});

it("shows the boat passenger on maroon until dismounting", () => {
  const world = createAreaWorld("| ♀≈≈ |", { size: 48 });
  const hero = assertHero(world);
  const vessel = createCell(
    world,
    { x: hero.POSITION.x + 1, y: hero.POSITION.y },
    "boat",
    "visible"
  ).cell;
  advance(world, 500);
  mountVessel(world, hero, vessel);
  const capture = () => {
    const scene = getSceneFrame(world, 15, 11, undefined, { instant: true });
    const sprites = collectTerminalSprites(scene);
    const body = sprites.find((sprite) => sprite.hero)!;
    return createTerminalFrame(sprites, 15, 11)[Math.ceil(body.y)][
      Math.ceil(body.x)
    ];
  };
  expect(capture()).toMatchObject({
    char: "♀",
    foreground: colors.white,
    background: colors.maroon,
  });
  unmountVessel(world, hero, vessel);
  expect(capture().background).not.toBe(colors.maroon);
  expect(capture().char).toBe("♀");
});
