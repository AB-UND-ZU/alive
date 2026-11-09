import {
  advanceUntil,
  assertHero,
  countItems,
  createAreaWorld,
  createTestWorld,
  findInArea,
  giveItems,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { World } from "../../engine";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { LOCKABLE } from "../../engine/components/lockable";
import { NPC } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { getSequence } from "../../engine/systems/sequence";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { questSequence } from "../../game/assets/utils";
import { teleport } from "../creatures/helpers";
import { interact } from "../doors/helpers";
import {
  addNpc,
  claimQuest,
  getFocus,
  getLines,
  getStep,
  press,
  refresh,
} from "../story/helpers";
import { setupTown } from "../story/town";

// ♀ hero, H someone to find
const waypointArea = `
|                  |
|  ♀          H    |
|                  |
`;

const getNpc = (world: World, npcId: number) =>
  world.assertByIdAndComponents(npcId, [NPC, POSITION]);

// shows the interaction prompt again, see the todo in doors.test.ts
const revisit = (world: World) => {
  walk(world, "left");
  walk(world, "right");
  step(world, 5);
};

const getStoryHero = (world: World) =>
  world.assertComponents(assertHero(world), [
    EQUIPPABLE,
    INVENTORY,
    POSITION,
    STATS,
  ]);

const startTutorial = () => {
  const world = createTestWorld({ level: "LEVEL_TUTORIAL" });
  step(world, 5);
  walk(world, "down");
  teleport(world, assertHero(world), { x: 5, y: 4 });
  refresh(world);
  interact(world, 30);
  trigger(world, "close");
  step(world, 30);
  return world;
};

describe("saved story", () => {
  it("continues the chief's quests where they were left", () => {
    const { world, chief } = setupTown();
    const chiefId = world.getEntityId(chief);

    const loaded = saveAndLoad(world);
    const hero = getStoryHero(loaded);
    expect(getStep(loaded, getNpc(loaded, chiefId))).toBe("compass");
    revisit(loaded);
    claimQuest(loaded);
    advanceUntil(loaded, () => hero[STATS].xp === 3, 3000);

    expect(hero[EQUIPPABLE].compass).toBeDefined();
    expect(getStep(loaded, getNpc(loaded, chiefId))).toBe("wood");
  });

  it("rewards the chief's next quest after loading", () => {
    const { world, chief } = setupTown();
    const chiefId = world.getEntityId(chief);
    claimQuest(world);
    step(world, 30);

    const loaded = saveAndLoad(world);
    const hero = getStoryHero(loaded);
    const loadedChief = getNpc(loaded, chiefId);
    expect(getStep(loaded, loadedChief)).toBe("wood");
    expect(getLines(loadedChief)[0]).toBe("Gathering is the");

    giveItems(loaded, hero, [
      { stackable: "resource", material: "wood", amount: 1 },
    ]);
    revisit(loaded);
    interact(loaded, 30);
    press(loaded, "right");
    press(loaded, "down");
    press(loaded, "right");
    press(loaded, "close");
    step(loaded, 5);

    expect(countItems(loaded, hero, { tool: "axe" })).toBe(1);
    expect(countItems(loaded, hero, { stackable: "resource" })).toBe(0);
    expect(getStep(loaded, loadedChief)).toBe("plants");
  });

  it("keeps the tutorial quest focus and finishes it at the door", () => {
    const world = startTutorial();
    expect(getStep(world, assertHero(world), "quest")).toBe("key");

    const loaded = saveAndLoad(world);
    const hero = assertHero(loaded);
    const key = assertIdentifierAndComponents(loaded, "spawn_key", [POSITION]);
    const door = assertIdentifierAndComponents(loaded, "center:door", [
      LOCKABLE,
      POSITION,
    ]);
    step(loaded, 5);
    expect(getStep(loaded, hero, "quest")).toBe("key");
    expect(getFocus(loaded)).toEqual({
      target: loaded.getEntityId(key),
      highlight: "quest",
    });

    teleport(loaded, hero, { x: -3, y: 4 });
    walk(loaded, "left");
    step(loaded, 30);
    expect(getStep(loaded, hero, "quest")).toBe("door");
    expect(getFocus(loaded).target).toBe(loaded.getEntityId(door));

    teleport(loaded, hero, { x: 0, y: -5 });
    refresh(loaded);
    interact(loaded, 30);
    advanceUntil(loaded, () => !getSequence(loaded, hero, "quest"), 3000);

    expect(door[LOCKABLE].locked).toBe(false);
    expect(getFocus(loaded).target).toBeUndefined();
  });

  it("keeps guiding to a waypoint until the hero arrives", () => {
    const world = createAreaWorld(waypointArea, { size: 30 });
    const target = addNpc(world, "earthTrader", findInArea(waypointArea, "H"));
    const targetId = world.getEntityId(target);
    questSequence(world, assertHero(world), "waypointQuest", {
      distance: 2,
      identifier: "earthTrader",
    });
    refresh(world);
    walk(world, "right", 6);
    step(world, 5);

    const loaded = saveAndLoad(world);
    const hero = assertHero(loaded);
    step(loaded, 5);
    expect(getStep(loaded, hero, "quest")).toBe("search");
    expect(getFocus(loaded).target).toBe(targetId);

    walk(loaded, "right", 4);
    step(loaded, 5);

    expect(getSequence(loaded, hero, "quest")).toBeUndefined();
    expect(getFocus(loaded).target).toBeUndefined();
  });
});
