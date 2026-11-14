import { selectViewable } from "../../engine/players";
import { PLAYER } from "../../engine/components/player";
import { LEVEL } from "../../engine/components/level";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { collectItem } from "../../engine/systems/collect";
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
import { createHero } from "../../engine/systems/fate";
import { registerEntity } from "../../engine/systems/map";
import { disposeEntity, getCellEntities } from "../../engine/systems/map";
import { getSequence } from "../../engine/systems/sequence";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { leverOff, leverOn } from "../../game/assets/sprites";
import { roomSize } from "../../game/levels/tutorial/areas";
import {
  advance,
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

it("starts a dungeon fight for the arriving teammate and closes its barriers", () => {
  const { world, hero, viewpoint } = setupTutorial();
  world.metadata.warpPlayer = () => {};
  const teammate = createHero(world, hero);
  registerEntity(world, teammate);
  teleport(world, teammate, { x: 0, y: -roomSize.y * 3 + 1 });
  refresh(world);
  advanceUntil(world, () => getStep(world, viewpoint) === "fight", 2000);
  expect(
    named(world, "north3:spawner").some(
      (entity) => entity.SPAWNABLE || entity.BEHAVIOUR
    )
  ).toBe(true);
  expect(named(world, "north3:blocker").length).toBeGreaterThan(0);
  expect(named(world, "north3:barrier").length).toBeGreaterThan(0);
});

it("keeps the tutorial starter stick as shared ground loot, without giving teammates swords", () => {
  const { world, hero } = setupTutorial();
  world.metadata.warpPlayer = () => {};
  const teammate = createHero(world, hero);
  registerEntity(world, teammate);
  const source = assertIdentifierAndComponents(world, "wood_one", [INVENTORY]);
  expect(collectItem(world, hero, source)).toBe(true);
  advance(world, 1500);
  const swords = (player: typeof teammate) =>
    player[INVENTORY].items
      .map((id) => world.assertByIdAndComponents(id, [ITEM]))
      .filter((item) => item[ITEM].weapon === "sword");
  expect(swords(teammate)).toHaveLength(0);
  expect(hero[EQUIPPABLE]!.weapon).not.toBe(teammate[EQUIPPABLE].weapon);
  expect(collectItem(world, hero, source)).toBe(false);
  expect(world.metadata.gameEntity[LEVEL].cooperativeRewards).toBeUndefined();
  const arriving = createHero(world, hero);
  arriving.PLAYER!.rewardOffsets = {};
  registerEntity(world, arriving);
  advance(world, 1500);
  expect(swords(arriving)).toHaveLength(0);
  expect(swords(teammate)).toHaveLength(0);
});

it("keeps the single-player starter pickup as one ordinary wooden sword", () => {
  const { world, hero } = setupTutorial();
  const source = assertIdentifierAndComponents(world, "wood_one", [INVENTORY]);
  expect(collectItem(world, hero, source)).toBe(true);
  advance(world, 1500);
  const items = world.assertComponents(hero, [INVENTORY])[INVENTORY].items;
  expect(items).toHaveLength(1);
  expect(world.assertByIdAndComponents(items[0], [ITEM])[ITEM].weapon).toBe(
    "sword"
  );
  expect(world.metadata.gameEntity[LEVEL].cooperativeRewards).toBeUndefined();
});

it("keeps dungeon quests stable while teammates occupy different rooms", () => {
  const { world, hero } = setupTutorial();
  world.metadata.warpPlayer = () => {};
  const teammate = createHero(world, hero);
  registerEntity(world, teammate);
  enterRoom(world, -roomSize.y);
  teleport(world, teammate, { x: 0, y: -roomSize.y * 2 + 1 });
  advance(world, 1500);
  const quest = getSequence(world, teammate, "quest");
  expect(quest?.name).toBe("north2Quest");
  expect(getSequence(world, hero, "quest")?.name).toBe("north1Quest");
  advance(world, 2000);
  expect(getSequence(world, teammate, "quest")).toBe(quest);
  const arriving = createHero(world, hero);
  registerEntity(world, arriving);
  teleport(world, arriving, teammate[POSITION]);
  advance(world, 1000);
  expect(getSequence(world, arriving, "quest")?.name).toBe("north2Quest");
  expect(getSequence(world, teammate, "quest")).toBe(quest);
});

it("restarts an interrupted cooperative fight when the party reconnects", () => {
  const { world, hero, viewpoint } = setupTutorial();
  world.metadata.warpPlayer = () => {};
  enterRoom(world, -roomSize.y * 3);
  advanceUntil(world, () => getStep(world, viewpoint) === "fight", 2000);
  hero[PLAYER]!.connected = false;
  advanceUntil(world, () => getStep(world, viewpoint) === "wait", 2000);
  hero[PLAYER]!.connected = true;
  advanceUntil(world, () => getStep(world, viewpoint) === "fight", 2000);
  expect(
    named(world, "north3:spawner").some(
      (spawner) => spawner[BEHAVIOUR]?.patterns[0]?.name === "spawner"
    )
  ).toBe(true);
});

it("reveals the optional pond when another teammate has already cleared a later room", () => {
  const { world, hero, viewpoint } = setupTutorial();
  world.metadata.warpPlayer = () => {};
  enterRoom(world, -roomSize.y * 3);
  advanceUntil(world, () => getStep(world, viewpoint) === "fight", 2000);
  named(world, "north3:spawner").forEach((spawner) =>
    disposeEntity(world, spawner)
  );
  advanceUntil(world, () => getStep(world, viewpoint) === "wait", 2000);
  const teammate = createHero(world, hero);
  registerEntity(world, teammate);
  teleport(world, teammate, { x: roomSize.x, y: -roomSize.y * 2 });
  advanceUntil(
    world,
    () => named(world, "north2east1:float").length === 0,
    2000
  );
  expect(getSequence(world, teammate, "quest")?.name).toBe("north2East1Quest");
  const quest = getSequence(world, teammate, "quest");
  advance(world, 1000);
  expect(getSequence(world, teammate, "quest")).toBe(quest);
});

it("keeps dungeon cameras in each player's own room", () => {
  const { world, hero } = setupTutorial();
  world.metadata.warpPlayer = () => {};
  const teammate = createHero(world, hero);
  registerEntity(world, teammate);
  teleport(world, hero, { x: 0, y: -roomSize.y });
  teleport(world, teammate, { x: 0, y: 0 });
  advance(world, 1000);
  const cameras = world.getEntities([VIEWABLE, POSITION]);
  const first = selectViewable(cameras, world, world.getEntityId(hero));
  const second = selectViewable(cameras, world, world.getEntityId(teammate));
  expect(first).not.toBe(second);
  expect(first?.[POSITION]).toEqual({ x: 0, y: 72 - roomSize.y });
  expect(second?.[POSITION]).toEqual({ x: 0, y: 0 });
});
