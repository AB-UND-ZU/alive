import { World } from "../../engine";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { CLICKABLE } from "../../engine/components/clickable";
import { COLLIDABLE } from "../../engine/components/collidable";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { POSITION } from "../../engine/components/position";
import { REVIVABLE } from "../../engine/components/revivable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { VIEWABLE } from "../../engine/components/viewable";
import { disposeEntity, getCellEntities } from "../../engine/systems/map";
import { getSequence } from "../../engine/systems/sequence";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { leverOff, leverOn } from "../../game/assets/sprites";
import { roomSize } from "../../game/levels/tutorial/areas";
import {
  advanceUntil,
  assertHero,
  createTestWorld,
  getHero,
  step,
} from "../../testing/harness";
import { teleport } from "../creatures/helpers";
import { interactAsPlayer } from "../doors/helpers";
import { getStep, refresh } from "./helpers";

const setupTutorial = () => {
  const world = createTestWorld({ level: "LEVEL_TUTORIAL" });
  const hero = world.assertComponents(assertHero(world), [STATS]);
  const viewpoint = world
    .getEntities([SEQUENCABLE, VIEWABLE, POSITION])
    .find(
      (entity) => getSequence(world, entity, "npc")?.name === "tutorialNpc"
    )!;
  step(world, 5);
  return { world, hero, viewpoint };
};

const named = (world: World, name: string) =>
  world
    .getEntities([IDENTIFIABLE])
    .filter((entity) => entity[IDENTIFIABLE].name === name);

const enterRoom = (world: World, offsetY: number) => {
  teleport(world, assertHero(world), { x: 0, y: offsetY + 1 });
  refresh(world);
};

const respawn = (world: World) => {
  advanceUntil(
    world,
    () => !!world.getEntity([REVIVABLE])?.[REVIVABLE].available,
    10000
  );
  advanceUntil(world, () => !!world.metadata.interact.active, 1000);
  interactAsPlayer(world);
};

describe("tutorial rooms", () => {
  it("starts in the first room with its quest", () => {
    const { world, hero, viewpoint } = setupTutorial();

    expect(getStep(world, viewpoint)).toBe("wait");
    expect(viewpoint[POSITION]).toEqual({ x: 0, y: 0 });
    expect(getSequence(world, hero, "quest")?.name).toBe("centerQuest");
  });

  it("reveals the next room and moves the camera there", () => {
    const { world, hero, viewpoint } = setupTutorial();
    expect(named(world, "north1:float").length).toBeGreaterThan(0);

    enterRoom(world, -roomSize.y);
    advanceUntil(world, () => getStep(world, viewpoint) === "wait", 2000);

    expect(viewpoint[POSITION]).toEqual({ x: 0, y: 72 - roomSize.y });
    expect(viewpoint[VIEWABLE].active).toBe(true);
    expect(named(world, "north1:float")).toHaveLength(0);
    expect(getSequence(world, hero, "quest")?.name).toBe("north1Quest");
  });

  it("locks the hero into an arena room and starts the waves", () => {
    const { world, viewpoint } = setupTutorial();

    enterRoom(world, -roomSize.y * 3);
    advanceUntil(world, () => getStep(world, viewpoint) === "fight", 2000);

    expect(named(world, "north3:blocker")).toHaveLength(2);
    expect(named(world, "north3:barrier").length).toBeGreaterThan(0);
    const spawners = named(world, "north3:spawner");
    expect(spawners).toHaveLength(2);
    spawners.forEach((spawner) =>
      expect(
        world.assertComponents(spawner, [BEHAVIOUR])[BEHAVIOUR].patterns[0].name
      ).toBe("spawner")
    );
  });

  it("opens the arena again once the hero dies in it", () => {
    const { world, hero, viewpoint } = setupTutorial();
    enterRoom(world, -roomSize.y * 3);
    advanceUntil(world, () => getStep(world, viewpoint) === "fight", 2000);

    hero[STATS].hp = 0;
    respawn(world);
    advanceUntil(world, () => getStep(world, viewpoint) === "death", 5000);

    expect(viewpoint[VIEWABLE].active).toBe(false);
    expect(named(world, "north3:blocker")).toHaveLength(0);
    expect(named(world, "north3:barrier")).toHaveLength(0);
    named(world, "north3:spawner").forEach((spawner) =>
      expect(
        world.assertComponents(spawner, [BEHAVIOUR])[BEHAVIOUR].patterns
      ).toEqual([])
    );
  });

  it("follows the hero again after respawning", () => {
    const { world, hero, viewpoint } = setupTutorial();
    enterRoom(world, -roomSize.y * 3);
    advanceUntil(world, () => getStep(world, viewpoint) === "fight", 2000);
    hero[STATS].hp = 0;
    respawn(world);
    advanceUntil(world, () => getStep(world, viewpoint) === "death", 5000);

    advanceUntil(world, () => !!getHero(world), 20000);
    advanceUntil(world, () => getStep(world, viewpoint) === "wait", 5000);

    expect(viewpoint[VIEWABLE].active).toBe(true);
    expect(viewpoint[POSITION]).toEqual({ x: 0, y: 0 });
  });

  it("opens the arena once all waves are defeated", () => {
    const { world, viewpoint } = setupTutorial();
    enterRoom(world, -roomSize.y * 3);
    advanceUntil(world, () => getStep(world, viewpoint) === "fight", 2000);

    named(world, "north3:spawner").forEach((spawner) =>
      disposeEntity(world, spawner)
    );
    advanceUntil(world, () => getStep(world, viewpoint) === "wait", 2000);

    expect(named(world, "north3:blocker")).toHaveLength(0);
    expect(named(world, "north3:barrier")).toHaveLength(0);
  });

  it("opens the shortcut to the first room with the final lever", () => {
    const { world } = setupTutorial();
    const lever = assertIdentifierAndComponents(world, "unlock_lever", [
      CLICKABLE,
      SPRITE,
    ]);
    const shortcut = { x: 0, y: roomSize.y / 2 };
    const isBlocked = () =>
      getCellEntities(world, shortcut).some((entity) => COLLIDABLE in entity);

    expect(lever[SPRITE]).toBe(leverOff);
    expect(isBlocked()).toBe(true);

    lever[CLICKABLE].clicked = true;
    step(world, 5);

    expect(lever[SPRITE]).toBe(leverOn);
    expect(isBlocked()).toBe(false);
  });
});
