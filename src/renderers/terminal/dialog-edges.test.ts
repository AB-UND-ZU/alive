import { colors } from "../../game/assets/colors";
import { interactLeft, interactRight } from "../../game/assets/sprites";
import { createButton } from "../../game/assets/ui";
import { createTerminalFrame, frameToText } from "./frame";
import { advance, assertHero, createAreaWorld } from "../../testing/harness";
import { createPopup, openPopup } from "../../engine/systems/popup";
import { getTerminalFrame, getTerminalLayout } from "./screen";
import { projectSprite } from "./sprites";

it("keeps expanding interaction edges identical to the completed button", () => {
  const button = createButton("READ", 6, false, false, false, "lime");
  const completed = createTerminalFrame(
    button.map((sprite, x) => ({
      x,
      y: 0,
      z: 0,
      sprite,
      layers: sprite.layers,
    })),
    6,
    1
  )[0];
  expect(projectSprite(interactLeft)).toEqual(completed[0]);
  expect(projectSprite(interactRight)).toEqual(completed[5]);
  expect(completed[0]).toEqual({
    char: "[",
    foreground: colors.black,
    background: colors.lime,
  });
  expect(completed[5]).toEqual({
    char: "]",
    foreground: colors.black,
    background: colors.lime,
  });
  expect(interactLeft.layers).toContainEqual({
    char: "│",
    color: colors.green,
  });
  expect(interactRight.layers).toContainEqual({
    char: "│",
    color: colors.green,
  });
});

it.each([false, true])(
  "keeps both ends of a narrow inventory popup visible (instant=%s)",
  (instant) => {
    const world = createAreaWorld("| ♀ |", { size: 48 });
    const hero = assertHero(world);
    createPopup(world, hero, { tabs: ["inspect"] });
    openPopup(world, hero, hero, instant);
    advance(world, 2000);
    const { top, height } = getTerminalLayout(21, 20);
    const content = frameToText(
      getTerminalFrame(world, 21, 20).slice(top, top + height)
    );
    expect(content).toContain("[ BAG ]");
    expect(content).toContain("[X]");
    expect(content).toContain("[USE]");
  }
);
