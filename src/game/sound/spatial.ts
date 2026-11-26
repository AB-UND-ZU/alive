import type { SoundPreset } from ".";
import type { World } from "../../engine/ecs";
import type { Entity } from "ecs";
import { LAYER } from "../../engine/components/layer";
import { LIGHT } from "../../engine/components/light";
import { Position, POSITION } from "../../engine/components/position";
import { PLAYER } from "../../engine/components/player";
import { SOUL } from "../../engine/components/soul";
import { aspectRatio } from "../../renderers/interface/dimensions";
import { normalize, signedDistance } from "../math/std";

const hearingRange = 10;

// Distance at which each cue starts getting quieter. The orb beam is an attack warning.
const nearDistances: Partial<Record<SoundPreset, number>> = {
  beam: 5,
  fire: 0.2,
  rain: 2,
  slide: 1,
};

function mixAt(source: Position, listener: Entity, size: number, near: number) {
  const x = signedDistance(listener[POSITION].x, source.x, size) * aspectRatio;
  const y = signedDistance(listener[POSITION].y, source.y, size);
  const distance = Math.hypot(x, y);
  const beyondSight = Math.max(
    0,
    distance - (listener[LIGHT]?.visibility ?? 0)
  );
  const effectiveDistance = (2 * distance) / 3 + beyondSight;
  const edge = Math.max(0, Math.min(1, (hearingRange - distance) / 2));
  return {
    volume: edge * (near / Math.max(near, effectiveDistance)),
    pan: Math.max(-1, Math.min(1, x / hearingRange)),
  };
}

export function getSoundSource(
  world: World,
  origin: Entity,
  preset: SoundPreset
) {
  const listener =
    world.getEntity([PLAYER, SOUL, POSITION]) ||
    world.getEntity([PLAYER, POSITION]);
  if (!listener || !origin[POSITION]) return;
  const near = nearDistances[preset] ?? 1.5;
  const mix = mixAt(
    origin[POSITION],
    listener,
    world.metadata.gameEntity.LEVEL.size,
    near
  );
  if (mix.volume)
    return {
      world,
      origin,
      position: origin[POSITION],
      listener,
      near,
      ...mix,
      weather: preset === "rain",
    };
}

export type SoundSource = NonNullable<ReturnType<typeof getSoundSource>>;
type Voice = {
  source: SoundSource;
  gain: GainNode;
  panner: StereoPannerNode;
  master: GainNode;
  output: BiquadFilterNode;
  volume: number;
};
const voices = new Map<Entity, Set<Voice>>();
let outputs = new WeakMap<World, Map<number | undefined, BiquadFilterNode>>();

const cutoff = (
  listener: Entity,
  layer: number | undefined,
  filter: BiquadFilterNode
) =>
  listener[LAYER]?.structure && listener[LAYER].structure !== layer
    ? 1350
    : filter.context.sampleRate / 2;

function outputFor(source: SoundSource, master: GainNode) {
  const { world, origin, listener } = source;
  const { x, y } = source.position;
  const { map, size } = world.metadata.gameEntity.LEVEL;
  const layer =
    source.weather || origin.MOVABLE?.flying
      ? undefined
      : LAYER in origin
      ? origin[LAYER].structure
      : Object.values<Entity>(
          map[normalize(x, size)]?.[normalize(y, size)] ?? {}
        ).find((cell) => cell.ENTERABLE)?.FRAGMENT?.structure;
  let layers = outputs.get(world);
  if (!layers) outputs.set(world, (layers = new Map()));
  let filter = layers.get(layer);
  if (!filter) {
    filter = master.context.createBiquadFilter();
    filter.Q.value = -3;
    filter.frequency.value = cutoff(listener, layer, filter);
    filter.connect(master);
    layers.set(layer, filter);
  }
  return filter;
}

export function changeSoundLayer(world: World, mover: Entity) {
  if (mover[PLAYER])
    outputs
      .get(world)
      ?.forEach((filter, layer) =>
        filter.frequency.setTargetAtTime(
          cutoff(mover, layer, filter),
          filter.context.currentTime,
          0.12
        )
      );
  voices.get(mover)?.forEach((voice) => {
    const output = outputFor(voice.source, voice.master);
    if (output === voice.output) return;
    voice.panner.disconnect(voice.output);
    voice.panner.connect(output);
    voice.output = output;
  });
}

export function trackSound(
  source: SoundSource,
  gain: GainNode,
  panner: StereoPannerNode,
  master: GainNode,
  volume: number
) {
  // A centered mono StereoPanner sends 1/√2 to each channel. Match the UI stereo level.
  const stereoVolume = volume * Math.SQRT2;
  gain.gain.value = stereoVolume * source.volume;
  panner.pan.value = source.pan;
  const output = outputFor(source, master);
  panner.connect(output);
  const playing = voices.get(source.origin) ?? new Set<Voice>();
  voices.set(source.origin, playing);
  const voice = { source, gain, panner, master, output, volume: stereoVolume };
  playing.add(voice);
  return () => {
    playing.delete(voice);
    if (!playing.size) voices.delete(source.origin);
  };
}

function fade(param: AudioParam, target: number, now: number, end: number) {
  const current = param.value;
  param.cancelScheduledValues(now);
  param.setValueAtTime(current, now);
  param.linearRampToValueAtTime(target, end);
}

export function moveSound(world: World, mover: Entity, animate: boolean) {
  const moving = voices.get(mover);
  if (!voices.size || (!moving && !mover[PLAYER])) return;
  const tick = animate
    ? mover.MOVABLE?.spring?.duration ??
      world.getEntityByIdAndComponents(mover.MOVABLE?.reference, ["REFERENCE"])
        ?.REFERENCE.tick ??
      0
    : 0;
  if (moving && !(LAYER in mover)) changeSoundLayer(world, mover);
  const groups = mover[PLAYER] ? voices.values() : [moving!];
  for (const group of groups)
    for (const { source, gain, panner, volume } of group) {
      if (source.world !== world) continue;
      const mix = mixAt(
        source.position,
        source.listener,
        world.metadata.gameEntity.LEVEL.size,
        source.near
      );
      const now = gain.context.currentTime;
      fade(gain.gain, mix.volume * volume, now, now + tick / 1000);
      fade(panner.pan, mix.pan, now, now + tick / 1000);
    }
}

export function clearSoundSources() {
  voices.clear();
  outputs = new WeakMap();
}
