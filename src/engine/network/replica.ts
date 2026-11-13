import createWorld from "../ecs";
import { restoreSnapshot, WorldSnapshot } from "../snapshot";

export type StateFrame = {
  sequence: number;
  serverTime: number;
  snapshot: WorldSnapshot;
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
    world.metadata.elapsed = frame.serverTime;
    world.metadata.renderTime = frame.serverTime;
    restoreSnapshot(frame.snapshot, world);
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
    get sequence() {
      return sequence;
    },
  };
};
