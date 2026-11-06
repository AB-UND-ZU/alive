import { createAreaWorld, findInArea, step, walk } from "../../testing/harness";
import { World } from "../../engine";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { ITEM } from "../../engine/components/item";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { TRACKABLE } from "../../engine/components/trackable";
import {
  getIdentifier,
  getIdentifierAndComponents,
  setHighlight,
} from "../../engine/utils";
import { assertUnit, tryMove } from "./helpers";

// φ compass, the map wraps around after 14 columns
const area = `
|              |
|              |
|  ♀φ          |
|              |
|              |
`;

const compassPosition = findInArea(area, "φ");

const getCompass = (world: World) =>
  getIdentifierAndComponents(world, "compass", [ITEM, TRACKABLE, ORIENTABLE])!;

const getFocus = (world: World) =>
  getIdentifierAndComponents(world, "focus", [FOCUSABLE, POSITION])!;

const pickUpCompass = (world: World) => {
  tryMove(world, "right");
  step(world, 15);
};

describe("compass and focus", () => {
  it("highlights the compass lying on the ground", () => {
    const world = createAreaWorld(area);
    step(world, 5);

    const focus = getFocus(world);
    expect(focus[FOCUSABLE].highlight).toBe("quest");
    expect(focus[FOCUSABLE].target).toBe(getCompass(world)[ITEM].carrier);
    expect(focus[POSITION]).toEqual(compassPosition);
  });

  it("points a dropped compass towards the hero", () => {
    const world = createAreaWorld(area);
    step(world, 5);

    const compass = getCompass(world);
    expect(compass[TRACKABLE].target).toBe(
      world.getEntityId(assertUnit(world))
    );
    expect(compass[ORIENTABLE].facing).toBe("left");
  });

  it("equips the compass and removes the highlight when picking it up", () => {
    const world = createAreaWorld(area);
    const hero = assertUnit(world);

    pickUpCompass(world);

    const compass = getCompass(world);
    expect(hero[EQUIPPABLE].compass).toBe(world.getEntityId(compass));
    expect(compass[ITEM].carrier).toBe(world.getEntityId(hero));
    expect(getFocus(world)[FOCUSABLE].target).toBeUndefined();
  });

  it("points a carried compass back to the spawn", () => {
    const world = createAreaWorld(area);
    pickUpCompass(world);
    const compass = getCompass(world);

    expect(compass[TRACKABLE].target).toBe(
      world.getEntityId(getIdentifier(world, "spawn")!)
    );
    expect(compass[ORIENTABLE].facing).toBe("left");

    walk(world, "down", 5);
    step(world, 5);
    expect(compass[ORIENTABLE].facing).toBe("up");
  });

  it("points the shorter way around the wrapping map", () => {
    const world = createAreaWorld(area);
    pickUpCompass(world);

    walk(world, "right", 7);
    step(world, 5);

    expect(getCompass(world)[ORIENTABLE].facing).toBe("right");
  });

  it("keeps the focus on a moving target", () => {
    const world = createAreaWorld(area);
    const hero = assertUnit(world);
    pickUpCompass(world);
    setHighlight(world, "enemy", hero);
    step(world, 5);

    walk(world, "down", 2);
    step(world, 5);

    const focus = getFocus(world);
    expect(focus[FOCUSABLE].target).toBe(world.getEntityId(hero));
    expect(focus[POSITION]).toEqual(hero[POSITION]);

    setHighlight(world);
    step(world, 5);
    expect(focus[FOCUSABLE].target).toBeUndefined();
  });
});
