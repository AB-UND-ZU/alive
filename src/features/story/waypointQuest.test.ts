import { STATS } from "../../engine/components/stats";
import { getSequence } from "../../engine/systems/sequence";
import { questSequence } from "../../game/assets/utils";
import {
  assertHero,
  createAreaWorld,
  findInArea,
  step,
  walk,
} from "../../testing/harness";
import { addNpc, getFocus, getStep, refresh } from "./helpers";

// ♀ hero, H someone to find
const area = `
|                  |
|  ♀          H    |
|                  |
`;

const setupWaypoint = (memory: object, giver = false) => {
  const world = createAreaWorld(area, { size: 30 });
  const hero = world.assertComponents(assertHero(world), [STATS]);
  const target = addNpc(world, "earthTrader", findInArea(area, "H"));
  questSequence(
    world,
    hero,
    "waypointQuest",
    { distance: 2, ...memory },
    giver ? target : undefined
  );
  refresh(world);
  return { world, hero, target };
};

describe("waypoint quest", () => {
  it("focuses a target by its identifier", () => {
    const { world, hero, target } = setupWaypoint({
      identifier: "earthTrader",
      highlight: "enemy",
    });

    expect(getStep(world, hero, "quest")).toBe("search");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(target),
      highlight: "enemy",
    });
  });

  it("focuses the quest giver without a target", () => {
    const { world, target } = setupWaypoint({}, true);

    expect(getFocus(world)).toEqual({
      target: world.getEntityId(target),
      highlight: "quest",
    });
  });

  it("waits while the target doesn't exist", () => {
    const { world, hero } = setupWaypoint({ identifier: "missing" });

    expect(getStep(world, hero, "quest")).toBe("START_STEP");
    expect(getFocus(world).target).toBeUndefined();
  });

  it("clears the focus when the hero arrives near the target", () => {
    const { world, hero, target } = setupWaypoint({
      identifier: "earthTrader",
    });

    walk(world, "right", 6);
    step(world, 5);
    expect(getFocus(world).target).toBe(world.getEntityId(target));

    walk(world, "right", 4);
    step(world, 5);

    expect(getSequence(world, hero, "quest")).toBeUndefined();
    expect(getFocus(world).target).toBeUndefined();
  });
});
