import { render } from "@testing-library/react";
import World from ".";
import { createAreaWorld } from "../../testing/harness";
import { getDialog, setupHero } from "../../features/chat/helpers";
import { STATS } from "../../engine/components/stats";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

it("binds test-mode chat to the mounted world and removes it on unmount", () => {
  const world = createAreaWorld("|  ♀  |");
  const hero = setupHero(world);
  const { unmount } = render(<World createInitialWorld={() => world} />);
  expect(window.aliveChat).toEqual(expect.any(Function));
  window.aliveChat!("hello");
  expect(getDialog(hero)).toEqual(["hello"]);
  window.aliveChat!("/stat hp 12");
  expect(hero[STATS].hp).toBe(12);
  unmount();
  expect(window.aliveChat).toBeUndefined();
});

it.each([undefined, ""])("clears speech with %p without adding history", (line) => {
  const world = createAreaWorld("|  ♀  |");
  const hero = setupHero(world);
  render(<World createInitialWorld={() => world} />);
  window.aliveChat!("hello");
  window.aliveChat!(line);
  expect(getDialog(hero)).toEqual([]);
  expect(hero.PLAYER.chatHistory).toHaveLength(1);
  expect(hero.TOOLTIP!.override).toBeUndefined();
});

it("does not expose chat outside test mode", () => {
  const utils = jest.requireMock("../../engine/utils");
  utils.TEST_MODE = false;
  try {
    const world = createAreaWorld("|  ♀  |");
    render(<World createInitialWorld={() => world} />);
    expect(window.aliveChat).toBeUndefined();
  } finally {
    utils.TEST_MODE = true;
  }
});
