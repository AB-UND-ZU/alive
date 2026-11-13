import * as sprites from "../../game/assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { colors } from "../../game/assets/colors";
import { eye, prism } from "../../game/assets/templates/creatures";
import { key } from "../../game/assets/templates/items";
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
import { createText, createProgress, shaded } from "../../game/assets/ui";
import { projectLayers, projectSprite, terminalCharacter } from "./sprites";

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
      char: "ô",
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
    expect(projectSprite(sprites.fence).char).toBe("+");
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
      char: "x",
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
        char: "•",
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
      char: "▀",
      foreground: colors.black,
      background: colors.maroon,
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
      char: "▀",
      foreground: colors.black,
      background: colors.maroon,
    });
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
      char: "░",
      foreground: colors.black,
      background: colors.olive,
    });
    expect(projectSprite(sprites.path)).toMatchObject({
      char: "·",
      foreground: colors.black,
      background: colors.grey,
    });
    expect(projectSprite(sprites.waterDeep)).toMatchObject({
      char: "≈",
      foreground: colors.blue,
      background: colors.navy,
    });
    expect(projectSprite(sprites.wall)).toMatchObject({
      char: " ",
      background: colors.grey,
    });
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
