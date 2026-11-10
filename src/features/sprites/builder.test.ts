import {
  createAreaWorld,
  assertHero,
  act,
  advance,
  advanceUntil,
} from "../../testing/harness";
import {
  openSpriteBuilder,
  spriteBuilderPreview,
} from "../../game/assets/spriteBuilder";
import { composeCharacterPixels } from "../../components/Row/characters";
import { codePage437 } from "../../game/assets/characters";
import { colors, orderedColors } from "../../game/assets/colors";
import { getSequence } from "../../engine/systems/sequence";
import { getTab, getVerticalIndex } from "../../engine/systems/popup";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { popupActive, popupSelection } from "../../game/assets/sprites";
import { SPRITE } from "../../engine/components/sprite";

const setup = () => {
  const world = createAreaWorld(`\n|     |\n|  ♀  |\n|     |`);
  const hero = world.assertComponents(assertHero(world), [PLAYER]);
  openSpriteBuilder(world, hero);
  advance(world, 2000);
  const popup = world.assertByIdAndComponents(hero[PLAYER].popup!, [POPUP]);
  return { world, hero, popup, editor: popup[POPUP].sprite! };
};

it("lists independent sprites and edits the selected sprite in the native popup", () => {
  const { world, popup, editor } = setup();
  expect(popup[POPUP].tabs).toEqual(["pack", "sprite", "layer"]);
  expect(getTab(world, popup)).toBe("pack");
  expect(editor.sprites.map((sprite) => sprite.name)).toEqual([
    "Sprite #1",
    "Sprite #2",
  ]);
  act(world, "down");
  act(world, "right");
  expect(getTab(world, popup)).toBe("sprite");
  expect(editor.selected).toBe(1);
});

it("drops only the selected layer and keeps the row in bounds", () => {
  const { world, popup, editor } = setup();
  editor.sprites[0].layers = [
    { char: "/", color: colors.maroon },
    { char: "∙", color: colors.white },
  ];
  const before = [...editor.sprites[0].layers];
  act(world, "right");
  act(world, "down");
  act(world, "left");
  expect(editor.sprites[0].layers).toEqual(before.filter((_, i) => i !== 1));
  expect(getVerticalIndex(world, popup)).toBeLessThan(
    editor.sprites[0].layers.length
  );
});

it("chooses a draft color and adds exactly the clicked character", () => {
  const { world, hero, popup, editor } = setup();
  const before = [...editor.sprites[0].layers];
  act(world, "right");
  act(world, "down");
  act(world, "right");
  expect(getTab(world, popup)).toBe("layer");
  act(world, "right");
  act(world, "down");
  expect(orderedColors[editor.color]).toBe(colors.black);
  act(world, "right");
  act(world, "down");
  expect(getVerticalIndex(world, popup)).toBe(1);
  hero[PLAYER].contentTriggered = 3;
  hero[PLAYER].offsetTriggered = 1;
  act(world, "content");
  expect(getTab(world, popup)).toBe("sprite");
  expect(editor.sprites[0].layers).toEqual([
    ...before,
    { char: codePage437[65], color: colors.black },
  ]);
});

it("discards a draft with BACK without changing the sprite", () => {
  const { world, popup, editor } = setup();
  const before = [...editor.sprites[0].layers];
  act(world, "right");
  act(world, "down");
  act(world, "right");
  act(world, "right");
  act(world, "up");
  act(world, "left");
  expect(getTab(world, popup)).toBe("sprite");
  expect(editor.sprites[0].layers).toEqual(before);
});

it("erases a sprite without changing the other sprite and can start another", () => {
  const { world, editor } = setup();
  const survivor = editor.sprites[1];
  act(world, "left");
  expect(editor.sprites).toEqual([survivor]);
  act(world, "down");
  act(world, "right");
  expect(editor.sprites).toHaveLength(2);
  expect(editor.sprites[1].layers).toEqual([]);
});

it("keeps the enlarged preview fixed while a long layer list scrolls", () => {
  const { world, popup, editor } = setup();
  editor.sprites[0].layers = Array.from({ length: 24 }, (_, i) => ({
    char: i % 2 ? "▄" : "▀",
    color: i % 2 ? colors.blue : colors.red,
  }));
  act(world, "right");
  advance(world, 2000);
  const preview = () => {
    const sequence = getSequence(world, popup, "popup")!;
    return Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 11 }, (_, col) =>
        composeCharacterPixels(
          world.assertByIdAndComponents(
            sequence.particles[`popup-content-${row}-${col + 6}`],
            [SPRITE]
          )[SPRITE].layers
        )
      )
    );
  };
  const before = preview();
  for (let i = 0; i < 15; i++) act(world, "down");
  expect(getSequence(world, popup, "popup")!.args.scrollIndex).toBeGreaterThan(
    0
  );
  expect(preview()).toEqual(before);
});

it("ignores the character-grid gutter and closes with the normal close action", () => {
  const { world, hero, popup, editor } = setup();
  act(world, "right");
  act(world, "down");
  act(world, "right");
  const before = [...editor.sprites[0].layers];
  hero[PLAYER].contentTriggered = 0;
  hero[PLAYER].offsetTriggered = 16;
  act(world, "content");
  expect(editor.sprites[0].layers).toEqual(before);
  act(world, "close");
  expect(hero[PLAYER].popup).toBeUndefined();
  expect(popup[POPUP].active).toBe(false);
});

it("renders an untrimmed 9 by 16 sprite inside a single white frame", () => {
  const rows = spriteBuilderPreview({
    name: "test",
    layers: [{ char: "·", color: colors.red }],
  });
  expect(rows).toHaveLength(9);
  expect(rows.every((row) => row.length === 11)).toBe(true);
  for (const row of [0, 4, 8]) {
    for (const column of [0, 10]) {
      const pixels = composeCharacterPixels(rows[row][column].layers);
      expect(rows[row][column].layers).toContainEqual({
        char: "║",
        color: colors.black,
      });
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 9; x++) {
          const edge = column === 0 ? x >= 7 : x <= 1;
          const visible = row === 0 ? y >= 7 : row === 8 ? y <= 7 : true;
          expect(pixels[y * 9 + x] === colors.white).toBe(edge && visible);
        }
      }
    }
  }
});

it("shows black characters on white and scrolls through the last character row", () => {
  const { world, popup, editor } = setup();
  act(world, "right");
  act(world, "down");
  act(world, "right");
  act(world, "right");
  act(world, "down");
  advance(world, 2000);
  const sequence = getSequence(world, popup, "popup")!;
  const cell = world.assertByIdAndComponents(
    sequence.particles["popup-content-4-1"],
    [SPRITE]
  )[SPRITE];
  expect(cell.layers).toEqual(
    expect.arrayContaining([
      { char: "█", color: colors.white },
      { char: "A", color: colors.black },
    ])
  );
  act(world, "right");
  for (let i = 0; i < 20; i++) act(world, "down");
  expect(getVerticalIndex(world, popup)).toBe(7);
  expect(editor.sprites[0].layers).toHaveLength(1);
});

it("edits an existing layer without adding a layer and BACK preserves it", () => {
  const { world, hero, popup, editor } = setup();
  const before = [...editor.sprites[0].layers];
  act(world, "right");
  act(world, "right");
  act(world, "right");
  expect(editor.layer).toBe(0);
  act(world, "left");
  expect(editor.sprites[0].layers).toEqual(before);
  expect(editor.moving).toBe(false);
  act(world, "right");
  act(world, "right");
  hero[PLAYER].contentTriggered = 0;
  hero[PLAYER].offsetTriggered = 1;
  const scroll = getSequence(world, popup, "popup")!.args.scrollIndex || 0;
  act(world, "content");
  expect(editor.sprites[0].layers).toHaveLength(before.length);
  expect(editor.sprites[0].layers[0]).toEqual({
    char: codePage437[scroll * 16 + 1],
    color: before[0].color,
  });
});

it("lists a single New row and brackets only the selected layer character", () => {
  const { world, popup, editor } = setup();
  const lines = () => {
    const sequence = getSequence(world, popup, "popup")!;
    return Array.from({ length: 9 }, (_, row) =>
      Array.from(
        { length: 6 },
        (_, column) =>
          world
            .assertByIdAndComponents(
              sequence.particles[`popup-content-${row}-${column}`],
              [SPRITE]
            )
            [SPRITE].layers.filter(
              (layer) => !["█", "▀", "▄", "░"].includes(layer.char)
            )
            .at(-1)?.char || " "
      ).join("")
    );
  };
  act(world, "right");
  advance(world, 2000);
  advanceUntil(world, () => editor.blink === true, 5000);
  expect(lines()[0].slice(1)).toBe(`01[${editor.sprites[0].layers[0].char}]`);
  expect(lines()[1].slice(1)).toBe("New  ");
  act(world, "down");
  expect(lines()[0]).not.toContain("[");
  act(world, "left");
  expect(editor.sprites[0].layers).toHaveLength(1);
});

it("applies edited colors immediately, keeps them on BACK, and replaces the chosen character", () => {
  const { world, hero, editor, popup } = setup();
  const original = { ...editor.sprites[0].layers[0] };
  act(world, "right");
  act(world, "right");
  act(world, "right");
  act(world, "right");
  act(world, "down");
  expect(editor.sprites[0].layers[0]).toEqual({
    ...original,
    color: colors.green,
  });
  act(world, "left");
  expect(editor.sprites[0].layers[0]).toEqual({
    ...original,
    color: colors.green,
  });
  expect(editor.moving).toBe(false);
  act(world, "right");
  act(world, "right");
  const scroll = getSequence(world, popup, "popup")!.args.scrollIndex || 0;
  hero[PLAYER].contentTriggered = 0;
  hero[PLAYER].offsetTriggered = 1;
  act(world, "content");
  expect(editor.sprites[0].layers).toEqual([
    { char: codePage437[scroll * 16 + 1], color: colors.green },
  ]);
  expect(editor.moving).toBe(false);
});

it("blinks the brackets and large layer preview while keeping the small character visible", () => {
  const { world, popup, editor } = setup();
  act(world, "right");
  const cell = (row: number, column: number) => {
    const sequence = getSequence(world, popup, "popup")!;
    return world.assertByIdAndComponents(
      sequence.particles[`popup-content-${row}-${column}`],
      [SPRITE]
    )[SPRITE];
  };
  const previewColors = () =>
    Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 11 }, (_, column) =>
        cell(row, column + 6).layers.map((layer) => layer.color)
      )
    ).flat(2);
  advanceUntil(world, () => editor.blink === true, 5000);
  expect(cell(0, 3).layers).toContainEqual({ char: "[", color: colors.white });
  expect(cell(0, 4).layers).toContainEqual(editor.sprites[0].layers[0]);
  expect(cell(0, 5).layers).toContainEqual({ char: "]", color: colors.white });
  expect(previewColors()).toContain(colors.maroon);
  const corner = cell(0, 6);
  advanceUntil(world, () => editor.blink === false, 5000);
  expect(cell(0, 3).layers).not.toContainEqual({
    char: "[",
    color: colors.white,
  });
  expect(cell(0, 4).layers).toContainEqual(editor.sprites[0].layers[0]);
  expect(cell(0, 5).layers).not.toContainEqual({
    char: "]",
    color: colors.white,
  });
  expect(previewColors()).not.toContain(colors.maroon);
  expect(cell(0, 6)).toEqual(corner);
});

it("moves an edited layer with blinking digits and places it without changing its pixels", () => {
  const { world, popup, editor } = setup();
  editor.sprites[0].layers = [
    { char: "/", color: colors.maroon },
    { char: "∙", color: colors.white },
  ];
  const first = editor.sprites[0].layers[0];
  act(world, "right");
  act(world, "right");
  expect(getTab(world, popup)).toBe("sprite");
  expect(editor.moving).toBe(true);
  act(world, "down");
  expect(editor.sprites[0].layers[1]).toBe(first);
  expect(getVerticalIndex(world, popup)).toBe(1);
  const cell = (column: number) => {
    const seq = getSequence(world, popup, "popup")!;
    return world.assertByIdAndComponents(
      seq.particles[`popup-content-1-${column}`],
      [SPRITE]
    )[SPRITE];
  };
  advanceUntil(world, () => editor.blink === true, 5000);
  expect(cell(2).layers).toContainEqual({ char: "2", color: colors.white });
  const bracket = cell(3),
    char = cell(4);
  advanceUntil(world, () => editor.blink === false, 5000);
  expect(cell(2).layers).not.toContainEqual({
    char: "2",
    color: colors.white,
  });
  expect(cell(3)).toEqual(bracket);
  expect(cell(4)).toEqual(char);
  expect(getSequence(world, popup, "popup")!.args.backButton).toBe(true);
  act(world, "right");
  expect(getTab(world, popup)).toBe("layer");
  act(world, "left");
  expect(editor.moving).toBe(false);
  expect(editor.sprites[0].layers[1]).toBe(first);
});

it("restores edited characters, colors and layer order when the editor reopens", () => {
  const { world, hero, editor } = setup();
  act(world, "right");
  act(world, "right");
  act(world, "right");
  act(world, "right");
  act(world, "down");
  act(world, "left");
  act(world, "down");
  act(world, "right");
  hero[PLAYER].contentTriggered = 4;
  hero[PLAYER].offsetTriggered = 1;
  act(world, "content");
  act(world, "right");
  act(world, "up");
  act(world, "left");
  expect(editor.sprites[0].layers).toEqual([
    { char: "A", color: colors.green },
    { char: "/", color: colors.green },
  ]);
  expect(setup().editor.sprites).toEqual(editor.sprites);
});

it("keeps a deleted pack empty when the editor reopens", () => {
  const { world, editor } = setup();
  act(world, "left");
  act(world, "left");
  expect(editor.sprites).toEqual([]);
  expect(setup().editor.sprites).toEqual([]);
});

it.each([
  "{",
  JSON.stringify([
    { name: "Bad", layers: [{ char: "many", color: colors.white }] },
  ]),
  JSON.stringify([{ name: "Bad", layers: [{ char: "A", color: "missing" }] }]),
])(
  "uses the initial examples when stored sprites are invalid: %s",
  (stored) => {
    localStorage.setItem("alive.sprites", stored);
    expect(setup().editor.sprites.map((sprite) => sprite.name)).toEqual([
      "Sprite #1",
      "Sprite #2",
    ]);
  }
);

it("keeps editing when browser storage cannot be written", () => {
  const { world, editor } = setup();
  const save = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
  try {
    expect(() => act(world, "left")).not.toThrow();
    expect(editor.sprites).toHaveLength(1);
  } finally {
    save.mockRestore();
  }
});

it("inverts black layer rows while leaving the existing selection gutter clear", () => {
  const { world, popup, editor } = setup();
  editor.sprites[0].layers = [
    { char: "A", color: colors.black },
    { char: "B", color: colors.black },
    { char: "!", color: colors.red },
  ];
  act(world, "right");
  advanceUntil(world, () => editor.blink === true, 5000);
  const cell = (row: number, column: number) => {
    const sequence = getSequence(world, popup, "popup")!;
    return world.assertByIdAndComponents(
      sequence.particles[`popup-content-${row}-${column}`],
      [SPRITE]
    )[SPRITE];
  };
  for (const row of [0, 1])
    for (let column = 1; column < 6; column++)
      expect(cell(row, column).layers).toContainEqual({
        char: "█",
        color: colors.white,
      });
  expect(cell(0, 1).layers).toEqual(
    expect.arrayContaining([
      { char: "█", color: colors.white },
      { char: "░", color: colors.grey },
      { char: "▀", color: colors.white },
      { char: "0", color: colors.black },
    ])
  );
  const numberLayers = cell(0, 1).layers;
  expect(numberLayers.findIndex((layer) => layer.char === "░")).toBeGreaterThan(
    numberLayers.findIndex((layer) => layer.char === "█")
  );
  expect(numberLayers.at(-1)).toEqual({ char: "0", color: colors.black });
  act(world, "right");
  expect(cell(0, 1).layers).toContainEqual({ char: "▄", color: colors.green });
  expect(cell(0, 1).layers).not.toContainEqual({
    char: "░",
    color: colors.grey,
  });
  act(world, "left");
  advanceUntil(world, () => editor.blink === true, 5000);
  expect(cell(1, 1).layers).toContainEqual({ char: "0", color: colors.black });
  expect(cell(0, 3).layers).toContainEqual({ char: "[", color: colors.black });
  expect(cell(0, 4).layers).toContainEqual({ char: "A", color: colors.black });
  const arrow = () =>
    world.assertByIdAndComponents(
      getSequence(world, popup, "popup")!.particles.selection,
      [SPRITE]
    )[SPRITE];
  expect(arrow().layers).toEqual([{ char: ">", color: colors.white }]);
  expect(cell(0, 0).layers).not.toContainEqual({
    char: "█",
    color: colors.white,
  });
  act(world, "down");
  act(world, "down");
  expect(arrow().layers).toEqual([{ char: ">", color: colors.white }]);
  expect(cell(2, 1).layers).not.toContainEqual({
    char: "█",
    color: colors.white,
  });
});

it("leaves reorder mode when layer editing opens, including returning by tab", () => {
  const { world, hero, popup, editor } = setup();
  act(world, "right");
  act(world, "right");
  expect(editor.moving).toBe(true);
  act(world, "right");
  expect(editor.moving).toBe(false);
  const before = [...editor.sprites[0].layers];
  hero[PLAYER].tabTriggered = 1;
  act(world, "tab");
  act(world, "down");
  expect(getVerticalIndex(world, popup)).toBe(1);
  expect(editor.sprites[0].layers).toEqual(before);
});

it("uses the standard dialog height in every sprite editor tab", () => {
  const { world, popup } = setup();
  advance(world, 2000);
  expect(getSequence(world, popup, "popup")!.args.windowHeight).toBe(11);
  act(world, "right");
  advance(world, 2000);
  expect(getSequence(world, popup, "popup")!.args.windowHeight).toBe(11);
  act(world, "tab");
  advance(world, 2000);
  expect(getSequence(world, popup, "popup")!.args.windowHeight).toBe(11);
});

it("uses active selection for saved sprites and moving layers, and dotted selection for New", () => {
  const { world, popup, editor } = setup();
  const sequence = () => getSequence(world, popup, "popup")!;
  const arrow = () =>
    world.assertByIdAndComponents(sequence().particles.selection, [SPRITE])[
      SPRITE
    ];
  const cell = (column: number) =>
    world.assertByIdAndComponents(
      sequence().particles[`popup-content-0-${column}`],
      [SPRITE]
    )[SPRITE];
  advance(world, 2000);
  expect(arrow()).toEqual(popupActive);
  expect(cell(2).layers).toContainEqual({ char: "░", color: colors.grey });
  for (let i = 0; i < editor.sprites.length; i++) act(world, "down");
  expect(arrow()).toEqual(popupSelection);
  const selected = sequence().args.scrollIndex || 0;
  const newCell = world.assertByIdAndComponents(
    sequence().particles[`popup-content-${editor.sprites.length - selected}-2`],
    [SPRITE]
  )[SPRITE];
  expect(newCell.layers).toContainEqual({ char: "░", color: colors.grey });
  for (let i = 0; i < editor.sprites.length; i++) act(world, "up");
  act(world, "right");
  expect(arrow()).toEqual(popupSelection);
  expect(cell(1).layers).toContainEqual({ char: "░", color: colors.grey });
  expect(cell(1).layers).toContainEqual({ char: "0", color: colors.white });
  expect(cell(2).layers).toContainEqual({ char: "1", color: colors.white });
  expect(cell(2).layers).toContainEqual({ char: "░", color: colors.grey });
  for (const column of [3, 4, 5])
    expect(cell(column).layers).not.toContainEqual({
      char: "░",
      color: colors.grey,
    });
  act(world, "right");
  expect(arrow()).toEqual(popupActive);
  expect(cell(1).layers).toContainEqual({ char: "▄", color: colors.green });
  expect(cell(2).layers).toContainEqual({ char: "▄", color: colors.green });
  for (const column of [3, 4, 5])
    expect(cell(column).layers).not.toContainEqual({
      char: "▄",
      color: colors.green,
    });
  act(world, "left");
  act(world, "down");
  expect(sequence().args.backButton).toBe(true);
  expect(
    world.assertByIdAndComponents(sequence().particles["popup-content-1-1"], [
      SPRITE,
    ])[SPRITE].layers
  ).toContainEqual({ char: "N", color: colors.white });
  expect(arrow()).toEqual(popupSelection);
  act(world, "left");
  expect(getTab(world, popup)).toBe("pack");
  expect(editor.sprites[0].layers).toHaveLength(1);
});
