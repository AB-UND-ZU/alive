import { completeCommand } from "../../game/assets/commands";
import {
  completeChat,
  navigateChat,
  getTabSelections,
  submitChat,
} from "../../engine/systems/popup";
import { displayChat } from "../../game/assets/sequences";
import { getSequence } from "../../engine/systems/sequence";
import { colors } from "../../game/assets/colors";
import { createAreaWorld } from "../../testing/harness";
import { getMenu, getPrompt, openChat, setupHero, type } from "./helpers";
import { composeCharacterPixels } from "../../components/Row/characters";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const setup = () => {
  const world = createAreaWorld("|   ♀   |");
  const hero = setupHero(world);
  return { world, hero };
};

it.each([
  ["/gi", "ve "],
  ["/give sw", "ord "],
  ["/g sword 1 i", "ron "],
  ["/give sword 1 iron f", "ire "],
  ["/mod re", "set "],
  ["/new water_d", "eep "],
  ["hello", ""],
  ["/unknown x", ""],
  ["/give sword ", "10 "],
  ["/new rock ", "1 "],
  ["/give sword 10 d", "iamond "],
  ["/give sword 10 def", ""],
  ["/give potion 10 r", ""],
  ["/give potion 10 wood h", "p "],
  ["/give potion 10 wood max", ""],
  ["/stat hp ", ""],
  ["/tp 4,", ""],
  ["/pin new", ""],
  ["/cast z", ""],
  ["/cast wave wood fire extra", ""],
])("completes %s using valid command arguments", (input, expected) => {
  const { world } = setup();
  expect(completeCommand(world, input)).toBe(expected);
});

it("cycles only through visible item variants and supported potion stats", () => {
  const { world } = setup();
  expect(completeCommand(world, "/give potion 10 wood ", 0)).toBe("hp ");
  expect(completeCommand(world, "/give potion 10 wood ", 1)).toBe("mp ");
  expect(completeCommand(world, "/give potion 10 wood ", 2)).toBe("hp ");
  expect(completeCommand(world, "/give sword 10 default ")).toBe("air ");
  expect(completeCommand(world, "/give compass 10 iron ")).toBe("");
});

it("cycles suggestions without changing the draft and accepts the chosen value", () => {
  const { world, hero } = setup();
  openChat(world);
  type(world, "/give s");
  navigateChat(world, hero, 1);
  expect(getPrompt(world)).toBe("/give s");
  const selected = completeCommand(world, "/give s", 1);
  expect(selected).not.toBe(completeCommand(world, "/give s", 0));
  completeChat(world, hero);
  expect(getPrompt(world)).toBe("/give s" + selected);
});

it("wraps the suggestion index in both directions", () => {
  const { world } = setup();
  expect(completeCommand(world, "/give potion 10 wood ", -1)).toBe("mp ");
  expect(completeCommand(world, "/give potion 10 wood ", 2)).toBe("hp ");
});

it("completes identifiers that actually exist on the current map", () => {
  const { world, hero } = setup();
  expect(completeCommand(world, "/tp campsite")).toBe("");
  submitChat(world, hero, "/pin campsite 2,0");
  expect(completeCommand(world, "/tp camps")).toBe("ite ");
  expect(completeCommand(world, "/focus camps")).toBe("ite ");
});

it("accepts only the suggested suffix and keeps the keyboard selection format", () => {
  const { world, hero } = setup();
  openChat(world);
  type(world, "/gi");
  completeChat(world, hero);
  expect(getPrompt(world)).toBe("/give ");
  expect(getTabSelections(world, getMenu(world))).toHaveLength(6);
  type(world, "sw");
  completeChat(world, hero);
  expect(getPrompt(world)).toBe("/give sword ");
});

it("leaves ordinary messages unchanged", () => {
  const { world, hero } = setup();
  openChat(world);
  type(world, "hello");
  completeChat(world, hero);
  expect(getPrompt(world)).toBe("hello");
});

it("wraps gray suggestions inside the chat and leaves the caret at the typed position", () => {
  const { world } = setup();
  openChat(world);
  type(world, "/give sword 1 iron f");
  const menu = getMenu(world);
  const sequence = getSequence(world, menu, "popup")!;
  world.metadata.gameEntity.RENDERABLE.generation = 2;
  displayChat(world, menu, sequence);
  const cell = (row: number, column: number) =>
    world.assertByIdAndComponents(
      sequence.particles[`popup-content-${row}-${column}`],
      ["SPRITE"]
    ).SPRITE;
  expect(cell(1, 4).layers).toContainEqual({ char: "r", color: colors.grey });
  expect(cell(1, 5).layers).toContainEqual({ char: "e", color: colors.grey });
  expect(cell(1, 3).layers).toContainEqual({
    char: "\u0107",
    color: colors.white,
  });
  expect(getPrompt(world)).toBe("/give sword 1 iron f");
});

it("keeps every gray suggestion pixel visible in both caret phases", () => {
  const { world } = setup();
  openChat(world);
  type(world, "/give sword 1 iron f");
  const menu = getMenu(world);
  const sequence = getSequence(world, menu, "popup")!;
  const phases = [2, 3].map((generation) => {
    world.metadata.gameEntity.RENDERABLE.generation = generation;
    displayChat(world, menu, sequence);
    const sprite = world.assertByIdAndComponents(
      sequence.particles["popup-content-1-3"],
      ["SPRITE"]
    ).SPRITE;
    return composeCharacterPixels(sprite.layers);
  });
  const grayPixels = (pixels: (string | undefined)[]) =>
    pixels.flatMap((color, index) => (color === colors.grey ? [index] : []));
  expect(grayPixels(phases[0])).not.toEqual([]);
  expect(grayPixels(phases[0])).toEqual(grayPixels(phases[1]));
  expect(phases[0]).not.toEqual(phases[1]);
});

it("keeps the typing position visible when a command exceeds the four chat rows", () => {
  const { world } = setup();
  openChat(world);
  type(world, "/pin " + "a".repeat(80));
  const menu = getMenu(world);
  const sequence = getSequence(world, menu, "popup")!;
  world.metadata.gameEntity.RENDERABLE.generation = 2;
  displayChat(world, menu, sequence);
  const caret = world.assertByIdAndComponents(
    sequence.particles["popup-content-3-0"],
    ["SPRITE"]
  ).SPRITE;
  expect(caret.layers).toContainEqual({ char: "\u0107", color: colors.white });
});

it("ignores identifiers that cannot be entered with the game keyboard", () => {
  const { world, hero } = setup();
  submitChat(world, hero, "/pin café");
  openChat(world);
  type(world, "/tp caf");
  expect(() => completeChat(world, hero)).not.toThrow();
  expect(getPrompt(world)).toBe("/tp caf");
});
