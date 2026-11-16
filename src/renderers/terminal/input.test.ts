import { advance, assertHero, createAreaWorld } from "../../testing/harness";
import { PLAYER } from "../../engine/components/player";
import { createTerminalInput } from "./input";
import { TEST_MODE } from "../../engine/utils";

it.each(["return", "/", "c"])(
  "keeps chat disabled without test mode for %s",
  (name) => {
    expect(TEST_MODE).toBe(false);
    const world = createAreaWorld("|     |\n| ♀   |\n|     |");
    const hero = assertHero(world);
    const input = createTerminalInput(world);
    input.press({ name, sequence: name });
    advance(world, 700);
    expect(hero[PLAYER].popup).toBeUndefined();
    input.stop();
  }
);

it.each(["e", "b", "m", "g", "t", "tab", "0", "9"])(
  "keeps the menu's %s shortcut disabled like the browser controls",
  (name) => {
    const world = createAreaWorld("|     |\n| ♀   |\n|     |", {
      level: "LEVEL_MENU",
    });
    const hero = assertHero(world);
    const input = createTerminalInput(world);
    input.press({ name, sequence: name });
    expect(hero[PLAYER].actionTriggered).toBeUndefined();
    advance(world, 700);
    expect(hero[PLAYER].popup).toBeUndefined();
    input.stop();
  }
);

it("keeps bag access available outside the menu", () => {
  const world = createAreaWorld("|     |\n| ♀   |\n|     |");
  const hero = assertHero(world);
  const input = createTerminalInput(world);
  input.press({ name: "b" });
  advance(world, 700);
  expect(hero[PLAYER].popup).toBeDefined();
  input.stop();
});
