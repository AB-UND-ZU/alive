import {
  createAreaWorld,
  advance,
  advanceUntil,
  giveItems,
  assertHero,
} from "../../testing/harness";
import { SPRITE } from "../../engine/components/sprite";
import { INVENTORY } from "../../engine/components/inventory";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites, createTerminalFrame } from "./frame";
import { PLAYER } from "../../engine/components/player";
import { MOVABLE } from "../../engine/components/movable";
import { ACTIONABLE } from "../../engine/components/actionable";
import { REFERENCE } from "../../engine/components/reference";
import { POSITION } from "../../engine/components/position";
import { isInPopup } from "../../engine/systems/popup";
import { openChat, getPrompt, getDialog } from "../../features/chat/helpers";
import { createTerminalInput } from "./input";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));
const setup = () => {
  const world = createAreaWorld(`
|       |
| ♀     |
|       |
`);
  const hero = world.assertComponents(assertHero(world), [
    ACTIONABLE,
    PLAYER,
    MOVABLE,
    POSITION,
  ]);
  const input = createTerminalInput(world);
  return { world, hero, input };
};

describe("native terminal controls", () => {
  afterEach(() => jest.useRealTimers());

  it("keeps an equipped hero recognizable while composing backdrop and gear layers", () => {
    const { world, hero, input } = setup();
    const carrier = world.assertComponents(hero, [INVENTORY, SPRITE, POSITION]);
    giveItems(world, carrier, [
      { weapon: "sword", material: "iron", amount: 1 },
      { offhand: "shield", material: "iron", amount: 1 },
    ]);
    advance(world, 1000);
    const scene = getSceneFrame(world, 5, 5);
    const original = scene.filter(
      (entry) => entry.entity === hero && /body\d+$/.test(entry.key)
    );
    const combined = collectTerminalSprites(scene).filter(
      (entry) => entry.x === original[0].x && entry.y === original[0].y
    );
    const body = combined.find((entry) => entry.sprite === hero[SPRITE])!;
    expect(body.layers.length).toBe(
      original.reduce((sum, entry) => sum + entry.layers.length, 0)
    );
    expect(
      createTerminalFrame([body], 5, 5)
        .flat()
        .some((cell) => cell.char === "♀")
    ).toBe(true);
    input.stop();
  });

  it("types fast chat input without losing characters and Enter sends it", () => {
    const { world, hero, input } = setup();
    openChat(world);
    const text = "hello fast terminal";
    for (const char of text) input.press({ sequence: char });
    expect(getPrompt(world)).toBe(text);
    input.press({ name: "backspace" });
    expect(getPrompt(world)).toBe(text.slice(0, -1));
    input.press({ name: "return" });
    advance(world, 700);
    expect(getDialog(hero)).toEqual([text.slice(0, -1)]);
    expect(isInPopup(world, hero)).toBeFalsy();
    input.stop();
  });

  it("opens and closes quick actions with Tab and closes chat with Escape", () => {
    const { world, hero, input } = setup();
    input.press({ name: "tab" });
    advance(world, 700);
    expect(isInPopup(world, hero)).toBeTruthy();
    input.press({ name: "tab" });
    advance(world, 700);
    expect(isInPopup(world, hero)).toBeFalsy();
    openChat(world);
    input.press({ name: "escape" });
    advance(world, 700);
    expect(isInPopup(world, hero)).toBeFalsy();
    input.stop();
  });

  it("moves and casts without cancelling held movement, then releases it", () => {
    jest.useFakeTimers();
    const { world, hero, input } = setup();
    const x = hero[POSITION].x;
    input.press({ name: "right" });
    advanceUntil(world, () => hero[POSITION].x !== x);
    expect(hero[POSITION].x).toBe(x + 1);
    input.press({ name: "space" });
    expect(hero[MOVABLE].orientations).toEqual(["right"]);
    expect(hero[ACTIONABLE].spellTriggered).toBe(true);
    const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
      REFERENCE,
    ])[REFERENCE];
    expect(reference.suspensionCounter).toBe(-1);
    jest.advanceTimersByTime(100);
    expect(hero[MOVABLE].orientations).toEqual([]);
    input.stop();
  });

  it("maps terminal skill keys without turning them into a spell or movement", () => {
    const { hero, input } = setup();
    input.press({ name: "space", shift: true });
    expect(hero[ACTIONABLE].skillTriggered).toBe(true);
    expect(hero[ACTIONABLE].spellTriggered).toBe(false);
    hero[ACTIONABLE].skillTriggered = false;
    input.press({ name: "s", ctrl: true });
    expect(hero[ACTIONABLE].skillTriggered).toBe(true);
    expect(hero[MOVABLE].orientations).toEqual([]);
    input.stop();
  });
});

it("closes a terminal dialog without waiting for another simulation tick", () => {
  const world = createAreaWorld(`
|       |
| ♀     |
|       |
`);
  const hero = assertHero(world);
  openChat(world);
  const elapsed = world.metadata.elapsed;
  const input = createTerminalInput(world);
  input.press({ name: "escape" });
  expect(isInPopup(world, hero)).toBeFalsy();
  expect(world.metadata.elapsed).toBe(elapsed);
  input.stop();
});
