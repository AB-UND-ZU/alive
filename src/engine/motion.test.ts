import { ACTIONABLE } from "./components/actionable";
import { PARTICLE } from "./components/particle";
import { entities } from ".";
import { SpringValue } from "@react-spring/three";
import {
  createMotion,
  syncMovementSpring,
  updateCameraMotion,
  getCameraMotion,
  releaseCameraMotion,
  getMotion,
  retargetMotion,
  sampleMotion,
} from "./motion";
import {
  assertHero,
  createAreaWorld,
  advanceUntil,
  trigger,
} from "../testing/harness";
import { moveEntity } from "./systems/map";
import { MOVABLE } from "./components/movable";
import { POSITION } from "./components/position";

test("movement turns retain their timing even when no intermediate frames render", () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const hero = assertHero(world);
  hero[MOVABLE].spring = { duration: 200 };
  const origin = { ...hero[POSITION] };
  moveEntity(world, hero, { x: origin.x + 1, y: origin.y });
  world.update(100);
  moveEntity(world, hero, { x: origin.x + 1, y: origin.y + 1 });
  const motion = getMotion(hero)!;
  expect(sampleMotion(motion, world.metadata.elapsed)).toMatchObject({
    x: origin.x + 0.5,
    y: origin.y,
  });
  world.update(100);
  expect(sampleMotion(motion, world.metadata.elapsed)).toMatchObject({
    x: origin.x + 0.75,
    y: origin.y + 0.5,
  });
  world.update(100);
  expect(sampleMotion(motion, world.metadata.elapsed)).toMatchObject({
    x: origin.x + 1,
    y: origin.y + 1,
  });
});

test("movement crosses a world seam along the adjacent cell", () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const hero = assertHero(world);
  hero[MOVABLE].spring = undefined;
  moveEntity(world, hero, { x: 63, y: 1 });
  world.update(2000);
  hero[MOVABLE].spring = { duration: 200 };
  moveEntity(world, hero, { x: 0, y: 1 });
  expect(
    sampleMotion(getMotion(hero)!, world.metadata.elapsed + 100).x -
      getMotion(hero)!.x
  ).toBe(-0.5);
  expect(hero[POSITION].x).toBe(0);
});

test("sampling a duration animation never depends on previously rendered frames", () => {
  const motion = createMotion(-8, -8, 0, { duration: 1050 });
  retargetMotion(motion, 6, -8, 0);
  const expected = sampleMotion(motion, 700);
  for (const time of [16, 33, 200, 650, 1000, 5000, 0])
    sampleMotion(motion, time);
  expect(sampleMotion(motion, 700)).toEqual(expected);
  expect(sampleMotion(motion, 1050)).toMatchObject({ x: 6, y: -8 });
  expect(sampleMotion(motion, 10000)).toMatchObject({ x: 6, y: -8 });
});

test("instant movements and easing retain their configured behavior", () => {
  const motion = createMotion(0, 0, 0, { duration: 0 });
  retargetMotion(motion, 3, -2, 0);
  expect(sampleMotion(motion, 0)).toMatchObject({ x: 3, y: -2 });
  retargetMotion(motion, 7, 2, 100, { duration: 200, easing: (t) => t * t });
  expect(sampleMotion(motion, 200)).toMatchObject({ x: 4, y: -1 });
});

test.each([
  { mass: 1, friction: 26, tension: 170 },
  { mass: 1, friction: 30, tension: 100 },
  { mass: 0.2, friction: 50, tension: 500 },
  { mass: 0.1, friction: 50, tension: 1000 },
  { mass: 5, friction: 100, tension: 200 },
  { mass: 1, friction: 30, tension: 200 },
  { mass: 1, friction: 20, tension: 100 },
])(
  "physics motion stays within a fraction of a pixel of the existing spring: %j",
  async (config) => {
    const reference = new SpringValue(0);
    void reference.start({ to: 1, config });
    reference.pause();
    const motion = createMotion(0, 0, 0, config);
    retargetMotion(motion, 1, 0, 0);
    let maximumError = 0;
    for (let time = 1; time <= 2000; time += 1) {
      reference.advance(1);
      const result = sampleMotion(motion, time);
      maximumError = Math.max(
        maximumError,
        Math.abs(result.x - reference.get())
      );
      expect(Number.isFinite(result.x)).toBe(true);
    }
    // One pixel is 1/16 of a cell. The old spring integrates in 1ms steps.
    expect(maximumError).toBeLessThan(0.002);
    reference.stop();
  }
);

test("a physics retarget preserves momentum and is independent of sampling cadence", () => {
  const motion = createMotion(0, 0, 0, {});
  retargetMotion(motion, 1, 0, 0);
  const before = sampleMotion(motion, 100);
  sampleMotion(motion, 116);
  retargetMotion(motion, 2, 0, 100);
  expect(sampleMotion(motion, 100).x).toBeCloseTo(before.x, 10);
  expect(motion.velocityX).toBeGreaterThan(0);
  const at250 = sampleMotion(motion, 250);
  sampleMotion(motion, 9000);
  expect(sampleMotion(motion, 250)).toEqual(at250);
});

test("disposed animated particles leave no live motion behind", () => {
  const world = createAreaWorld("| ♀ |");
  const particle = entities.createParticle(world, {
    PARTICLE: {
      offsetX: 1,
      offsetY: 0,
      offsetZ: 0,
      animatedOrigin: { x: 0, y: 0 },
    },
    RENDERABLE: { generation: 0 },
    SPRITE: { name: "particle", layers: [] },
  });
  expect(getMotion(particle)).toBeDefined();
  world.removeEntity(particle);
  world.update(100);
  expect(getMotion(particle)).toBeUndefined();
});

test("the camera records viewpoint changes before React renders them", () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  for (const viewable of world.getEntities(["VIEWABLE"]))
    viewable.VIEWABLE.active = false;
  const first = entities.createViewpoint(world, {
    POSITION: { x: 2, y: 3 },
    RENDERABLE: { generation: 0 },
    VIEWABLE: { active: true, priority: 10, spring: { duration: 200 } },
  });
  updateCameraMotion(world, true);
  expect(
    sampleMotion(getCameraMotion(world)!, world.metadata.elapsed)
  ).toMatchObject(first.POSITION);
  entities.createViewpoint(world, {
    POSITION: { x: 6, y: 5 },
    RENDERABLE: { generation: 0 },
    VIEWABLE: { active: true, priority: 90, spring: { duration: 200 } },
  });
  world.update(0);
  world.update(100);
  expect(
    sampleMotion(getCameraMotion(world)!, world.metadata.elapsed)
  ).toMatchObject({ x: 4, y: 4 });
  releaseCameraMotion(world);
  expect(getCameraMotion(world)).toBeUndefined();
});

test("a camera mounted during loading snaps to the first available viewpoint", () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  for (const entity of world.getEntities(["VIEWABLE"]))
    entity.VIEWABLE.active = false;
  updateCameraMotion(world, true);
  entities.createViewpoint(world, {
    POSITION: { x: 10, y: 12 },
    RENDERABLE: { generation: 0 },
    VIEWABLE: { active: true, priority: 90 },
  });
  world.update(0);
  expect(
    sampleMotion(getCameraMotion(world)!, world.metadata.elapsed)
  ).toMatchObject({ x: 10, y: 12 });
  releaseCameraMotion(world);
});

test("popup borders keep their opening animation when origins are added after creation", () => {
  const world = createAreaWorld("|       |\n|  ♀A   |\n|       |", {
    size: 48,
    legend: { A: "anvil" },
  });
  const hero = assertHero(world);
  advanceUntil(world, () => hero[ACTIONABLE]?.popup !== undefined, 1000);
  trigger(world, "interact");
  const animated = () =>
    world
      .getEntities([PARTICLE])
      .filter((entity) => !!entity[PARTICLE].animatedOrigin);
  advanceUntil(world, () => animated().length > 10, 1000);
  for (const entity of animated()) {
    const motion = getMotion(entity);
    expect(motion).toBeDefined();
    const sampled = sampleMotion(motion!, world.metadata.elapsed);
    expect(Number.isFinite(sampled.x) && Number.isFinite(sampled.y)).toBe(true);
  }
  expect(
    animated().some((entity) => {
      const sampled = sampleMotion(getMotion(entity)!, world.metadata.elapsed);
      return (
        sampled.x !== entity[PARTICLE].offsetX ||
        sampled.y !== entity[PARTICLE].offsetY
      );
    })
  ).toBe(true);
});

test("changing movement duration mid-flight preserves its progress without a new movement", () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const hero = assertHero(world);
  hero[MOVABLE].spring = { duration: 200 };
  const x = hero[POSITION].x;
  moveEntity(world, hero, { x: x + 1, y: hero[POSITION].y });
  world.update(100);
  hero[MOVABLE].spring = { duration: 400 };
  syncMovementSpring(world, hero);
  expect(sampleMotion(getMotion(hero)!, world.metadata.elapsed).x).toBeCloseTo(
    x + 0.5
  );
  world.update(100);
  expect(sampleMotion(getMotion(hero)!, world.metadata.elapsed).x).toBeCloseTo(
    x + 0.75
  );
});
