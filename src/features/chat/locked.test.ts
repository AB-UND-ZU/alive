import { createAreaWorld } from "../../testing/harness";
import { PLAYER } from "../../engine/components/player";
import { getTab, isInPopup } from "../../engine/systems/popup";
import {
  act,
  getDialog,
  getDrops,
  getMenu,
  getPrompt,
  openChat,
  setupHero,
  submit,
  type,
} from "./helpers";

const area = `
|     |
| ♀   |
|     |
`;

describe("chat outside of test mode", () => {
  it("keeps the prompt without sending a message or running a command", () => {
    const world = createAreaWorld(area);
    const hero = setupHero(world);
    openChat(world);
    type(world, "/give sword");

    submit(world);

    expect(isInPopup(world, hero)).toBeTruthy();
    expect(getPrompt(world)).toBe("/give sword");
    expect(getDialog(hero)).toEqual([]);
    expect(hero[PLAYER].chatHistory).toEqual([]);
    expect(getDrops(world)).toEqual([]);
  });

  it("does not open from the empty rows of the quick menu", () => {
    const world = createAreaWorld(area);
    const hero = setupHero(world);
    act(world, "use");

    hero[PLAYER].contentTriggered = 1;
    hero[PLAYER].offsetTriggered = 0;
    act(world, "content");

    expect(getTab(world, getMenu(world))).toBe("use");
  });
});
