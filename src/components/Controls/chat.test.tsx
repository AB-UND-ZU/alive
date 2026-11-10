/* eslint-disable testing-library/no-node-access, testing-library/no-container -- keyboard gestures target the native hit area */
import { act, fireEvent } from "@testing-library/react";
import Controls from ".";
import { renderHud } from "./testing";
import { createAreaWorld, step } from "../../testing/harness";
import {
  getDialog,
  getPrompt,
  openChat,
  setupHero,
} from "../../features/chat/helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const setup = (paused = false) => {
  const world = createAreaWorld("|  ♀  |");
  const hero = setupHero(world);
  openChat(world);
  const view = renderHud(world, <Controls />, { paused });
  return { world, hero, ...view };
};

it("keeps every character and edit typed between game updates", () => {
  const { world, hero } = setup();
  for (const key of [..."hello therx", "Backspace", "e", "Enter"])
    fireEvent.keyDown(document.body, { key });
  expect(getPrompt(world)).toBe("hello there");
  act(() => step(world, 15));
  expect(getDialog(hero)).toEqual(["hello there"]);
});

it("accepts held letters and backspace in chat", () => {
  const { world } = setup();
  for (const key of ["a", "a", "a", "Backspace"])
    fireEvent.keyDown(document.body, { key, repeat: true });
  expect(getPrompt(world)).toBe("aa");
});

it("does not type while paused or when a system shortcut is pressed", () => {
  const { world, unmount } = setup(true);
  fireEvent.keyDown(document.body, { key: "x" });
  expect(getPrompt(world)).toBe("");
  unmount();
  const next = setup();
  fireEvent.keyDown(document.body, { key: "x", metaKey: true });
  fireEvent.keyDown(document.body, { key: "x", altKey: true });
  expect(getPrompt(next.world)).toBe("");
});

it("Tab accepts the gray command suffix without changing dialog tabs", () => {
  const { world } = setup();
  for (const key of [..."/gi", "Tab", "s", "w", "Tab"])
    fireEvent.keyDown(document.body, { key });
  expect(getPrompt(world)).toBe("/give sword ");
});

it.each([false, true])(
  "a right swipe completes once, including over the keyboard: %p",
  (keyboard) => {
    const { world, container, tick } = setup();
    for (const key of "/gi") fireEvent.keyDown(document.body, { key });
    const target = keyboard
      ? container.querySelector("#keyboard")!
      : document.body;
    const touch = (event: "touchStart" | "touchMove", x: number) =>
      fireEvent[event](window, {
        touches: [{ clientX: x, clientY: 100 }],
        changedTouches: [{ target }],
      });
    touch("touchStart", 100);
    touch("touchMove", 160);
    expect(getPrompt(world)).toBe("/give ");
    touch("touchMove", 180);
    expect(getPrompt(world)).toBe("/give ");
    fireEvent.touchEnd(window, { touches: [], changedTouches: [{ target }] });
    tick(15);
    expect(getPrompt(world)).toBe("/give ");
  }
);

it("routes typing and completion to a newly opened chat before a React update", () => {
  const world = createAreaWorld("|  ♀  |");
  setupHero(world);
  renderHud(world, <Controls />);
  act(() => {
    openChat(world);
    for (const key of [..."/gi", "Tab", "s", "w", "Tab"])
      fireEvent.keyDown(document.body, { key });
  });
  expect(getPrompt(world)).toBe("/give sword ");
});
