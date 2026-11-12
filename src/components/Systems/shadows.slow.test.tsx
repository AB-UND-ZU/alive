import ReactThreeTestRenderer, {
  ReactThreeTest,
} from "@react-three/test-renderer";
import Systems from ".";
import { WorldProvider } from "../../bindings/hooks";
import { createCell } from "../../bindings/creation";
import { World } from "../../engine";
import { LIGHT } from "../../engine/components/light";
import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { RENDERABLE } from "../../engine/components/renderable";
import { MOVABLE } from "../../engine/components/movable";
import {
  orientationPoints,
  Orientation,
} from "../../engine/components/orientable";
import { Point } from "../../game/math/std";
import { TypedEntity } from "../../engine/entities";
import {
  disposeEntity,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import { lockDoor, openDoor } from "../../engine/systems/trigger";
import {
  assertHero,
  createAreaWorld,
  findEntityAt,
  holdMove,
  step,
} from "../../testing/harness";
import { createWorldContext, renderScene } from "../../testing/render";
import * as tracing from "../../game/math/tracing";

jest.mock("../Entity", () => ({
  __esModule: true,
  default: (props: any) =>
    require("react").createElement("group", {
      userData: { entity: props.entity, castShadow: props.castShadow },
    }),
}));

jest.mock("@react-spring/three", () => {
  const actual = jest.requireActual("@react-spring/three");
  const api = { start: jest.fn(), pause: jest.fn(), resume: jest.fn() };
  return { ...actual, useSpring: () => [{ x: 0, y: 0 }, api] };
});

const corner = `
|         |
|   ███   |
|   █     |
|   █     |
|  ♀      |
|         |
|         |
`;

const createCorner = () => {
  const world = createAreaWorld(corner, { size: 64 });
  const hero = world.assertComponents(assertHero(world), [
    LIGHT,
    MOVABLE,
    POSITION,
  ]);
  hero[LIGHT].brightness = 3.55;
  hero[LIGHT].visibility = 3.55;
  return { world, hero };
};

const mount = async (world: World) => {
  const { renderer } = await renderScene(world, <Systems key="scene" />, {
    paused: true,
  });
  const refresh = async (next = world, key = "scene", suspended = false) => {
    await renderer.update(
      <WorldProvider
        value={createWorldContext(next, { paused: true, suspended })}
      >
        <Systems key={key} />
      </WorldProvider>
    );
    await ReactThreeTestRenderer.act(async () => {
      for (const listener of Object.values(next.metadata.listeners))
        listener(true);
    });
  };
  await refresh();
  return { renderer, refresh };
};

const hasCaster = (
  scene: ReactThreeTest.Renderer["scene"],
  entity: TypedEntity
) =>
  scene
    .findAll((node) => node.instance.userData?.entity === entity)
    .some(
      (node) =>
        !!node.instance.userData.castShadow &&
        (entity[LIGHT]?.darkness || 0) > 0
    );

const wallAt = (world: World, x: number, y: number) => {
  const wall = findEntityAt(world, { x, y }, [LIGHT, POSITION, RENDERABLE]);
  if (!wall) throw new Error(`No wall at ${x},${y}`);
  return wall;
};

describe("light shadow footprints", () => {
  it.each(["up", "right", "down", "left"] as const)(
    "prepares a corner blocker before the hero steps %s",
    async (direction) => {
      const world = createAreaWorld("|♀|", { size: 64 });
      const hero = world.assertComponents(assertHero(world), [LIGHT, POSITION]);
      hero[LIGHT].brightness = 3.55;
      const origin = { x: 6, y: 6 };
      moveEntity(world, hero, origin);
      const rotations: Record<Orientation, (point: Point) => Point> = {
        left: (point) => point,
        right: (point) => ({ x: -point.x, y: point.y }),
        up: (point) => ({ x: -point.y, y: point.x }),
        down: (point) => ({ x: point.y, y: -point.x }),
      };
      const walls = [
        { x: 0, y: -1 },
        { x: 0, y: -2 },
        { x: 0, y: -3 },
        { x: 1, y: -3 },
        { x: 2, y: -3 },
      ].map((offset) => {
        const rotated = rotations[direction](offset);
        const wall = createCell(
          world,
          { x: origin.x + rotated.x, y: origin.y + rotated.y },
          "mountain",
          "hidden"
        ).cell;
        registerEntity(world, wall);
        return world.assertComponents(wall, [POSITION]);
      });
      const farWall = walls[2];
      const step = orientationPoints[direction];
      const destination = { x: origin.x + step.x, y: origin.y + step.y };
      expect(
        tracing.traceCircularVisiblity(world, origin, hero[LIGHT].brightness)
      ).not.toContainEqual(farWall[POSITION]);
      expect(
        tracing.traceCircularVisiblity(
          world,
          destination,
          hero[LIGHT].brightness
        )
      ).toContainEqual(farWall[POSITION]);
      const { renderer, refresh } = await mount(world);
      expect(hasCaster(renderer.scene, farWall)).toBe(true);
      moveEntity(world, hero, destination);
      await refresh();
      expect(hasCaster(renderer.scene, farWall)).toBe(true);
      await renderer.unmount();
    }
  );

  it("prepares nearby corner blockers and releases them beyond the light range", async () => {
    const { world, hero } = createCorner();
    const upperWall = wallAt(world, 3, 1);
    const { renderer, refresh } = await mount(world);
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);

    moveEntity(world, hero, { x: 3, y: 4 });
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);

    moveEntity(world, hero, { x: 3, y: 5 });
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(false);
    await renderer.unmount();
  });

  it("selects blockers near the actual hero before its subscription starts", async () => {
    const { world, hero } = createCorner();
    moveEntity(world, hero, { x: 3, y: 4 });
    const upperWall = wallAt(world, 3, 1);
    const distantWall = createCell(
      world,
      { x: 0, y: 0 },
      "mountain",
      "hidden"
    ).cell;
    registerEntity(world, distantWall);
    const { renderer } = await mount(world);
    expect(hasCaster(renderer.scene, distantWall)).toBe(false);
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    expect(hasCaster(renderer.scene, wallAt(world, 3, 3))).toBe(true);
    await renderer.unmount();
  });

  it("keeps nearby blockers prepared across blocked input and unrelated reference ticks", async () => {
    const { world, hero } = createCorner();
    const upperWall = wallAt(world, 3, 1);
    const { renderer, refresh } = await mount(world);
    moveEntity(world, hero, { x: 3, y: 4 });
    await refresh();
    const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
      REFERENCE,
      RENDERABLE,
    ]);
    const generation = reference[RENDERABLE].generation;
    await ReactThreeTestRenderer.act(async () => {
      holdMove(world, ["up"]);
      step(world, 35);
      holdMove(world, []);
    });
    await refresh();
    expect(hero[POSITION]).toEqual({ x: 3, y: 4 });
    expect(reference[RENDERABLE].generation).toBeGreaterThan(generation);
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    await renderer.unmount();
  });

  it("reuses cached footprints when unchanged cells are redrawn", async () => {
    const { world, hero } = createCorner();
    const upperWall = wallAt(world, 3, 1);
    const { renderer, refresh } = await mount(world);
    moveEntity(world, hero, { x: 3, y: 4 });
    await refresh();
    const trace = jest.spyOn(tracing, "traceCircularVisiblity");
    try {
      world.metadata.gameEntity[RENDERABLE].generation += 1;
      world.metadata.sequenceEntity[RENDERABLE].generation += 1;
      world.assertByIdAndComponents(hero[MOVABLE].reference, [RENDERABLE])[
        RENDERABLE
      ].generation += 1;
      await refresh();
      await refresh();
      expect(trace).not.toHaveBeenCalled();
      expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    } finally {
      trace.mockRestore();
      await renderer.unmount();
    }
  });

  it("uses the actual light radius when it changes without movement", async () => {
    const { world, hero } = createCorner();
    const upperWall = wallAt(world, 3, 1);
    const { renderer, refresh } = await mount(world);
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    hero[LIGHT].brightness = 0.6;
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(false);
    hero[LIGHT].brightness = 3.55;
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    await renderer.unmount();
  });

  it("clears casters while the light is off and restores them when it returns", async () => {
    const { world, hero } = createCorner();
    const upperWall = wallAt(world, 3, 1);
    const { renderer, refresh } = await mount(world);
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    hero[LIGHT].brightness = 0;
    await refresh();
    expect(
      renderer.scene.findAll((node) => !!node.instance.userData?.castShadow)
    ).toHaveLength(0);
    hero[LIGHT].brightness = 3.55;
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    await renderer.unmount();
  });

  it("prepares nearby blockers across the map wrap and releases distant ones", async () => {
    const { world, hero } = createCorner();
    for (const y of [1, 2, 3]) {
      const wall = createCell(world, { x: 0, y }, "mountain", "hidden").cell;
      registerEntity(world, wall);
    }
    moveEntity(world, hero, { x: 63, y: 4 });
    const upperWall = wallAt(world, 0, 1);
    const { renderer, refresh } = await mount(world);
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    moveEntity(world, hero, { x: 0, y: 4 });
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    moveEntity(world, hero, { x: 0, y: 5 });
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(false);
    await renderer.unmount();
  });

  it("refreshes occlusion when a door opens or closes while the hero stays still", async () => {
    const world = createAreaWorld(
      `
|   █   |
|       |
|  █D█  |
|       |
|   ♀   |
`,
      { size: 64, legend: { D: "wood_door" } }
    );
    const hero = world.assertComponents(assertHero(world), [
      LIGHT,
      MOVABLE,
      POSITION,
    ]);
    hero[LIGHT].brightness = 6;
    const rearWall = wallAt(world, 3, 0);
    const door = world.assertComponents(wallAt(world, 3, 2), [LOCKABLE]);
    const { renderer, refresh } = await mount(world);
    expect(hasCaster(renderer.scene, door)).toBe(true);
    expect(hasCaster(renderer.scene, rearWall)).toBe(false);
    openDoor(world, door);
    await refresh();
    expect(hasCaster(renderer.scene, rearWall)).toBe(true);
    lockDoor(world, door);
    await refresh();
    expect(hasCaster(renderer.scene, rearWall)).toBe(false);
    await renderer.unmount();
  });

  it("updates stationary light when an opaque blocker moves", async () => {
    const world = createAreaWorld(
      `
|   █   |
|       |
|  ███  |
|       |
|   ♀   |
`,
      { size: 64 }
    );
    const hero = world.assertComponents(assertHero(world), [LIGHT]);
    hero[LIGHT].brightness = 6;
    const frontWall = wallAt(world, 3, 2);
    const rearWall = wallAt(world, 3, 0);
    const { renderer, refresh } = await mount(world);
    expect(hasCaster(renderer.scene, rearWall)).toBe(false);
    moveEntity(world, frontWall, { x: 5, y: 2 });
    await refresh();
    expect(hasCaster(renderer.scene, rearWall)).toBe(true);
    moveEntity(world, frontWall, { x: 3, y: 2 });
    await refresh();
    expect(hasCaster(renderer.scene, rearWall)).toBe(false);
    await renderer.unmount();
  });

  it("removes destroyed blockers from the prepared footprint", async () => {
    const { world, hero } = createCorner();
    const upperWall = wallAt(world, 3, 1);
    const { renderer, refresh } = await mount(world);
    moveEntity(world, hero, { x: 3, y: 4 });
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    disposeEntity(world, upperWall);
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(false);
    await renderer.unmount();
  });

  it("restores nearby blockers when a suspended scene resumes", async () => {
    const { world, hero } = createCorner();
    const upperWall = wallAt(world, 3, 1);
    const { renderer, refresh } = await mount(world);
    moveEntity(world, hero, { x: 3, y: 4 });
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    await refresh(world, "scene", true);
    expect(hasCaster(renderer.scene, upperWall)).toBe(false);
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    await renderer.unmount();
  });

  it("updates the prepared footprint when the hero is replaced", async () => {
    const { world, hero } = createCorner();
    const upperWall = wallAt(world, 3, 1);
    const { renderer, refresh } = await mount(world);
    moveEntity(world, hero, { x: 3, y: 4 });
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(true);
    disposeEntity(world, hero, false);
    const replacement = createCell(world, { x: 3, y: 6 }, "player", "visible");
    for (const entity of replacement.all) {
      if (POSITION in entity) registerEntity(world, entity);
    }
    const nextHero = world.assertComponents(replacement.cell, [
      LIGHT,
      POSITION,
    ]);
    expect(nextHero).not.toBe(hero);
    nextHero[LIGHT].brightness = 3.55;
    await refresh();
    expect(hasCaster(renderer.scene, upperWall)).toBe(false);
    expect(hasCaster(renderer.scene, wallAt(world, 3, 3))).toBe(true);
    await renderer.unmount();
  });

  it("prepares the new world around its own hero", async () => {
    const { world, hero } = createCorner();
    const { renderer, refresh } = await mount(world);
    moveEntity(world, hero, { x: 3, y: 4 });
    await refresh();
    expect(hasCaster(renderer.scene, wallAt(world, 3, 1))).toBe(true);
    const next = createCorner();
    moveEntity(next.world, next.hero, { x: 3, y: 6 });
    await refresh(next.world, "next-world");
    expect(hasCaster(renderer.scene, wallAt(next.world, 3, 1))).toBe(false);
    await renderer.unmount();
  });
});
