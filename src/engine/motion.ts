import type { Entity } from "ecs";
import type { SpringConfig } from "@react-spring/three";
import type { World } from "./ecs";
import { MOVABLE } from "./components/movable";
import { PARTICLE } from "./components/particle";
import { POSITION } from "./components/position";
import { RENDERABLE } from "./components/renderable";
import { BUMPABLE } from "./components/bumpable";
import { Orientation, orientationPoints } from "./components/orientable";
import { signedDistance } from "../game/math/std";

export type Motion = {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  velocityX: number;
  velocityY: number;
  startedAt: number;
  config: SpringConfig;
  pingPong?: boolean;
};

const motions = new WeakMap<Entity, Motion>();
const particles = new WeakMap<World, Set<Entity>>();
const bumps = new WeakMap<Entity, { generation: number; motion: Motion }>();
const point = { x: 0, y: 0, velocityX: 0, velocityY: 0 };

export const createMotion = (
  x: number,
  y: number,
  time: number,
  config: SpringConfig
): Motion => ({
  x,
  y,
  fromX: x,
  fromY: y,
  velocityX: 0,
  velocityY: 0,
  startedAt: time,
  config,
});

// Closed form of react-spring's 1ms semi-implicit Euler step. Raising its
// 2x2 transition matrix to a power preserves the existing spring shape while
// skipping any number of missed frames in constant time.
const springTransform = (config: SpringConfig, elapsed: number) => {
  const mass = config.mass ?? 1;
  const damping = (config.friction ?? 26) / mass / 1000;
  const stiffness = (config.tension ?? 170) / mass / 1000000;
  const trace = 2 - damping - stiffness;
  const determinant = 1 - damping;
  const discriminant = trace * trace - 4 * determinant;
  const steps = Math.floor(elapsed);
  let alpha: number;
  let beta: number;
  if (Math.abs(discriminant) < 1e-12) {
    const root = trace / 2;
    alpha = steps === 0 ? 0 : steps * Math.pow(root, steps - 1);
    beta = (1 - steps) * Math.pow(root, steps);
  } else if (discriminant > 0) {
    const difference = Math.sqrt(discriminant);
    const first = (trace + difference) / 2;
    const second = (trace - difference) / 2;
    const firstPower = Math.pow(first, steps);
    const secondPower = Math.pow(second, steps);
    alpha = (firstPower - secondPower) / difference;
    beta = (first * secondPower - second * firstPower) / difference;
  } else {
    const radius = Math.sqrt(determinant);
    const angle = Math.acos(trace / (2 * radius));
    const sine = Math.sin(angle);
    alpha = (Math.pow(radius, steps - 1) * Math.sin(steps * angle)) / sine;
    beta = (-Math.pow(radius, steps) * Math.sin((steps - 1) * angle)) / sine;
  }
  const fraction = elapsed - steps;
  const interpolatedAlpha =
    alpha * (1 - fraction) + fraction * (alpha * trace + beta);
  const interpolatedBeta =
    beta * (1 - fraction) - fraction * alpha * determinant;
  return {
    position: interpolatedAlpha * (1 - stiffness) + interpolatedBeta,
    momentum: (interpolatedAlpha * (1 - damping)) / 1000,
    force: -interpolatedAlpha * stiffness * 1000,
    velocity: interpolatedAlpha * (1 - damping) + interpolatedBeta,
  };
};

const springAxis = (
  from: number,
  to: number,
  velocity: number,
  transform: ReturnType<typeof springTransform>,
  config: SpringConfig
) => {
  const distance = from - to;
  const displacement =
    transform.position * distance + transform.momentum * velocity;
  const speed = transform.force * distance + transform.velocity * velocity;
  const precision =
    config.precision ?? Math.min(1, Math.abs(distance) * 0.001 || 0.005);
  const resting =
    Math.abs(displacement) <= precision &&
    Math.abs(speed) <= (config.restVelocity ?? precision / 10) * 1000;
  return {
    position: resting ? to : to + displacement,
    velocity: resting ? 0 : speed,
  };
};

export const sampleMotion = (
  motion: Motion,
  time: number,
  result: { x: number; y: number; velocityX?: number; velocityY?: number } = {
    x: 0,
    y: 0,
  }
) => {
  const elapsed = Math.max(0, time - motion.startedAt);
  const { config } = motion;
  if (config.duration !== undefined) {
    const phase = config.duration <= 0 ? 1 : elapsed / config.duration;
    const progress = motion.pingPong
      ? 1 - Math.abs((phase % 2) - 1)
      : Math.min(1, phase);
    const eased = config.easing ? config.easing(progress) : progress;
    result.x = motion.fromX + (motion.x - motion.fromX) * eased;
    result.y = motion.fromY + (motion.y - motion.fromY) * eased;
    result.velocityX = result.velocityY = 0;
  } else {
    const transform = springTransform(config, elapsed);
    const horizontal = springAxis(
      motion.fromX,
      motion.x,
      motion.velocityX,
      transform,
      config
    );
    const vertical = springAxis(
      motion.fromY,
      motion.y,
      motion.velocityY,
      transform,
      config
    );
    result.x = horizontal.position;
    result.y = vertical.position;
    result.velocityX = horizontal.velocity;
    result.velocityY = vertical.velocity;
  }
  return result;
};

export const retargetMotion = (
  motion: Motion,
  x: number,
  y: number,
  time: number,
  config = motion.config
) => {
  if (
    motion.x === x &&
    motion.y === y &&
    motion.config.duration === config.duration
  )
    return;
  sampleMotion(motion, time, point);
  motion.velocityX = point.velocityX;
  motion.velocityY = point.velocityY;
  motion.pingPong = false;
  motion.fromX = point.x;
  motion.fromY = point.y;
  motion.x = x;
  motion.y = y;
  motion.startedAt = time;
  motion.config = config;
};

export const initializeParticleMotion = (world: World, entity: Entity) => {
  const particle = entity[PARTICLE];
  if (!particle?.animatedOrigin) return;
  const motion = createMotion(
    particle.animatedOrigin.x,
    particle.animatedOrigin.y,
    world.metadata.elapsed,
    { duration: particle.duration || 200 }
  );
  retargetMotion(
    motion,
    particle.offsetX,
    particle.offsetY,
    world.metadata.elapsed
  );
  motions.set(entity, motion);
  let tracked = particles.get(world);
  if (!tracked) {
    tracked = new Set();
    particles.set(world, tracked);
  }
  tracked.add(entity);
};

export const updateParticleMotion = (world: World, entity: Entity) => {
  const particle = entity[PARTICLE];
  if (!particle?.animatedOrigin) return;
  if (!motions.has(entity)) initializeParticleMotion(world, entity);
  const motion = motions.get(entity);
  if (
    particle?.animatedOrigin &&
    motion &&
    (motion.x !== particle.offsetX ||
      motion.y !== particle.offsetY ||
      motion.config.duration !== (particle.duration || 200))
  ) {
    retargetMotion(
      motion,
      particle.offsetX,
      particle.offsetY,
      world.metadata.elapsed,
      { duration: particle.duration || 200 }
    );
  }
};

export const moveMotion = (
  world: World,
  entity: Entity,
  x: number,
  y: number,
  size: number
) => {
  const config = entity[MOVABLE]?.spring || (entity[BUMPABLE] ? {} : undefined);
  if (!config) return;
  let motion = motions.get(entity);
  if (!motion) {
    motion = createMotion(
      entity[POSITION].x,
      entity[POSITION].y,
      world.metadata.elapsed,
      config
    );
    motions.set(entity, motion);
  }
  retargetMotion(
    motion,
    motion.x + signedDistance(entity[POSITION].x, x, size),
    motion.y + signedDistance(entity[POSITION].y, y, size),
    world.metadata.elapsed,
    config
  );
};

export const getMotion = (entity: Entity) => motions.get(entity);

export const bumpEntity = (
  world: World,
  entity: Entity,
  orientation: Orientation | undefined,
  generation = entity[RENDERABLE].generation
) => {
  const bump = entity[BUMPABLE];
  bump.generation = generation;
  bump.orientation = orientation;
  if (!bump?.orientation || bumps.get(entity)?.generation === bump.generation)
    return;
  const direction = orientationPoints[bump.orientation as Orientation];
  const motion = createMotion(
    direction.x * 0.225,
    direction.y * 0.225,
    world.metadata.elapsed,
    entity[MOVABLE]?.spring || {}
  );
  motion.x = motion.y = 0;
  bumps.set(entity, { generation: bump.generation, motion });
};

export const getBumpMotion = (entity: Entity) => bumps.get(entity)?.motion;

export const setParticleMotion = (
  entity: Entity,
  fromX: number,
  fromY: number,
  startedAt: number,
  duration: number,
  pingPong = false
) => {
  const particle = entity[PARTICLE];
  const motion = createMotion(fromX, fromY, startedAt, { duration });
  motion.x = particle.offsetX;
  motion.y = particle.offsetY;
  motion.pingPong = pingPong;
  motions.set(entity, motion);
};

export const cameraSpring = { mass: 1, friction: 30, tension: 100 };
const cameras = new WeakMap<World, { motion: Motion; level: string }>();

export const updateCameraMotion = (world: World, initialize = false) => {
  let camera = cameras.get(world);
  if (!camera && initialize) {
    camera = {
      motion: createMotion(0, 0, world.metadata.elapsed, cameraSpring),
      level: "",
    };
    cameras.set(world, camera);
  }
  if (!camera) return;
  let viewable: Entity | undefined;
  for (const entity of world.getEntities(["VIEWABLE", POSITION])) {
    if (
      entity.VIEWABLE.active &&
      (!viewable || entity.VIEWABLE.priority > viewable.VIEWABLE.priority)
    )
      viewable = entity;
  }
  if (!viewable) return camera.motion;
  const position = viewable[POSITION];
  const fraction = viewable.VIEWABLE.fraction;
  const x = position.x + (fraction?.x || 0);
  const y = position.y + (fraction?.y || 0);
  const level = world.metadata.gameEntity.LEVEL;
  const config = viewable.VIEWABLE.spring || cameraSpring;
  if (!camera || camera.level !== level.name) {
    camera = {
      motion: createMotion(x, y, world.metadata.elapsed, config),
      level: level.name,
    };
    cameras.set(world, camera);
  } else {
    const motion = camera.motion;
    retargetMotion(
      motion,
      motion.x + signedDistance(motion.x, x, level.size),
      motion.y + signedDistance(motion.y, y, level.size),
      world.metadata.elapsed,
      config
    );
  }
  return camera.motion;
};

export const releaseCameraMotion = (world: World) => cameras.delete(world);

export const getCameraMotion = (world: World) => cameras.get(world)?.motion;

export const updateParticleMotions = (world: World) => {
  const tracked = particles.get(world);
  if (!tracked) return;
  for (const entity of tracked) {
    if (entity[PARTICLE]?.animatedOrigin) updateParticleMotion(world, entity);
    else {
      tracked.delete(entity);
      motions.delete(entity);
    }
  }
};

export const releaseMotion = (world: World, entity: Entity) => {
  // React can still render this entity before its removal commits.
  updateParticleMotion(world, entity);
  particles.get(world)?.delete(entity);
};

export const syncMovementSpring = (world: World, entity: Entity) => {
  const motion = motions.get(entity);
  const config = entity[MOVABLE]?.spring;
  if (!motion || !config || motion.config === config) return;
  const previousDuration = motion.config.duration;
  if (previousDuration !== undefined && config.duration !== undefined) {
    const progress =
      previousDuration <= 0
        ? 1
        : Math.min(
            1,
            Math.max(
              0,
              (world.metadata.elapsed - motion.startedAt) / previousDuration
            )
          );
    motion.startedAt = world.metadata.elapsed - progress * config.duration;
  } else {
    sampleMotion(motion, world.metadata.elapsed, point);
    motion.fromX = point.x;
    motion.fromY = point.y;
    motion.velocityX = point.velocityX;
    motion.velocityY = point.velocityY;
    motion.startedAt = world.metadata.elapsed;
  }
  motion.config = config;
};
