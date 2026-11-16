import { createPrediction } from "./prediction";
import { isWalkable } from "../systems/movement";
import { renderPresentations } from "./presentation";
import { presentations } from "../presentation";
import type { SoundEvent } from "../../game/sound/events";
import { LEVEL, LevelName } from "../components/level";
import {
  releaseCameraMotion,
  moveMotion,
  bumpEntity,
  updateParticleMotion,
  initializeParticleMotion,
  updateCameraMotion,
  getMotion,
  resetMotions,
} from "../motion";
import { normalize } from "../../game/math/std";
import { POSITION, Position } from "../components/position";
import createWorld from "../ecs";
import { restoreSnapshot, WorldSnapshot } from "../snapshot";

export type StateFrame = {
  sequence: number;
  removed?: number[];
  removedComponents?: [number, string[]][];
  serverTime: number;
  movementSequence?: number;
  cells?: number[];
  visibleCells?: number[];
  snapshot: WorldSnapshot;
  realm?: LevelName;
  sounds?: (SoundEvent & { id: number; time: number })[];
};

/** No gameplay systems are installed in this authoritative-state view. */
export const createReplica = () => {
  const world = createWorld();
  const prediction = createPrediction(world);
  let knownCells = new Set<number>();
  let sequence = -1;
  let serverTime = -1;
  let localPlayerId: number | undefined;
  const receive = (frame: StateFrame) => {
    if (
      !Number.isSafeInteger(frame.sequence) ||
      frame.sequence <= sequence ||
      !Number.isFinite(frame.serverTime) ||
      frame.serverTime < serverTime ||
      frame.serverTime < 0
    )
      return false;
    const reset =
      sequence < 0 ||
      localPlayerId !== world.metadata.localPlayerId ||
      (frame.realm !== undefined &&
        frame.realm !== world.metadata.gameEntity[LEVEL]?.name);
    const presentationTime = Math.max(
      world.metadata.renderTime,
      frame.serverTime
    );
    world.metadata.elapsed = presentationTime;
    world.metadata.renderTime = presentationTime;
    if (reset) {
      for (const states of presentations.get(world)?.values() || [])
        for (const state of Object.values(states))
          for (const id of Object.values(state.particles)) {
            const particle = world.getEntityById(id);
            if (particle) world.removeEntity(particle, false);
          }
      presentations.delete(world);
    }
    if (
      frame.realm &&
      world.metadata.gameEntity[LEVEL]?.name &&
      frame.realm !== world.metadata.gameEntity[LEVEL].name
    ) {
      for (const entity of [...world.getEntities([])])
        world.removeEntity(entity, false);
      releaseCameraMotion(world);
    }
    const size = world.metadata.gameEntity[LEVEL]?.size;
    if (size && sequence >= 0)
      for (const [id, components] of frame.snapshot.entities) {
        const entity = world.getEntityByIdAndComponents(id, [POSITION]);
        const position = components[POSITION] as Position | undefined;
        if (
          entity &&
          !prediction.owns(id) &&
          position &&
          (entity[POSITION].x !== position.x ||
            entity[POSITION].y !== position.y)
        )
          moveMotion(world, entity, position.x, position.y, size);
      }
    const bumps =
      sequence < 0
        ? []
        : frame.snapshot.entities.flatMap(([id, components]) => {
            const value = components.BUMPABLE as
              | import("../components/bumpable").Bumpable
              | undefined;
            const previous = world.getEntityById(id)?.BUMPABLE;
            return value?.orientation &&
              value.generation !== previous?.generation
              ? [[id, value] as const]
              : [];
          });
    const previousMap = world.metadata.gameEntity[LEVEL]?.map;
    const dirty = new Map<string, Position>();
    const mark = (position: Position) =>
      dirty.set(`${position.x},${position.y}`, position);
    for (const id of new Set([
      ...frame.snapshot.entities.map(([id]) => id),
      ...(frame.removed || []),
      ...(frame.removedComponents || []).map(([id]) => id),
    ])) {
      const entity = world.getEntityByIdAndComponents(id, [POSITION]);
      if (!entity) continue;
      const position = { ...entity[POSITION] };
      mark(position);
      const cell = previousMap?.[position.x]?.[position.y];
      if (cell) {
        previousMap[position.x][position.y] = { ...cell };
        delete previousMap[position.x][position.y][id];
      }
    }
    restoreSnapshot(
      frame.snapshot,
      world,
      frame.removed,
      frame.removedComponents
    );
    for (const [id, bump] of bumps) {
      const entity = world.getEntityById(id);
      if (entity) bumpEntity(world, entity, bump.orientation, bump.generation);
    }
    const level = world.metadata.gameEntity[LEVEL];
    const rebuild =
      !frame.removed ||
      level.map !== previousMap ||
      level.initialized.length !== level.size;
    if (rebuild) {
      level.map = {};
      level.initialized = Array.from({ length: level.size }, () =>
        Array<boolean>(level.size).fill(false)
      );
      level.walkable = Array.from({ length: level.size }, () =>
        Array<number>(level.size).fill(0)
      ) as typeof level.walkable;
    }
    const updated = rebuild
      ? world.getEntities([POSITION])
      : [
          ...new Set([
            ...frame.snapshot.entities.map(([id]) => id),
            ...(frame.removedComponents || []).map(([id]) => id),
          ]),
        ].flatMap((id) => {
          const entity = world.getEntityByIdAndComponents(id, [POSITION]);
          return entity ? [entity] : [];
        });
    for (const entity of updated) {
      const x = normalize(entity[POSITION].x, level.size),
        y = normalize(entity[POSITION].y, level.size);
      (level.map[x] ||= {})[y] = {
        ...level.map[x][y],
        [world.getEntityId(entity)]: entity,
      };
      mark({ x, y });
    }
    if (reset) knownCells = new Set();
    if (frame.cells) {
      for (const cell of [...knownCells, ...frame.cells])
        mark({ x: Math.floor(cell / level.size), y: cell % level.size });
      knownCells = new Set(frame.cells);
    }
    for (const { x, y } of dirty.values()) {
      level.initialized[x][y] =
        knownCells.has(x * level.size + y) ||
        Object.keys(level.map[x]?.[y] || {}).length > 0;
    }
    const collisions = new Map(dirty);
    for (const { x, y } of dirty.values())
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const point = {
            x: normalize(x + dx, level.size),
            y: normalize(y + dy, level.size),
          };
          collisions.set(`${point.x},${point.y}`, point);
        }
    for (const { x, y } of collisions.values())
      level.walkable[x][y] = isWalkable(world, { x, y }) ? 1 : 0;
    for (const entity of world.getEntities([])) {
      if (!getMotion(entity)) initializeParticleMotion(world, entity);
      updateParticleMotion(world, entity);
    }
    if (reset) world.metadata.visibleCells.clear();
    if (frame.visibleCells)
      world.metadata.visibleCells = new Set(frame.visibleCells);
    prediction.receive(frame, reset);
    updateCameraMotion(world, true);
    world.metadata.elapsed = frame.serverTime;
    world.metadata.initial = false;
    if (rebuild || dirty.size) world.metadata.occlusionGeneration += 1;
    sequence = frame.sequence;
    serverTime = frame.serverTime;
    localPlayerId = world.metadata.localPlayerId;
    for (const listener of Object.values(world.metadata.listeners))
      listener(reset);
    return true;
  };
  return {
    world,
    receive,
    prediction,
    resetOrdering() {
      prediction.clear();
      sequence = -1;
      serverTime = -1;
      world.metadata.renderTime = 0;
      resetMotions(world);
    },
    render(delta: number) {
      if (serverTime < 0) return;
      world.metadata.renderTime = Math.min(
        serverTime + 1000,
        world.metadata.renderTime + Math.max(0, delta)
      );
      renderPresentations(world);
    },
    get sequence() {
      return sequence;
    },
  };
};
