import type { World } from "../../engine/ecs";
import type { Entity } from "ecs";
import type { Position } from "../../engine/components/position";
import type { SoundPreset, SfxOptions } from ".";

export type SoundSource = {
  owner?: number;
  entity?: number;
  position?: Position;
};
export type SoundEvent = {
  preset: SoundPreset;
  options: SfxOptions<SoundPreset>;
  source?: SoundSource;
};
let sink: ((event: SoundEvent) => void) | undefined;
let source: SoundSource | undefined;

export const soundSource = (
  world: World,
  entity?: Entity,
  privateSound = false
): SoundSource => ({
  owner: privateSound
    ? entity?.PLAYER
      ? world.getEntityId(entity)
      : entity?.POPUP?.owner
    : undefined,
  entity: entity && world.getEntityId(entity),
  position: entity?.POSITION && { ...entity.POSITION },
});

export const withSoundSource = <T>(next: SoundSource, run: () => T): T => {
  const previous = source;
  source = next;
  try {
    return run();
  } finally {
    source = previous;
  }
};

export const captureSounds = <T>(
  receive: (event: SoundEvent) => void,
  run: () => T
): T => {
  const previous = sink;
  sink = receive;
  try {
    return run();
  } finally {
    sink = previous;
  }
};

export const captureSound = (
  preset: SoundPreset,
  options: SfxOptions<SoundPreset>,
  origin = source
) => {
  if (!sink) return false;
  sink({ preset, options: { ...options }, source: origin });
  return true;
};
