import { LEVEL, LevelName } from "../components/level";
import {
  releaseCameraMotion,
  moveMotion,
  updateParticleMotion,
  initializeParticleMotion,
  updateCameraMotion,
  getMotion,
} from "../motion";
import { POSITION, Position } from "../components/position";
import createWorld from "../ecs";
import { restoreSnapshot, WorldSnapshot } from "../snapshot";

export type StateFrame = {
  sequence: number;
  serverTime: number;
  snapshot: WorldSnapshot;
  realm?: LevelName;
};

/** No gameplay systems are installed in this authoritative-state view. */
export const createReplica = () => {
  const world = createWorld();
  let sequence = -1;
  let serverTime = -1;
  const receive = (frame: StateFrame) => {
    if (
      !Number.isSafeInteger(frame.sequence) ||
      frame.sequence <= sequence ||
      !Number.isFinite(frame.serverTime) ||
      frame.serverTime < serverTime ||
      frame.serverTime < 0
    )
      return false;
    const presentationTime = Math.max(
      world.metadata.renderTime,
      frame.serverTime
    );
    world.metadata.elapsed = presentationTime;
    world.metadata.renderTime = presentationTime;
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
    if (size)
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
    restoreSnapshot(frame.snapshot, world);
    for (const entity of world.getEntities([])) {
      if (!getMotion(entity)) initializeParticleMotion(world, entity);
      updateParticleMotion(world, entity);
    }
    updateCameraMotion(world, true);
    world.metadata.elapsed = frame.serverTime;
    world.metadata.initial = false;
    world.metadata.occlusionGeneration += 1;
    sequence = frame.sequence;
    serverTime = frame.serverTime;
    for (const listener of Object.values(world.metadata.listeners))
      listener(true);
    return true;
  };
  return {
    world,
    receive,
    resetOrdering() {
      sequence = -1;
      serverTime = -1;
      world.metadata.renderTime = 0;
    },
    render(delta: number) {
      if (serverTime < 0) return;
      world.metadata.renderTime = Math.min(
        serverTime + 1000,
        world.metadata.renderTime + Math.max(0, delta)
      );
    },
    get sequence() {
      return sequence;
    },
  };
};
