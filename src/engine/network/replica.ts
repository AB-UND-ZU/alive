import { isWalkable } from "../systems/movement";
import { renderPresentations } from "./presentation";
import { presentations } from "../presentation";
import type { SoundEvent } from "../../game/sound/events";
import { LEVEL, LevelName } from "../components/level";
import {
  releaseCameraMotion,
  moveMotion,
  updateParticleMotion,
  initializeParticleMotion,
  updateCameraMotion,
  getMotion,
  captureMotions,
  restoreMotions,
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
  snapshot: WorldSnapshot;
  realm?: LevelName;
  motions?: ReturnType<typeof captureMotions>;
  sounds?: (SoundEvent & { id: number; time: number })[];
};

/** No gameplay systems are installed in this authoritative-state view. */
export const createReplica = () => {
  const world = createWorld();
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
      for (const entity of world.getEntities([]))
        world.removeEntity(entity, false);
      releaseCameraMotion(world);
    }
    const size = world.metadata.gameEntity[LEVEL]?.size;
    if (size && !frame.motions && sequence >= 0)
      for (const [id, components] of frame.snapshot.entities) {
        const entity = world.getEntityByIdAndComponents(id, [POSITION]);
        const position = components[POSITION] as Position | undefined;
        if (
          entity &&
          position &&
          (entity[POSITION].x !== position.x ||
            entity[POSITION].y !== position.y)
        )
          moveMotion(world, entity, position.x, position.y, size);
      }
    restoreSnapshot(
      frame.snapshot,
      world,
      frame.removed,
      frame.removedComponents
    );
    const level = world.metadata.gameEntity[LEVEL];
    level.map = {};
    for (const entity of world.getEntities([POSITION])) {
      const x = normalize(entity[POSITION].x, level.size),
        y = normalize(entity[POSITION].y, level.size);
      ((level.map[x] ||= {})[y] ||= {})[world.getEntityId(entity)] = entity;
    }
    level.initialized = Array.from({ length: level.size }, () =>
      Array<boolean>(level.size).fill(false)
    );
    level.walkable = Array.from({ length: level.size }, () =>
      Array<number>(level.size).fill(1)
    ) as typeof level.walkable;
    for (const [x, column] of Object.entries(level.map))
      for (const y of Object.keys(column)) {
        level.initialized[Number(x)][Number(y)] = true;
        level.walkable[Number(x)][Number(y)] = isWalkable(world, {
          x: Number(x),
          y: Number(y),
        })
          ? 1
          : 0;
      }
    for (const entity of world.getEntities([])) {
      if (!getMotion(entity)) initializeParticleMotion(world, entity);
      updateParticleMotion(world, entity);
    }
    if (frame.motions) restoreMotions(world, frame.motions);
    updateCameraMotion(world, true);
    world.metadata.elapsed = frame.serverTime;
    world.metadata.initial = false;
    world.metadata.occlusionGeneration += 1;
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
    resetOrdering() {
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
