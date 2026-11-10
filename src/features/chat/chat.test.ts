import { createAreaWorld } from "../../testing/harness";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import { PLAYER } from "../../engine/components/player";
import { TOOLTIP } from "../../engine/components/tooltip";
import { getTab, isInPopup, submitChat } from "../../engine/systems/popup";
import {
  act,
  backspace,
  getDialog,
  getMenu,
  getPrompt,
  openChat,
  say,
  setupHero,
  submit,
  type,
} from "./helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const area = `
|     |
| ♀   |
|     |
`;

const setup = () => {
  const world = createAreaWorld(area);
  const hero = world.assertComponents(setupHero(world), [PLAYER, TOOLTIP]);
  return { world, hero, menu: getMenu(world) };
};

describe("chat", () => {
  it("submits an imported line with the same bubble and history as chat", () => {
    const { world, hero } = setup();
    submitChat(world, hero, "hello there");
    expect(getDialog(hero)).toEqual(["hello there"]);
    openChat(world);
    act(world, "up");
    expect(getPrompt(world)).toBe("hello there");
  });

  it("executes imported commands and returns their errors", () => {
    const { world, hero } = setup();
    expect(submitChat(world, hero, "/give nothing")).toBe('No item "nothing"!');
    expect(getDialog(hero)).toEqual(['No item "nothing"!']);
    expect(hero[TOOLTIP].enemy).toBe(true);
  });

  it("closes an open chat when a line is submitted externally", () => {
    const { world, hero } = setup();
    openChat(world);
    type(world, "draft");
    submitChat(world, hero, "sent");
    expect(isInPopup(world, hero)).toBeFalsy();
    expect(getDialog(hero)).toEqual(["sent"]);
  });

  it("trims sent messages and the recorded history", () => {
    const { world, hero } = setup();
    say(world, "  hello there  ");
    expect(getDialog(hero)).toEqual(["hello there"]);
    openChat(world);
    act(world, "up");
    expect(getPrompt(world)).toBe("hello there");
  });

  it("trims commands before parsing them", () => {
    const { world, hero } = setup();
    expect(submitChat(world, hero, "  /stat hp 12  ")).toBeUndefined();
    expect(hero.STATS!.hp).toBe(12);
    openChat(world);
    act(world, "up");
    expect(getPrompt(world)).toBe("/stat hp 12");
  });

  it("opens an empty chat tab in the menu", () => {
    const { world, hero, menu } = setup();

    openChat(world);

    expect(isInPopup(world, hero)).toBeTruthy();
    expect(getTab(world, menu)).toBe("chat");
    expect(getPrompt(world)).toBe("");
  });

  it("starts with a slash when opened with the command key", () => {
    const { world } = setup();

    openChat(world, true);

    expect(getPrompt(world)).toBe("/");
  });

  it("types letters, numbers, spaces and symbols with sounds", () => {
    const { world } = setup();
    openChat(world);
    resetPlayedSounds();

    type(world, "Hi 2,-3!");

    expect(getPrompt(world)).toBe("Hi 2,-3!");
    expect(playedSounds.filter((sound) => sound === "type")).toHaveLength(8);
  });

  it("deletes the last character with backspace", () => {
    const { world } = setup();
    openChat(world);
    type(world, "hey");

    backspace(world);

    expect(getPrompt(world)).toBe("he");
  });

  it("ignores backspace on an empty prompt", () => {
    const { world } = setup();
    openChat(world);

    backspace(world);

    expect(getPrompt(world)).toBe("");
  });

  it("shows a sent message in a speech bubble above the hero", () => {
    const { world, hero } = setup();

    say(world, "hello there");

    expect(isInPopup(world, hero)).toBeFalsy();
    expect(getDialog(hero)).toEqual(["hello there"]);
    expect(hero[TOOLTIP].enemy).toBe(false);
    expect(hero[TOOLTIP].override).toBe("visible");
  });

  it("shows command errors in a red shout bubble", () => {
    const { world, hero } = setup();

    say(world, "/give nothing");

    expect(getDialog(hero)).toEqual(['No item "nothing"!']);
    expect(hero[TOOLTIP].enemy).toBe(true);
  });

  it("closes without a bubble when sending an empty prompt", () => {
    const { world, hero } = setup();
    openChat(world);

    submit(world);

    expect(isInPopup(world, hero)).toBeFalsy();
    expect(getDialog(hero)).toEqual([]);
    expect(hero[PLAYER].chatHistory).toEqual([]);
  });

  it("clears the previous bubble when opening the chat again", () => {
    const { world, hero } = setup();
    say(world, "first");

    openChat(world);

    expect(getDialog(hero)).toEqual([]);
  });

  it("discards typed text when closing the chat", () => {
    const { world, hero } = setup();
    openChat(world);
    type(world, "draft");

    act(world, "close");
    openChat(world);

    expect(getPrompt(world)).toBe("");
    expect(hero[PLAYER].chatHistory).toEqual([]);
  });

  it("closes the chat when pressing the chat key again", () => {
    const { world, hero } = setup();
    openChat(world);

    openChat(world);

    expect(isInPopup(world, hero)).toBeFalsy();
  });

  it("recalls sent lines from newest to oldest and back", () => {
    const { world } = setup();
    say(world, "one");
    say(world, "two");
    openChat(world);

    act(world, "up");
    expect(getPrompt(world)).toBe("two");

    act(world, "up");
    expect(getPrompt(world)).toBe("one");

    act(world, "up");
    expect(getPrompt(world)).toBe("one");

    act(world, "down");
    expect(getPrompt(world)).toBe("two");

    act(world, "down");
    expect(getPrompt(world)).toBe("");
  });

  it("sends an edited line from the history as a new entry", () => {
    const { world, hero } = setup();
    say(world, "cat");
    openChat(world);
    act(world, "up");

    backspace(world);
    type(world, "r");
    submit(world);

    expect(getDialog(hero)).toEqual(["car"]);
    openChat(world);
    act(world, "up");
    expect(getPrompt(world)).toBe("car");
    act(world, "up");
    expect(getPrompt(world)).toBe("cat");
  });

  it("opens the chat from the empty rows of the quick menu", () => {
    const { world, hero, menu } = setup();
    act(world, "use");

    hero[PLAYER].contentTriggered = 1;
    hero[PLAYER].offsetTriggered = 0;
    act(world, "content");

    expect(isInPopup(world, hero)).toBeTruthy();
    expect(getTab(world, menu)).toBe("chat");
  });
});
