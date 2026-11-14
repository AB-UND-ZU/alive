import { play } from "../../game/sound";
import type { SfxOptions, SoundPreset } from "../../game/sound";
import type { World } from "../ecs";
import type { StateFrame } from "./replica";
import { LEVEL } from "../components/level";
import { POSITION } from "../components/position";
import { getDistance } from "../../game/math/std";

/** Sound history is bounded and never replays across an authenticated reconnect. */
export const createSoundPlayer = (
  emit: (preset: SoundPreset, options: SfxOptions<SoundPreset>) => void = play
) => {
  let lastId: number | undefined;
  return {
    reset() {
      lastId = undefined;
    },
    receive(world: World, frame: StateFrame, paused = false) {
      const events = frame.sounds || [];
      const previous = lastId;
      for (const event of events) lastId = Math.max(lastId || 0, event.id);
      lastId = lastId || 0;
      if (previous === undefined || paused) return;
      const actorId = world.metadata.localPlayerId;
      const player = world.getEntityByIdAndComponents(actorId, [POSITION]);
      if (!player) return;
      for (const event of events) {
        const age = frame.serverTime - event.time;
        if (
          event.id <= previous ||
          age > 500 ||
          age < 0 ||
          (event.source?.owner !== undefined && event.source.owner !== actorId)
        )
          continue;
        const distance = event.source?.position
          ? getDistance(
              player[POSITION],
              event.source.position,
              world.metadata.gameEntity[LEVEL].size
            )
          : 0;
        if (distance > 16) continue;
        emit(event.preset, {
          ...event.options,
          delay: Math.max(0, (event.options.delay || 0) - age),
          proximity: event.source?.position
            ? 1 / (distance + 1)
            : event.options.proximity,
        });
      }
    },
  };
};
