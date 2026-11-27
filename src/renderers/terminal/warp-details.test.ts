import { createAreaWorld, assertHero } from "../../testing/harness";
import { createCell } from "../../bindings/creation";
import { POPUP } from "../../engine/components/popup";
import { getWarpMap } from "../../game/assets/warp";
import { fountainCorner, fountainSide, sand } from "../../game/assets/sprites";
import { getOrientedSprite } from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";
import { overlay } from "../../game/assets/pixels";
import { composeCharacterPixels } from "../../components/Row/characters";
import { projectSprite } from "./sprites";

const setup = () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const hero = assertHero(world);
  const portal = createCell(
    world,
    { ...hero.POSITION! },
    "portal",
    "visible"
  ).cell;
  portal[POPUP]!.horizontalIndex = portal[POPUP]!.tabs.indexOf("warp");
  portal[POPUP]!.verticalIndezes[portal[POPUP]!.horizontalIndex] = 14;
  return { world, portal };
};

it("keeps every oriented fountain frame cell inside its navy water background", () => {
  const { world, portal } = setup();
  const { background } = getWarpMap(world, portal);
  const chars = background.slice(9, 12).map((line) =>
    line
      .slice(1, 4)
      .map((sprite) => projectSprite(sprite).char)
      .join("")
  );
  expect(chars).toEqual(["┌─┐", "│v│", "└─┘"]);
  for (const line of background.slice(9, 12))
    for (const sprite of line.slice(1, 4))
      expect(projectSprite(sprite).background).toBe(colors.navy);
  for (const orientation of ["up", "right", "down", "left"] as const) {
    for (const sprite of [fountainCorner, fountainSide]) {
      const oriented = getOrientedSprite(sprite, orientation);
      expect(oriented.terminal!.layers).toEqual(
        sprite.terminal!.facing![orientation]
      );
      expect(oriented.layers).toEqual(sprite.facing![orientation]);
    }
  }
});

it("preserves sand inside the Island selection and uses olive under its frame", () => {
  const { world, portal } = setup();
  const { background, selection, content } = getWarpMap(world, portal);
  expect(projectSprite(sand)).toEqual({
    char: "░",
    foreground: colors.black,
    background: colors.olive,
  });
  const plain: { x: number; y: number }[] = [];
  const framed: { x: number; y: number }[] = [];
  background.forEach((line, y) =>
    line.forEach((sprite, x) => {
      if (sprite.id !== sand.id) return;
      const layers = selection[y]?.[x]?.layers || [];
      if (layers.every((layer) => layer.char === " ")) {
        plain.push({ x, y });
      } else if (layers.some((layer) => /[┌┐└┘─│]/.test(layer.char))) {
        framed.push({ x, y });
      }
    })
  );
  expect(plain.length).toBeGreaterThan(0);
  expect(framed.length).toBeGreaterThan(0);
  plain.forEach(({ x, y }) =>
    expect(projectSprite(content[y][x])).toEqual(projectSprite(sand))
  );
  framed.forEach(({ x, y }) =>
    expect(projectSprite(content[y][x]).background).toBe(colors.olive)
  );
  const original = overlay(background, selection);
  original.forEach((line, y) =>
    line.forEach((sprite, x) => {
      expect(composeCharacterPixels(content[y][x].layers)).toEqual(
        composeCharacterPixels(sprite.layers)
      );
    })
  );
});
