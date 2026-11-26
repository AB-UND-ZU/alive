import Systems from ".";
import Camera from "../Camera";
import {
  getCameraMotion, getMotion, sampleMotion, updateCameraMotion,
} from "../../../engine/motion";
import { executeCommand } from "../../../game/assets/commands";
import * as scene from "../../interface/scene";
import {
  assertHero,
  createAreaWorld,
  findInArea,
  holdMove,
  snapshot,
} from "../../../testing/harness";
import { renderScene } from "../testing";
import { getActiveViewable } from "../../interface/hooks";
import { VIEWABLE } from "../../../engine/components/viewable";
import { RENDERABLE } from "../../../engine/components/renderable";
import { LEVEL } from "../../../engine/components/level";
import { POSITION } from "../../../engine/components/position";
import { CASTABLE } from "../../../engine/components/castable";
import { normalize } from "../../../game/math/std";
import { entities } from "../../../engine";
import { createSequence } from "../../../engine/systems/sequence";
import { WeatherSequence } from "../../../engine/components/sequencable";
import { none } from "../../../game/assets/sprites";
import { moveEntity, registerEntity } from "../../../engine/systems/map";
import { TypedEntity } from "../../../engine/entities";
import type { ReactThreeTest } from "@react-three/test-renderer";

// replace entity visuals with a plain group carrying its render props
jest.mock("../Entity", () => ({
  __esModule: true,
  default: (props: any) =>
    require("react").createElement("group", {
      userData: { entity: props.entity, x: props.x, y: props.y },
    }),
}));

const mockShake = jest.fn();
jest.mock("@react-spring/three", () => {
  const actual = jest.requireActual("@react-spring/three");
  const api = {
    start: (...args: unknown[]) => mockShake(...args),
    pause: jest.fn(),
    resume: jest.fn(),
  };
  return { ...actual, useSpring: () => [{ x: 0, y: 0 }, api] };
});

beforeEach(() => mockShake.mockClear());

type EntityGroup = { entity: TypedEntity<"POSITION">; x: number; y: number };

const getEntityGroups = (scene: ReactThreeTest.Renderer["scene"]) =>
  scene
    .findAll((node) => !!node.instance.userData?.entity)
    .map((node) => node.instance.userData as EntityGroup);

// ♀ hero, █ mountain, # tree, ~ shallow water, ¾ sign, " " air
const area = `
|██████████|
|█ #   ~~ █|
|█   ♀    █|
|█ ¾    # █|
|██████████|
`;

const spawn = findInArea(area, "♀");

// larger than the viewport to not render wrapped duplicates
const createWorld = () => createAreaWorld(area, { size: 48 });

describe("Systems", () => {
  it("renders the weather anchor at its map position away from the map origin", async () => {
    const world = createAreaWorld(area, { size: 240 });
    const hero = assertHero(world);
    moveEntity(world, hero, { x: 190, y: 190 });
    const storm = entities.createAnchor(world, {
      POSITION: { x: 0, y: 0 },
      RENDERABLE: { generation: 0 },
      SEQUENCABLE: { states: {} },
      SPRITE: none,
    });
    registerEntity(world, storm);
    createSequence<"weather", WeatherSequence>(
      world,
      storm,
      "weather",
      "weatherStorm",
      {
        position: { x: 190, y: 190 },
        start: -200,
        end: Infinity,
        intensity: 100,
        generation: -1,
        drops: [],
        type: "rain",
      }
    );
    const { renderer, advanceFrames } = await renderScene(world, <Systems />);
    await advanceFrames(2);
    const rendered = getEntityGroups(renderer.scene);
    const anchor = rendered.find(({ entity }) => entity === storm)!;
    expect(anchor.x).toBe(190);
    expect(anchor.y).toBe(190);
    await renderer.unmount();
  });

  it.each(["LEVEL_MENU", "LEVEL_ISLAND"] as const)(
    "does not shake when entering a new %s world",
    async (level) => {
      const world = createAreaWorld(area, { size: 48, level });
      expect(world.metadata.gameEntity[RENDERABLE].generation).toBe(-1);
      const { renderer, advanceFrames } = await renderScene(world, <Systems />);
      await advanceFrames(4);
      expect(mockShake).not.toHaveBeenCalled();
      await renderer.unmount();
    }
  );

  it("shakes only while the active viewpoint's earthquake is running", async () => {
    const world = createWorld();
    const viewpoint = getActiveViewable(
      world.getEntities([VIEWABLE, POSITION])
    );
    viewpoint[VIEWABLE].quake =
      world.metadata.gameEntity[RENDERABLE].generation + 8;
    const { renderer, advanceFrames } = await renderScene(world, <Systems />);
    await advanceFrames(2);
    expect(mockShake).toHaveBeenCalled();

    viewpoint[VIEWABLE].quake =
      world.metadata.gameEntity[RENDERABLE].generation;
    mockShake.mockClear();
    await advanceFrames(2);
    expect(mockShake).not.toHaveBeenCalled();
    await renderer.unmount();
  });

  it("renders every entity within the viewport at its own cell", async () => {
    const world = createWorld();
    const hero = assertHero(world);
    const size = world.metadata.gameEntity[LEVEL].size;
    const { renderedColumns, renderedRows } = world.metadata.dimensions;

    const { renderer, advanceFrames } = await renderScene(world, <Systems />);
    await advanceFrames(2);

    const visible = getEntityGroups(renderer.scene);
    expect(visible.length).toBeGreaterThan(renderedColumns);
    expect(visible).toContainEqual({ entity: hero, ...spawn });

    // viewpoint starts at 0,0 and the overscan keeps cells rendered while
    // sliding over to the hero
    const within = (value: number, target: number, radius: number) =>
      value >= Math.min(0, target) - radius - 1 &&
      value <= Math.max(0, target) + radius + 1;

    for (const { entity, x, y } of visible) {
      if (CASTABLE in entity) continue;

      expect(normalize(x, size)).toBe(entity[POSITION].x);
      expect(normalize(y, size)).toBe(entity[POSITION].y);
      expect(within(x, hero[POSITION].x, renderedColumns / 2)).toBe(true);
      expect(within(y, hero[POSITION].y, renderedRows / 2)).toBe(true);
    }
  });

  it.each(["hero", "room"])(
    "renders only the destination when /tp moves the %s viewpoint",
    async (view) => {
      const world = createAreaWorld(area, { size: 128 });
      const hero = assertHero(world);
      const room = view === "room" && entities.createViewpoint(world, {
        POSITION: { ...hero.POSITION },
        RENDERABLE: { generation: 0 },
        VIEWABLE: { active: true, priority: 30 },
      });
      const teleport = () => executeCommand(world, hero, { handler: "tp", args: ["60,60"] });
      if (room) teleport();
      const { renderer, advanceFrames } = await renderScene(
        world,
        <>
          <Camera />
          <Systems />
        </>
      );
      const collect = jest.spyOn(scene, "collectScene");
      try {
        await advanceFrames(2);
        const destination = { x: 60, y: 60 };
        if (room) moveEntity(world, room, destination);
        else teleport();
        collect.mockClear();
        await advanceFrames(1);

        expect(collect.mock.calls.length).toBeGreaterThan(0);
        for (const [, viewport] of collect.mock.calls) {
          expect(viewport.position).toEqual(destination);
          expect(viewport.overscan).toEqual({ x: 0, y: 0 });
        }
        expect(getEntityGroups(renderer.scene)).toContainEqual({
          entity: hero,
          ...destination,
        });
        expect(getMotion(hero)).toBeUndefined();
        expect(sampleMotion(getCameraMotion(world)!, world.metadata.renderTime))
          .toMatchObject(destination);
      } finally {
        collect.mockRestore();
        await renderer.unmount();
      }
    }
  );

  it("keeps the hero in the camera's quadrant when walking across a seam after /tp", async () => {
    const world = createWorld();
    const hero = assertHero(world);
    const { renderer, advanceFrames } = await renderScene(world, <Systems />);
    await advanceFrames(2);
    updateCameraMotion(world, true);
    executeCommand(world, hero, { handler: "tp", args: ["-1,2"] });
    updateCameraMotion(world);
    moveEntity(world, hero, { x: 0, y: 2 });
    await advanceFrames(1);

    expect(getEntityGroups(renderer.scene)).toContainEqual({
      entity: hero,
      x: 48,
      y: 2,
    });
    expect(sampleMotion(getCameraMotion(world)!, world.metadata.renderTime).x)
      .toBeLessThan(48);
    await renderer.unmount();
  });

  it("advances the world from the render loop and follows the hero", async () => {
    const world = createWorld();
    const hero = assertHero(world);
    const { renderer, advanceFrames } = await renderScene(world, <Systems />);
    await advanceFrames(2);

    holdMove(world, ["right"]);
    await advanceFrames(10);
    holdMove(world, []);

    const moved = { x: spawn.x + 1, y: spawn.y };
    expect(hero[POSITION]).toEqual(moved);
    expect(getEntityGroups(renderer.scene)).toContainEqual({
      entity: hero,
      ...moved,
    });
  });

  it("does not advance the world while paused", async () => {
    const world = createWorld();
    const { advanceFrames } = await renderScene(world, <Systems />, {
      paused: true,
    });
    const before = snapshot(world);
    const generation = world.metadata.gameEntity.RENDERABLE.generation;

    holdMove(world, ["right"]);
    await advanceFrames(30);

    expect(world.metadata.gameEntity.RENDERABLE.generation).toBe(generation);
    expect(snapshot(world)).toBe(before);
  });
});
