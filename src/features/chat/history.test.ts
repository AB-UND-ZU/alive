import { createAreaWorld } from "../../testing/harness";
import {
  submitChat,
  navigateChat,
  completeChat,
} from "../../engine/systems/popup";
import { getPrompt, openChat, setupHero, type } from "./helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const setup = () => {
  const world = createAreaWorld("|  ♀  |");
  const hero = setupHero(world);
  return { world, hero };
};

afterEach(() => jest.restoreAllMocks());

it("persists submitted lines and reads them with Up in a new game", () => {
  const first = setup();
  submitChat(first.world, first.hero, "  first  ");
  submitChat(first.world, first.hero, "second");
  expect(JSON.parse(localStorage.getItem("alive.chatHistory")!)).toHaveLength(
    2
  );
  const { world, hero } = setup();
  expect(hero.PLAYER!.chatHistory).toEqual([]);
  openChat(world);
  navigateChat(world, hero, -1);
  expect(getPrompt(world)).toBe("second");
  navigateChat(world, hero, -1);
  expect(getPrompt(world)).toBe("first");
  navigateChat(world, hero, 1);
  expect(getPrompt(world)).toBe("second");
  navigateChat(world, hero, 1);
  expect(getPrompt(world)).toBe("");
});

it("returns to completion when a recalled line is edited", () => {
  const { world, hero } = setup();
  submitChat(world, hero, "/give s");
  openChat(world);
  navigateChat(world, hero, -1);
  type(world, "w");
  navigateChat(world, hero, 1);
  completeChat(world, hero);
  expect(getPrompt(world)).toBe("/give sword ");
});

it.each(["invalid JSON", "{}", "[null]", '[["x"]]', "[[-1]]", "[[999]]"])(
  "ignores malformed history: %s",
  (stored) => {
    const { world, hero } = setup();
    submitChat(world, hero, "remember");
    localStorage.setItem("alive.chatHistory", stored);
    openChat(world);
    expect(() => navigateChat(world, hero, -1)).not.toThrow();
    expect(getPrompt(world)).toBe("remember");
  }
);

it.each(["getItem", "setItem"] as const)(
  "keeps session history when storage %s fails",
  (method) => {
    const { world, hero } = setup();
    jest.spyOn(Storage.prototype, method).mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    expect(() => submitChat(world, hero, "remember")).not.toThrow();
    openChat(world);
    navigateChat(world, hero, -1);
    expect(getPrompt(world)).toBe("remember");
  }
);

it("does not persist an empty or whitespace-only submission", () => {
  const { world, hero } = setup();
  submitChat(world, hero, "   ");
  expect(localStorage.getItem("alive.chatHistory")).toBeNull();
  expect(hero.PLAYER!.chatHistory).toEqual([]);
});
