import * as sprites from "../../game/assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import {
  advance,
  assertHero,
  createAreaWorld,
  createTestWorld,
} from "../../testing/harness";
import { createPopup, openPopup } from "../../engine/systems/popup";
import { getSceneFrame } from "../interface/frame";
import { POPUP } from "../../engine/components/popup";
import { rerenderEntity } from "../../engine/systems/renderer";
import { collectTerminalSprites, createTerminalFrame } from "./frame";
import { colors } from "../../game/assets/colors";
import { eye, prism } from "../../game/assets/templates/creatures";
import { key } from "../../game/assets/templates/items";
import { getItemSprite, getUnitSprite } from "../../game/assets/utils";
import { classes, getClassData } from "../../game/balancing/classes";
import { doorClosed, doorOpen } from "../../game/assets/templates/units";
import {
  shot,
  dash,
  trigger,
  triggerSide,
  triggerCorner,
  trapBorder,
  edge,
  bolt,
} from "../../game/assets/templates/particles";
import {
  createButton,
  mergeSprites,
  createText,
  createProgress,
  shaded,
} from "../../game/assets/ui";
import {
  projectLayers,
  projectSprite,
  projectTerminalLayers,
  terminalCharacter,
} from "./sprites";

describe("terminal sprite projection", () => {
  it("keeps literal text and translates DOS control pictures", () => {
    expect(
      createText("Chat 12!")
        .map((sprite) => projectSprite(sprite))
        .map((cell) => cell.char)
        .join("")
    ).toBe("Chat 12!");
    expect(terminalCharacter("\u0102")).toBe("♥");
    expect(projectSprite(sprites.heart)).toMatchObject({
      char: "♥",
      foreground: colors.red,
    });
  });

  it("keeps people, items and terrain recognizable without drawing small accents as backgrounds", () => {
    expect(projectSprite(sprites.rogue).char).toBe("♀");
    expect(projectSprite(sprites.rogue).background).toBeUndefined();
    expect(projectSprite(sprites.apple)).toMatchObject({
      char: "•",
      foreground: colors.red,
    });
    expect(projectSprite(sprites.apple).background).toBeUndefined();
    expect(projectSprite(sprites.waterShallow)).toMatchObject({
      char: "~",
      foreground: colors.blue,
      background: colors.navy,
    });
  });

  it("preserves black dialog text on a bright background", () => {
    expect(
      projectSprite(createText("C", colors.black, colors.white)[0])
    ).toEqual({
      char: "C",
      foreground: colors.black,
      background: colors.white,
    });
  });

  it("retains popup objective text and frame lines beneath empty overlay cells", () => {
    const backing = { char: "█", color: colors.black };
    for (const char of "Defeat 0/3") {
      const cell = projectLayers(
        [
          backing,
          { char: " ", color: colors.red },
          { char, color: colors.red },
          { char: " ", color: colors.black },
        ],
        "text_generic"
      );
      expect(cell.char).toBe(char);
      expect(cell.foreground).toBe(char === " " ? colors.black : colors.red);
    }
    for (const char of "┌─┐│└┘") {
      expect(
        projectLayers(
          [
            backing,
            { char, color: colors.red },
            { char: "▌", color: colors.black },
          ],
          "text_generic"
        )
      ).toEqual({ char, foreground: colors.red, background: colors.black });
    }
  });

  it("keeps the Chick objective visible inside a real quest frame", () => {
    const world = createAreaWorld("| ♀ |", {
      size: 64,
      level: "LEVEL_TUTORIAL",
    });
    const hero = assertHero(world);
    createPopup(world, hero, {
      tabs: ["quest"],
      lines: [[]],
      targets: [{ unit: "chick", amount: 3 }],
      deals: [
        {
          item: { stackable: "coin", amount: 5 },
          stock: 1,
          prices: [{ stackable: "stick", amount: 2 }],
        },
      ],
    });
    openPopup(world, hero, hero);
    advance(world, 2000);
    const objective = getSceneFrame(world, 33, 13, undefined, {
      instant: true,
    }).find((entry) =>
      entry.terminalLayers?.some(
        (layer) => layer.char === "\u0103" && layer.color === colors.yellow
      )
    );
    expect(objective).toBeDefined();
    expect(projectTerminalLayers(objective!.terminalLayers!)).toEqual({
      char: "♦",
      foreground: colors.yellow,
      background: colors.black,
    });
  });

  it("renders class portraits entirely with block pixels, including the right ear", () => {
    const world = createAreaWorld("| ♀ |", { size: 64, level: "LEVEL_MENU" });
    const hero = assertHero(world);
    createPopup(world, hero, { tabs: ["class"] });
    openPopup(world, hero, hero);
    for (const index of [0, 1, 2, 3]) {
      hero[POPUP]!.verticalIndezes[0] = index;
      rerenderEntity(world, hero);
      advance(world, 2000);
      const pixels = getSceneFrame(world, 33, 16, undefined, {
        instant: true,
      }).filter(
        (entry) =>
          entry.particle &&
          (entry.sprite.name === "" ||
            entry.sprite.name === "text_generic" ||
            entry.sprite.name === "popup_background") &&
          entry.layers.every((layer) =>
            " █▀▄\u0106\u0107░".includes(layer.char)
          ) &&
          entry.layers.some((layer) => "▀▄\u0106\u0107".includes(layer.char))
      );
      expect(pixels.length).toBeGreaterThan(0);
      for (const pixel of pixels)
        expect(" █▀▄").toContain(
          projectLayers(pixel.layers, pixel.sprite.name).char
        );
    }
  });

  it.each(["lime", "red"] as const)(
    "shows disabled %s buttons in gray without dimming active buttons",
    (palette) => {
      const disabled = createButton("USE", 7, true, false, false, palette);
      for (const sprite of disabled) {
        expect(projectSprite(sprite).background).toBe(colors.grey);
        expect(projectSprite(sprite).foreground).toBe(colors.black);
      }
      expect(
        disabled.map((sprite) => projectSprite(sprite).char).join("")
      ).toContain("USE");
      const active = createButton("USE", 7, false, false, false, palette);
      expect(
        projectSprite(
          active.find((sprite) => sprite.name === "button_generic")!
        ).background
      ).toBe(colors[palette]);
    }
  );

  it("keeps dialog borders visible above black half-cell masks", () => {
    expect(projectSprite(createText("│", colors.silver)[0])).toEqual({
      char: "│",
      foreground: colors.silver,
      background: colors.black,
    });
    expect(
      projectLayers(
        [
          { char: "▄", color: colors.black },
          { char: "─", color: colors.olive },
        ],
        "quick_side"
      )
    ).toEqual({
      char: "─",
      foreground: colors.olive,
      background: colors.black,
    });
    expect(
      projectLayers(
        [
          { char: "▌", color: colors.black },
          { char: "│", color: colors.white },
        ],
        "popup_side"
      )
    ).toEqual({
      char: "│",
      foreground: colors.white,
      background: colors.black,
    });
  });

  it("keeps the original grass, bush and triangular creature characters", () => {
    expect(projectSprite(sprites.grass)).toMatchObject({
      char: ",",
      foreground: colors.olive,
    });
    expect(projectSprite(sprites.bush)).toMatchObject({
      char: "τ",
      foreground: colors.olive,
    });
    for (const facing of ["up", "right", "down", "left"] as const) {
      expect(projectSprite(prism.iron.default, facing)).toMatchObject({
        char: { up: "▲", right: "►", down: "▼", left: "◄" }[facing],
        foreground: colors.grey,
      });
    }
    expect(projectSprite(eye.gold.default)).toMatchObject({
      char: "O",
      foreground: colors.yellow,
    });
    expect(projectSprite(key.iron.default)).toMatchObject({
      char: "╒",
      foreground: colors.grey,
    });
  });

  it("draws arrows in their actual shot direction and fence posts as crossings", () => {
    for (const facing of ["up", "right", "down", "left"] as const) {
      expect(projectSprite(shot.wood.default, facing).char).toBe(
        { up: "↑", right: "→", down: "↓", left: "←" }[facing]
      );
    }
    expect(projectSprite(sprites.fence).char).toBe("±");
  });

  it("draws directional dash marks and small trap crosses in their spell colors", () => {
    for (const sprite of [
      dash.iron.default,
      dash.iron.fire,
      dash.default.earth,
    ]) {
      for (const facing of ["up", "right", "down", "left"] as const) {
        expect(projectSprite(sprite, facing)).toMatchObject({
          char: { up: "^", right: ">", down: "v", left: "<" }[facing],
        });
        expect(projectSprite(sprite, facing).foreground).not.toBe(colors.black);
      }
    }
    expect(projectSprite(trigger.iron.default)).toEqual({
      char: "%",
      foreground: colors.grey,
    });
    expect(projectSprite(triggerSide.iron.fire, "up")).toMatchObject({
      char: "|",
    });
    expect(projectSprite(triggerSide.iron.fire, "right")).toMatchObject({
      char: "-",
    });
    expect(projectSprite(triggerCorner.iron.fire, "up")).toMatchObject({
      char: "\\",
    });
    expect(projectSprite(triggerCorner.iron.fire, "right")).toMatchObject({
      char: "/",
    });
  });

  it("keeps the activated trap frame and beam particles visible", () => {
    expect(
      trapBorder.map((border) => projectSprite(border.iron.fire).char).join("")
    ).toBe("─┐│┘─└│┌");
    for (const border of trapBorder)
      expect(projectSprite(border.iron.fire).foreground).not.toBe(colors.black);
    for (const facing of ["up", "right", "down", "left"] as const) {
      expect(projectSprite(edge.iron.fire, facing).foreground).not.toBe(
        colors.black
      );
      expect(projectSprite(edge.iron.fire, facing)).toEqual({
        char: { up: "┴", right: "├", down: "┬", left: "┤" }[facing],
        foreground: colors.red,
      });
    }
    for (const amount of [1, 2, 3]) {
      expect(
        projectSprite(bolt.iron.fire, undefined, amount).foreground
      ).not.toBe(colors.black);
      expect(projectSprite(bolt.iron.fire, undefined, amount)).toEqual({
        char: ":",
        foreground: colors.red,
      });
    }
  });

  it("keeps selected popup text over the dialog background", () => {
    expect(
      projectLayers(
        [
          { char: "█", color: colors.black },
          { char: "▄", color: colors.green },
          { char: "▀", color: colors.black },
          { char: "e", color: colors.white },
        ],
        "popup_overlay"
      )
    ).toEqual({
      char: "e",
      foreground: colors.white,
      background: colors.green,
    });
  });

  it("preserves upper and lower title blocks before selection inversion", () => {
    expect(
      projectLayers(
        [
          { char: "█", color: colors.maroon },
          { char: "▀", color: colors.black },
        ],
        "title"
      )
    ).toEqual({
      char: "▄",
      foreground: colors.maroon,
      background: colors.black,
    });
  });

  it("preserves both pixel colors in the sprite builder preview", () => {
    expect(
      projectLayers(
        [
          { char: "▀", color: colors.red },
          { char: "▄", color: colors.blue },
        ],
        "sprite_pixel_pair"
      )
    ).toEqual({
      char: "▀",
      foreground: colors.red,
      background: colors.blue,
    });
    expect(
      projectLayers(
        [
          { char: "▀", color: colors.black },
          { char: "▄", color: colors.maroon },
        ],
        "sprite_pixel_pair"
      )
    ).toEqual({
      char: "▄",
      foreground: colors.maroon,
      background: colors.black,
    });
  });

  it("keeps the settled ALIVE title's solid cells filled through fog", () => {
    const world = createTestWorld({ level: "LEVEL_MENU" });
    advance(world, 10000);
    const scene = getSceneFrame(world, 33, 16, undefined, { instant: true });
    const title = collectTerminalSprites(
      scene.filter((entry) => /^block_(up|down)$/.test(entry.sprite.name))
    );
    const solids = title.filter(
      (entry) =>
        entry.layers.some((layer) => layer.char === "▀") &&
        entry.layers.some((layer) => layer.char === "▄")
    );
    expect(solids.length).toBeGreaterThan(0);
    for (const entry of solids) {
      expect(projectLayers(entry.layers, entry.sprite.name).char).toBe("█");
      const frame = createTerminalFrame([{ ...entry, fog: true }], 33, 16);
      expect(frame[Math.ceil(entry.y)][Math.ceil(entry.x)].char).toBe("█");
    }
    expect(
      title.some(
        (entry) => projectLayers(entry.layers, entry.sprite.name).char === "▄"
      )
    ).toBe(true);
    expect(
      title.some(
        (entry) => projectLayers(entry.layers, entry.sprite.name).char === "▀"
      )
    ).toBe(true);
  });

  it("keeps text-art block directions and XP labels in the native screen", () => {
    expect(
      createText("█▀▄", colors.white)
        .map((sprite) => projectSprite(sprite).char)
        .join("")
    ).toBe("█▀▄");
    const bar = createProgress({ xp: 0, maxXp: 10 }, "xp", 13);
    expect(bar.map((sprite) => projectSprite(sprite).char).join("")).toContain(
      "xXP"
    );
  });

  it("keeps warning flashes and the inverted pause button recognizable", () => {
    expect(projectSprite(sprites.warnOn)).toEqual({
      char: "!",
      foreground: colors.red,
    });
    expect(projectSprite(sprites.warnOff)).toEqual({
      char: "O",
      foreground: colors.red,
    });
    expect(projectLayers(sprites.pauseInvert.layers, "button_generic")).toEqual(
      {
        char: "║",
        foreground: colors.black,
        background: colors.white,
      }
    );
  });

  it("keeps terrain patterns distinct without losing their colors", () => {
    expect(projectSprite(sprites.sand)).toMatchObject({
      char: "%",
      foreground: colors.yellow,
    });
    expect(projectSprite(sprites.path)).toMatchObject({
      char: "░",
      foreground: colors.silver,
    });
    expect(projectSprite(sprites.waterDeep)).toMatchObject({
      char: " ",
      foreground: colors.blue,
      background: colors.navy,
    });
    expect(projectSprite(sprites.wall)).toMatchObject({
      char: "█",
      background: colors.silver,
    });
  });

  it("distinguishes terrain, fruit and wildlife in one cell", () => {
    expect(projectSprite(sprites.tree1)).toEqual({
      char: "#",
      foreground: colors.green,
      background: colors.maroon,
    });
    expect(projectSprite(sprites.leaves)).toEqual({
      char: "▄",
      foreground: colors.green,
    });
    expect(projectSprite(sprites.berry)).toEqual({
      char: "'",
      foreground: colors.fuchsia,
    });
    expect(projectSprite(sprites.box)).toEqual({
      char: "■",
      foreground: colors.maroon,
    });
    expect(projectSprite(sprites.chick)).toEqual({
      char: "♦",
      foreground: colors.yellow,
    });
    for (const facing of ["up", "right", "down", "left"] as const) {
      expect(projectSprite(sprites.worm, facing)).toMatchObject({
        char: facing === "up" || facing === "down" ? "|" : "-",
        foreground: colors.red,
      });
      expect(projectSprite(eye.gold.default, facing)).toEqual({
        char: "Ö",
        foreground: colors.yellow,
      });
    }
    expect(projectSprite(sprites.bubble, undefined, 1).char).toBe("•");
    expect(projectSprite(sprites.bubble, undefined, 2).char).toBe("o");
    expect(projectSprite(sprites.bubble, undefined, 3).char).toBe("O");
  });

  it("draws useful terminal symbols for doors, tools, switches and experience", () => {
    expect(projectSprite(doorOpen.wood.default)).toEqual({
      char: " ",
      foreground: colors.black,
    });
    expect(projectSprite(doorClosed.wood.default)).toEqual({
      char: "╒",
      foreground: colors.black,
      background: colors.maroon,
    });
    expect(projectSprite(doorClosed.gold.default)).toEqual({
      char: "╒",
      foreground: colors.yellow,
      background: colors.maroon,
    });
    expect(projectSprite(sprites.fishing).char).toBe("⌠");
    expect(projectSprite(sprites.leverOff)).toEqual({
      char: "≤",
      foreground: colors.red,
    });
    expect(projectSprite(sprites.leverOn)).toEqual({
      char: "≥",
      foreground: colors.lime,
    });
    expect(projectSprite(sprites.close)).toEqual({
      char: "X",
      foreground: colors.red,
    });
    for (const amount of [1, 2, 3])
      expect(projectSprite(sprites.xp, undefined, amount)).toEqual({
        char: amount === 1 ? "x" : "X",
        foreground: colors.lime,
      });
  });

  it("uses dark fountain water with visible lines and connected building outlines", () => {
    expect(projectSprite(sprites.fountain)).toEqual({
      char: "v",
      foreground: colors.blue,
      background: colors.navy,
    });
    expect(projectSprite(sprites.fountainSide, "up")).toEqual({
      char: "─",
      foreground: colors.blue,
      background: colors.navy,
    });
    expect(projectSprite(sprites.fountainCorner, "left")).toEqual({
      char: "┌",
      foreground: colors.blue,
      background: colors.navy,
    });
    const outline = [
      sprites.roofLeftUp,
      sprites.roofUp,
      sprites.roofUpRight,
      sprites.roofDownLeft,
      sprites.roofDown,
      sprites.roofRightDown,
      sprites.houseLeft,
      sprites.houseRight,
    ];
    expect(outline.map((sprite) => projectSprite(sprite).char).join("")).toBe(
      "╔═╗╠═╣││"
    );
    for (const sprite of outline)
      expect(projectSprite(sprite)).toMatchObject({
        foreground: colors.maroon,
        background: colors.silver,
      });
    expect(projectSprite(sprites.house).background).toBe(colors.silver);
    expect(projectSprite(sprites.rogue).foreground).toBe(colors.silver);
  });

  it("preserves progress labels and inverts selected dialog text", () => {
    const bar = createProgress({ hp: 12, maxHp: 25 }, "hp", 13);
    expect(bar.map((sprite) => projectSprite(sprite).char).join("")).toContain(
      "12/25"
    );
    expect(
      projectSprite(shaded(createText("S", colors.grey), colors.green, "▄")[0])
    ).toEqual({
      char: "S",
      foreground: colors.white,
      background: colors.green,
    });
    expect(
      projectSprite(shaded(createText("S", colors.white), colors.silver)[0])
    ).toEqual({
      char: "S",
      foreground: colors.black,
      background: colors.silver,
    });
  });

  it("applies black masks before choosing a visible terminal glyph", () => {
    expect(
      projectLayers([
        { char: "█", color: colors.red },
        { char: "█", color: colors.black },
      ])
    ).toMatchObject({ foreground: colors.black, background: colors.black });
    expect(
      projectLayers([
        { char: "█", color: colors.black },
        { char: "A", color: colors.lime },
      ])
    ).toEqual({ char: "A", foreground: colors.lime, background: colors.black });
  });

  it("projects every exported sprite, direction and stack variant to one printable character", () => {
    const named = Object.values(sprites).filter(
      (sprite): sprite is Sprite =>
        !!sprite && Array.isArray((sprite as Sprite).layers)
    );
    for (const sprite of named.filter((sprite) => sprite.terminal)) {
      for (const facing of [undefined, "up", "right", "down", "left"] as const)
        for (const amount of [undefined, 1, 2, 3]) {
          const cell = projectSprite(sprite, facing, amount);
          expect([...cell.char]).toHaveLength(1);
          expect(cell.foreground).toMatch(/^#[0-9a-f]{6}$/i);
          expect(cell.background || colors.black).toMatch(/^#[0-9a-f]{6}$/i);
        }
    }
    for (const sprite of named) {
      const variants = [
        sprite.layers,
        ...Object.values(sprite.facing || {}),
        ...Object.values(sprite.amounts || {}),
      ];
      for (const layers of variants) {
        const cell = projectLayers(layers!, sprite.name);
        expect([...cell.char]).toHaveLength(1);
        expect(cell.char.codePointAt(0)).toBeGreaterThanOrEqual(32);
        expect(cell.foreground).toMatch(/^#[0-9a-f]{6}$/i);
        expect(cell.background || colors.black).toMatch(/^#[0-9a-f]{6}$/i);
        expect(projectLayers(layers!, sprite.name)).toBe(cell);
      }
    }
  });
});

it("uses source-defined terminal item displays without changing the browser layers", () => {
  const cases = [
    [sprites.grain, "¥", colors.yellow],
    [sprites.cactus1, "√", colors.green],
    [sprites.cactus2, "√", colors.green],
    [sprites.palm1, "Y", colors.green],
    [sprites.palm2, "Y", colors.green],
    [sprites.rock1, "▬", colors.silver],
    [sprites.rock2, "○", colors.silver],
    [sprites.ghost, "♀", colors.yellow],
    [sprites.shroom, "·", colors.maroon],
    [sprites.flower, "·", colors.teal],
    [sprites.coconut, "○", colors.maroon],
  ] as const;
  for (const [sprite, char, foreground] of cases) {
    expect(projectSprite(sprite)).toMatchObject({ char, foreground });
    expect(sprite.layers).not.toEqual(sprite.terminal!.layers);
  }
  for (const stackable of ["berry", "worm"] as const) {
    const cell = projectSprite(getItemSprite({ stackable }));
    expect(cell.char.trim()).not.toBe("");
    expect(cell.background).toBeUndefined();
  }
  expect(
    [1, 2, 3].map(
      (amount) => projectSprite(sprites.leaf, undefined, amount).char
    )
  ).toEqual(["-", "=", "≡"]);
  expect(projectSprite(sprites.xpDot)).toMatchObject({
    char: "·",
    foreground: colors.lime,
  });
});

it("keeps material potion shapes and stat colors in filled and empty forms", () => {
  for (const [material, char, empty, color] of [
    ["wood", "σ", sprites.emptyFlask, colors.maroon],
    ["iron", "δ", sprites.emptyBottle, colors.grey],
    ["gold", "♂", sprites.emptyPotion, colors.yellow],
  ] as const) {
    for (const [stat, foreground] of [
      ["hp", colors.red],
      ["mp", colors.blue],
    ] as const) {
      expect(
        projectSprite(getItemSprite({ consume: "potion", material, stat }))
      ).toMatchObject({ char, foreground });
    }
    expect(projectSprite(empty)).toMatchObject({ char, foreground: color });
  }
  expect(
    projectSprite(getItemSprite({ consume: "key", material: "gold" }))
  ).toMatchObject({ char: "╒", foreground: colors.yellow });
  expect(projectSprite(getItemSprite({ stackable: "coin" }))).toMatchObject({
    char: "°",
    foreground: colors.yellow,
  });
});

it("keeps class and equipped NPC references as silver human characters", () => {
  for (const classKey of classes) {
    const data = getClassData(classKey);
    const icon = mergeSprites(data.backdrop || sprites.none, data.sprite);
    expect(projectSprite(icon)).toMatchObject({
      char: "♀",
      foreground: colors.silver,
    });
  }
  for (const unit of [
    "guide",
    "earthSmith",
    "earthDruid",
    "earthGuard",
    "banditKnight",
    "banditArcher",
  ] as const) {
    expect(projectSprite(getUnitSprite(unit))).toMatchObject({
      char: "♀",
      foreground: colors.silver,
    });
  }
  expect(projectSprite(sprites.swimmingRogue)).toMatchObject({
    char: "♀",
    foreground: colors.silver,
  });
  expect(projectSprite(sprites.chief)).toMatchObject({
    char: "♀",
    foreground: colors.silver,
  });
  expect(projectSprite(sprites.ghost)).toMatchObject({
    char: "♀",
    foreground: colors.yellow,
  });
});
