import * as sprites from "../../game/assets/sprites";
import { Sprite } from "../../engine/components/sprite";
import { colors } from "../../game/assets/colors";
import { createText } from "../../game/assets/ui";
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
    expect(projectSprite(sprites.rogue)).toMatchObject({
      char: "@",
      background: undefined,
    });
    expect(projectSprite(sprites.apple)).toMatchObject({
      char: "o",
      foreground: colors.red,
      background: undefined,
    });
    expect(projectSprite(sprites.waterShallow)).toMatchObject({
      char: " ",
      background: colors.teal,
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

  it("uses foliage symbols for leaves and hedges instead of face-shaped pixel matches", () => {
    for (const sprite of [
      sprites.leaves,
      sprites.hedge1,
      sprites.hedge2,
      sprites.hedgeDry1,
      sprites.hedgeDry2,
    ]) {
      expect(projectSprite(sprite).char).toBe("♣");
    }
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
