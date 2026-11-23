import {
  castAs,
  createArea,
  createSpellWorld,
} from "../../features/spells/helpers";
import { MOVABLE } from "../../engine/components/movable";
import { POSITION } from "../../engine/components/position";
import { getAbilityStats } from "../../game/balancing/abilities";
import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  step,
} from "../../testing/harness";
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

it("honors a terminal direction change and release during dash recovery", () => {
  const dash = { spell: "dash", material: "wood" } as const;
  const { range } = getAbilityStats(dash);
  const area = createArea(range + 5, 4, { "♀": { x: 1, y: 1 } });
  const { world, hero } = createSpellWorld(area, dash, { size: 30 });
  const input = createTerminalInput(world, undefined, {
    releaseOnTimeout: false,
  });
  input.press({ name: "right" });
  castAs(world, hero, dash, "right");
  advanceUntil(world, () => !hero[MOVABLE]);
  input.press({ name: "down" });
  advanceUntil(world, () => hero[POSITION].x === 1 + range);
  input.release("down");
  step(world, 100);
  expect(hero[POSITION]).toEqual({ x: 1 + range, y: 1 });
});
