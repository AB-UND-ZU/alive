import { AFFECTABLE } from "../../engine/components/affectable";
import {
  magicHit,
  wall,
  path,
  sand,
  ghost,
  rogue,
  mage,
  knight,
  bandit,
  alien,
} from "../../game/assets/sprites";
import {
  advance,
  assertHero,
  createAreaWorld,
  createTestWorld,
} from "../../testing/harness";
import { PLAYER } from "../../engine/components/player";
import { BUMPABLE } from "../../engine/components/bumpable";
import { colors, orderedColors } from "../../game/assets/colors";
import {
  createTerminalFrame,
  collectTerminalSprites,
  frameToAnsi,
  frameToText,
  TerminalSprite,
  shakeTerminalFrame,
  TerminalState,
} from "./frame";
import { addBackground, createButton, createText } from "../../game/assets/ui";
import { createTerminalRoot, TerminalScreen } from "./react";
import React from "react";
import { getSceneFrame } from "../interface/frame";
import { queueMessage } from "../../game/assets/utils";

const sprite = (char: string, x: number, y: number, z = 0): TerminalSprite => ({
  x,
  y,
  z,
  sprite: { name: "text_generic" },
  layers: [{ char, color: colors.white }],
});

describe("terminal frame", () => {
  it("combines the menu title's upper and lower blocks without losing either half", () => {
    const world = createTestWorld({ level: "LEVEL_MENU" });
    advance(world, 10000);
    const scene = getSceneFrame(world, 33, 16, undefined, { instant: true });
    const lower = scene.find(
      (entry) =>
        entry.sprite.name === "block_down" &&
        scene.some(
          (other) =>
            other.sprite.name === "block_up" &&
            other.x === entry.x &&
            other.y === entry.y &&
            other.z === entry.z
        )
    )!;
    expect(lower).toBeDefined();
    const pair = scene.filter(
      (entry) =>
        /^block_(up|down)$/.test(entry.sprite.name) &&
        entry.x === lower.x &&
        entry.y === lower.y &&
        entry.z === lower.z
    );
    const combined = collectTerminalSprites(pair);
    expect(combined).toHaveLength(1);
    expect(combined[0].layers.map((layer) => layer.char).sort()).toEqual([
      "▀",
      "▄",
    ]);
    const frame = createTerminalFrame(combined, 33, 16);
    expect(frame[Math.ceil(lower.y)][Math.ceil(lower.x)]).toEqual({
      char: "█",
      foreground: colors.maroon,
      background: colors.maroon,
    });
    expect(
      collectTerminalSprites([pair[0], { ...pair[1], z: pair[1].z + 1 }])
    ).toHaveLength(2);
  });

  it("snaps motion to the next cell and clips sprites outside the screen", () => {
    const frame = createTerminalFrame(
      [sprite("@", 0.1, 0.1), sprite("x", 2, 2)],
      2,
      2
    );
    expect(frameToText(frame)).toBe("  \n @");
  });

  it("keeps terrain background under a foreground sprite and ignores transparent space", () => {
    const frame = createTerminalFrame(
      [
        { x: 0, y: 0, z: 0, sprite: { name: "water_deep" }, layers: [] },
        sprite("@", 0, 0, 1),
        sprite(" ", 0, 0, 2),
      ],
      1,
      1
    );
    expect(frame[0][0]).toEqual({
      char: "@",
      foreground: colors.white,
      background: colors.navy,
    });
  });

  it("draws in height order and does not emit control characters as sprite text", () => {
    const frame = createTerminalFrame(
      [sprite("A", 0, 0, 5), sprite("B", 0, 0, 1)],
      1,
      1
    );
    expect(frameToText(frame)).toBe("A");
    frame[0][0].char = String.fromCharCode(27);
    expect(frameToAnsi(frame)).not.toContain(
      String.fromCharCode(27) + String.fromCharCode(27)
    );
    expect(frameToAnsi(frame).endsWith(" \x1b[0m")).toBe(true);
  });

  it("commits frame changes through React without a browser", () => {
    const write = jest.fn();
    const root = createTerminalRoot(write);
    const first = createTerminalFrame([sprite("A", 0, 0)], 1, 1);
    root.render(React.createElement(TerminalScreen, { frame: first }));
    expect(write).toHaveBeenLastCalledWith(frameToAnsi(first));
    const second = createTerminalFrame(
      createText("B").map((value, x) => ({
        ...sprite("B", x, 0),
        layers: value.layers,
      })),
      1,
      1
    );
    root.render(React.createElement(TerminalScreen, { frame: second }));
    expect(write).toHaveBeenLastCalledWith(frameToAnsi(second));
    root.unmount();
  });
});

it("inverts fog intensity, including empty terrain, without recoloring dialogs", () => {
  const red = sprite(".", 0, 0);
  red.layers[0].color = colors.red;
  const frame = createTerminalFrame(
    [
      { ...red, fog: true },
      { ...sprite(" ", 1, 0), fog: true },
      { ...sprite(".", 2, 0), fog: true },
      {
        ...sprite("C", 2, 0, 10),
        layers: createText("C", colors.white, colors.black)[0].layers,
      },
    ],
    3,
    1
  );
  expect(frame[0][0]).toMatchObject({
    char: ".",
    foreground: colors.maroon,
    background: colors.grey,
  });
  expect(frame[0][1]).toMatchObject({ char: " ", background: colors.grey });
  expect(frame[0][2]).toMatchObject({
    char: "C",
    foreground: colors.white,
    background: colors.black,
  });
});

it("frames native buttons with brackets and retains their palette", () => {
  const frame = createTerminalFrame(
    createButton("GO", 4, false, false, false, "lime").map((item, x) => ({
      x,
      y: 0,
      z: 10,
      sprite: item,
      layers: item.layers,
    })),
    4,
    1
  );
  expect(frameToText(frame)).toBe("[GO]");
  expect(frame[0].every((cell) => cell.background === colors.lime)).toBe(true);
});

it("resets ANSI colors for each row and after colored cells", () => {
  const expected = [
    [
      { char: "A", foreground: colors.red, background: colors.white },
      { char: "B", foreground: colors.lime, background: colors.black },
    ],
    [
      { char: "C", foreground: colors.yellow, background: colors.black },
      { char: " ", foreground: colors.white, background: colors.black },
    ],
  ];
  const output = frameToAnsi(expected);
  const actual: typeof expected = [[], []];
  let x = 0,
    y = 0,
    foreground = colors.purple,
    background = colors.blue;
  // ANSI escape sequences are the protocol under test.
  // eslint-disable-next-line no-control-regex
  for (const token of output.match(/\x1b\[[\d;]*[mH]|[^\x1b]/gu) || []) {
    if (token.startsWith("\x1b[")) {
      const values = token.slice(2, -1).split(";").map(Number);
      if (token.endsWith("H")) {
        y = (values[0] || 1) - 1;
        x = (values[1] || 1) - 1;
      } else
        for (const code of values) {
          if (code === 0) {
            foreground = colors.silver;
            background = colors.black;
          } else if (code >= 30 && code <= 37)
            foreground = orderedColors[code - 30];
          else if (code >= 90 && code <= 97)
            foreground = orderedColors[code - 90 + 8];
          else if (code >= 40 && code <= 47)
            background = orderedColors[code - 40];
          else if (code >= 100 && code <= 107)
            background = orderedColors[code - 100 + 8];
        }
    } else actual[y][x++] = { char: token, foreground, background };
  }
  expect(actual).toEqual(expected);
  expect(output).toContain("\x1b[0m\x1b[2;1H");
});

it("shifts the whole screen once for a new hit and restores it without actor bumps", () => {
  const world = createAreaWorld("| ♀ |");
  const hero = assertHero(world);
  const state: TerminalState = { stickyCastables: {} };
  const frame = createTerminalFrame(
    [sprite("A", 0, 0), sprite("B", 1, 0)],
    3,
    1
  );
  hero[PLAYER].receivedStats.melee = 5;
  expect(shakeTerminalFrame(world, frame, state)).toBe(frame);
  hero[BUMPABLE]!.orientation = "right";
  expect(shakeTerminalFrame(world, frame, state)).toBe(frame);
  hero[PLAYER].receivedStats.melee += 1;
  expect(frameToText(shakeTerminalFrame(world, frame, state))).toBe(" AB");
  world.metadata.elapsed += 100;
  expect(shakeTerminalFrame(world, frame, state)).toBe(frame);
});

it("keeps bracket colors when a dialog backdrop is added to a button", () => {
  const frame = createTerminalFrame(
    addBackground(
      createButton("GO", 4, false, true, false, "lime"),
      colors.black
    ).map((item, x) => ({ x, y: 0, z: 10, sprite: item, layers: item.layers })),
    4,
    1
  );
  expect(frameToText(frame)).toBe("[GO]");
  expect(frame[0].every((cell) => cell.background === colors.green)).toBe(true);
  expect(frame[0][0].foreground).toBe(colors.white);
});

it("keeps the hero visible under particles, marks hits red and leaves dialogs on top", () => {
  const world = createAreaWorld("| ♀ |", { size: 32 });
  const hero = assertHero(world);
  const scene = getSceneFrame(world, 11, 9, undefined, {
    instant: true,
  }).filter((entry) => entry.entity === hero);
  const body = scene.find((entry) => /body\d+$/.test(entry.key))!;
  const hit = {
    ...body,
    key: body.key.replace(/body\d+$/, "particle999"),
    z: 9.2,
    sprite: magicHit,
    layers: magicHit.layers,
  };
  const x = Math.ceil(body.x),
    y = Math.ceil(body.y);
  const statIcon = { ...hit, x: body.x + 2, z: 10.5 };
  expect(
    createTerminalFrame(collectTerminalSprites([...scene, statIcon]), 11, 9)[y][
      x
    ].foreground
  ).not.toBe(colors.red);
  const frame = createTerminalFrame(
    collectTerminalSprites([...scene, hit]),
    11,
    9
  );
  expect(frame[y][x]).toMatchObject({ char: "♀", foreground: colors.red });
  const dialog = sprite("A", body.x, body.y, 10);
  expect(
    createTerminalFrame(
      [...collectTerminalSprites([...scene, hit]), dialog],
      11,
      9
    )[y][x].char
  ).toBe("A");
});

it("shows freeze and burn as hero backgrounds rather than replacing the hero", () => {
  const world = createAreaWorld("| ♀ |", { size: 32 });
  const hero = assertHero(world);
  const render = () => {
    const sprites = collectTerminalSprites(
      getSceneFrame(world, 11, 9, undefined, { instant: true })
    );
    const body = sprites.find((entry) => entry.hero)!;
    return createTerminalFrame(sprites, 11, 9)[Math.ceil(body.y)][
      Math.ceil(body.x)
    ];
  };
  hero[AFFECTABLE]!.freeze = 2;
  expect(render()).toMatchObject({
    char: "♀",
    foreground: colors.white,
    background: colors.aqua,
  });
  hero[AFFECTABLE]!.freeze = 0;
  hero[AFFECTABLE]!.burn = 2;
  expect(render()).toMatchObject({ char: "♀", background: colors.maroon });
  hero[AFFECTABLE]!.burn = 0;
  expect(render().background).not.toBe(colors.maroon);
});

it("preserves fog backgrounds and original particle colors", () => {
  const frame = createTerminalFrame(
    [
      { ...sprite(" ", 0, 0), fog: true },
      {
        ...sprite("O", 0, 0, 9.2),
        overlay: true,
        layers: createText("O", colors.grey, colors.black)[0].layers,
      },
      { ...sprite(" ", 1, 0), fog: true },
      {
        ...sprite("O", 1, 0, 10),
        overlay: true,
        layers: createText("O", colors.grey, colors.black)[0].layers,
      },
    ],
    2,
    1
  );
  expect(frame[0][0]).toEqual({
    char: "O",
    foreground: colors.grey,
    background: colors.grey,
  });
  expect(frame[0][1]).toEqual({
    char: "O",
    foreground: colors.grey,
    background: colors.black,
  });
});

it("keeps yellow sand and blue water recognizable in fog", () => {
  const frame = createTerminalFrame(
    [
      {
        ...sprite("░", 0, 0),
        fog: true,
        layers: [{ char: "░", color: colors.yellow }],
      },
      {
        x: 1,
        y: 0,
        z: 0,
        sprite: { name: "water_deep" },
        layers: [],
        fog: true,
      },
    ],
    2,
    1
  );
  expect(frame[0][0]).toMatchObject({
    foreground: colors.yellow,
    background: colors.grey,
  });
  expect(frame[0][1]).toEqual({
    char: "░",
    foreground: colors.blue,
    background: colors.grey,
  });
});

it("puts new transient messages above the hero and pushes earlier messages up without extending their life", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  advance(world, 2000);
  const message = (text: string) =>
    queueMessage(world, hero, {
      line: createText(text),
      fast: true,
      delay: 0,
      orientation: "up",
    });
  const rows = () =>
    getSceneFrame(world, 15, 11, undefined, { instant: true })
      .filter(
        (entry) =>
          entry.particleName?.startsWith("char-") && entry.entity === hero
      )
      .map((entry) => [entry.layers[0].char, entry.y]);
  message("A");
  advance(world, 100);
  expect(rows()[0][0]).toBe("A");
  expect(rows()[0][1]).toBeLessThan(4);
  message("B");
  advance(world, 100);
  expect(rows().map(([text]) => text)).toEqual(["A", "B"]);
  expect(Number(rows()[0][1])).toBeLessThan(Number(rows()[1][1]) - 1);
  advance(world, 420);
  expect(rows()).toHaveLength(1);
  expect(rows()[0][0]).toBe("B");
  advance(world, 100);
  expect(rows()).toEqual([]);
});

it("keeps terrain silhouettes dark in fog and leaves sand yellow", () => {
  const frame = createTerminalFrame(
    [wall, path, sand].map((terrain, x) => ({
      x,
      y: 0,
      z: 0,
      sprite: terrain,
      layers: terrain.layers,
      fog: true,
    })),
    3,
    1
  );
  expect(frame[0][0]).toEqual({
    char: "█",
    foreground: colors.black,
    background: colors.grey,
  });
  expect(frame[0][1]).toEqual({
    char: "░",
    foreground: colors.black,
    background: colors.grey,
  });
  expect(frame[0][2]).toEqual({
    char: "░",
    foreground: colors.yellow,
    background: colors.grey,
  });
});

it.each(["red", "lime"])(
  "shows disabled %s buttons as gray without dim active colors",
  (palette) => {
    const cells = createButton("USE", 7, true, false, false, palette);
    const frame = createTerminalFrame(
      cells.map((button, x) => ({
        x,
        y: 0,
        z: 10,
        sprite: button,
        layers: button.layers,
      })),
      7,
      1
    );
    expect(frame[0].every((cell) => cell.background === colors.grey)).toBe(
      true
    );
    expect(frame[0].map((cell) => cell.char).join("")).toContain("USE");
  }
);

it("darkens bright terrain colors without brightening dark colors or squiggly fog", () => {
  const frame = createTerminalFrame(
    [colors.green, colors.lime, colors.maroon, colors.red, colors.white].map(
      (color, x) => ({
        ...sprite(x === 4 ? "≈" : "+", x, 0),
        layers: [{ char: x === 4 ? "≈" : "+", color }],
        fog: true,
      })
    ),
    5,
    1
  );
  expect(frame[0].map((cell) => cell.foreground)).toEqual([
    colors.green,
    colors.green,
    colors.maroon,
    colors.maroon,
    colors.black,
  ]);
  expect(frame[0].every((cell) => cell.background === colors.grey)).toBe(true);
});

it("draws fog behind floating and opaque bodies rather than over their colors", () => {
  const frame = createTerminalFrame(
    [
      { ...sprite(" ", 0, 0), fog: true },
      {
        ...sprite("│", 0, 0, 5),
        floating: true,
        terminalLayers: [
          { char: "█", color: colors.silver },
          { char: "│", color: colors.maroon },
        ],
      },
    ],
    1,
    1
  );
  expect(frame[0][0]).toEqual({
    char: "│",
    foreground: colors.maroon,
    background: colors.silver,
  });
});

it("preserves a highlight's terrain background and leaves tooltip colors above it unchanged", () => {
  const ground = {
    ...sprite("░", 0, 0),
    layers: createText("░", colors.black, colors.olive)[0].layers,
  };
  const highlight = {
    ...sprite("┐", 0, 0, 8.499),
    overlay: true,
    layers: createText("┐", colors.red, colors.black)[0].layers,
  };
  expect(createTerminalFrame([ground, highlight], 1, 1)[0][0]).toEqual({
    char: "┐",
    foreground: colors.red,
    background: colors.olive,
  });
  expect(
    createTerminalFrame([{ ...ground, fog: true }, highlight], 1, 1)[0][0]
  ).toMatchObject({
    foreground: colors.red,
    background: colors.grey,
  });
  const tooltip = {
    ...sprite("R", 0, 0, 9.5),
    overlay: true,
    layers: createText("R", colors.white, colors.black)[0].layers,
  };
  expect(
    createTerminalFrame(
      [{ ...ground, fog: true }, highlight, tooltip],
      1,
      1
    )[0][0].foreground
  ).toBe(colors.white);
});

it("lets transient messages move down as in the web frame and stack in that direction", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  advance(world, 2000);
  const message = (text: string) =>
    queueMessage(world, hero, {
      line: createText(text),
      fast: true,
      delay: 0,
      orientation: "down",
    });
  const rows = (instant: boolean) =>
    getSceneFrame(world, 15, 11, undefined, { instant })
      .filter(
        (entry) =>
          entry.entity === hero &&
          entry.particle &&
          ["A", "B"].includes(entry.layers[0]?.char)
      )
      .map((entry) => [entry.layers[0].char, entry.y] as const);
  message("A");
  advance(world, 100);
  expect(rows(true)).toEqual(rows(false));
  expect(rows(true)[0][1]).toBeGreaterThan(5);
  message("B");
  advance(world, 100);
  const positions = rows(true);
  expect(positions[0][0]).toBe("A");
  expect(positions[1][0]).toBe("B");
  expect(positions[0][1]).toBeGreaterThan(positions[1][1] + 1);
});

it("does not let an invisible terminal message push visible messages away", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  advance(world, 2000);
  queueMessage(world, hero, {
    line: [
      {
        name: "pulse",
        layers: [{ char: "∙", color: colors.maroon }],
        terminal: { layers: [] },
      },
    ],
    fast: true,
    delay: 0,
    orientation: "up",
  });
  queueMessage(world, hero, {
    line: createText("1"),
    fast: true,
    delay: 0,
    orientation: "up",
  });
  advance(world, 100);
  const point = (instant: boolean) =>
    getSceneFrame(world, 15, 11, undefined, { instant }).find(
      (entry) =>
        entry.entity === hero && entry.particle && entry.layers[0]?.char === "1"
    )!.y;
  expect(point(true)).toBe(point(false));
});

it("keeps non-player units above world effects except for x and X hit markers", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  const scene = getSceneFrame(world, 11, 9, undefined, {
    instant: true,
  }).filter((entry) => entry.entity === hero);
  const source = scene.find((entry) => /body\d+$/.test(entry.key))!;
  const creature = { ...hero, PLAYER: undefined };
  const bodies = scene.map((entry) => ({ ...entry, entity: creature }));
  const effect = {
    ...source,
    entity: creature,
    particle: hero,
    key: source.key.replace(/body\d+$/, "particle999"),
    z: 9.2,
    sprite: createText("O")[0],
    layers: createText("O")[0].layers,
  };
  const x = Math.ceil(source.x),
    y = Math.ceil(source.y);
  expect(
    createTerminalFrame(collectTerminalSprites([...bodies, effect]), 11, 9)[y][
      x
    ].char
  ).toBe("♀");
  for (const char of ["x", "X"]) {
    const hit = {
      ...effect,
      sprite: magicHit,
      layers: [{ char, color: colors.fuchsia }],
    };
    expect(
      createTerminalFrame(collectTerminalSprites([...bodies, hit]), 11, 9)[y][x]
        .char
    ).toBe(char);
  }
});

it("keeps a player ghost yellow instead of applying the living hero color", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  hero.SPRITE = ghost;
  hero.PLAYER.ghost = true;
  const sprites = collectTerminalSprites(
    getSceneFrame(world, 11, 9, undefined, { instant: true })
  );
  const body = sprites.find((entry) => entry.hero)!;
  expect(
    createTerminalFrame(sprites, 11, 9)[Math.ceil(body.y)][Math.ceil(body.x)]
  ).toMatchObject({ char: "♀", foreground: colors.yellow });
});

it("renders living heroes white and the same human sprites as silver NPCs", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  for (const human of [rogue, mage, knight, bandit, alien]) {
    hero.SPRITE = human;
    const scene = getSceneFrame(world, 11, 9, undefined, {
      instant: true,
    }).filter((entry) => entry.entity === hero);
    const source = scene.find((entry) => /body\d+$/.test(entry.key))!;
    const x = Math.ceil(source.x),
      y = Math.ceil(source.y);
    const living = createTerminalFrame(collectTerminalSprites(scene), 11, 9)[y][
      x
    ];
    expect(living).toMatchObject({ char: "♀", foreground: colors.white });
    const npc = { ...hero, PLAYER: undefined };
    const other = createTerminalFrame(
      collectTerminalSprites(scene.map((entry) => ({ ...entry, entity: npc }))),
      11,
      9
    )[y][x];
    expect(other).toMatchObject({ char: "♀", foreground: colors.silver });
  }
});
