import { createAreaWorld, walk } from "../../testing/harness";
import { FOCUSABLE } from "../../engine/components/focusable";
import { POSITION } from "../../engine/components/position";
import {
  assertIdentifierAndComponents,
  getIdentifierAndComponents,
} from "../../engine/utils";
import { getDialog, say, setupHero } from "./helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const area = `
|       |
| ♀     |
|       |
|       |
|       |
`;

const setup = () => {
  const world = createAreaWorld(area, { size: 10 });
  return { world, hero: setupHero(world) };
};

const getPin = (world: ReturnType<typeof setup>["world"], name: string) =>
  getIdentifierAndComponents(world, name, [POSITION]);

describe("tp command", () => {
  it("moves the hero to a location", () => {
    const { world, hero } = setup();

    say(world, "/tp 5,3");

    expect(hero[POSITION]).toEqual({ x: 5, y: 3 });
    expect(getDialog(hero)).toEqual([]);
  });

  it("wraps negative locations around the map", () => {
    const { world, hero } = setup();

    say(world, "/t -2,3");

    expect(hero[POSITION]).toEqual({ x: 8, y: 3 });
  });

  it("moves the hero to a named pin", () => {
    const { world, hero } = setup();
    say(world, "/pin camp 6,4");

    say(world, "/tp camp");

    expect(hero[POSITION]).toEqual({ x: 6, y: 4 });
  });

  it.each([
    ["/tp a,b", 'No loc "a,b"!'],
    ["/tp 1,2,3", 'No id "1,2,3"!'],
    ["/tp nowhere", 'No id "nowhere"!'],
    ["/tp", "/tp <id|x,y>"],
  ])("rejects %s and stays in place", (command, error) => {
    const { world, hero } = setup();

    say(world, command);

    expect(getDialog(hero)).toEqual([error]);
    expect(hero[POSITION]).toEqual({ x: 1, y: 1 });
  });
});

describe("pin command", () => {
  it("marks the hero position to return to later", () => {
    const { world, hero } = setup();
    say(world, "/p home");
    walk(world, "right", 2);

    say(world, "/tp home");

    expect(getPin(world, "home")?.[POSITION]).toEqual({ x: 1, y: 1 });
    expect(hero[POSITION]).toEqual({ x: 1, y: 1 });
  });

  it("marks a wrapped location", () => {
    const { world } = setup();

    say(world, "/pin camp -1,2");

    expect(getPin(world, "camp")?.[POSITION]).toEqual({ x: 9, y: 2 });
  });

  it("rejects a duplicate name", () => {
    const { world, hero } = setup();
    say(world, "/pin camp 4,4");

    say(world, "/pin camp 2,2");

    expect(getDialog(hero)).toEqual(['Duplicate "camp"!']);
    expect(getPin(world, "camp")?.[POSITION]).toEqual({ x: 4, y: 4 });
  });

  it("rejects an invalid location", () => {
    const { world, hero } = setup();

    say(world, "/pin camp x,y");

    expect(getDialog(hero)).toEqual(['No loc "x,y"!']);
    expect(getPin(world, "camp")).toBeUndefined();
  });
});

describe("focus command", () => {
  const getFocus = (world: ReturnType<typeof setup>["world"]) =>
    assertIdentifierAndComponents(world, "focus", [FOCUSABLE])[FOCUSABLE];

  it("highlights a named pin and clears it again", () => {
    const { world } = setup();
    say(world, "/pin camp 6,4");

    say(world, "/focus camp");

    expect(getFocus(world).highlight).toBe("quest");
    expect(getFocus(world).pendingTarget).toBe(
      world.getEntityId(getPin(world, "camp")!)
    );

    say(world, "/f");

    expect(getFocus(world).highlight).toBeUndefined();
  });

  it("rejects an unknown name", () => {
    const { world, hero } = setup();

    say(world, "/focus nobody");

    expect(getDialog(hero)).toEqual(['No id "nobody"!']);
    expect(getFocus(world).highlight).toBeUndefined();
  });
});
