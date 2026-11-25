import type { SoundPreset } from ".";
import type { World } from "../../engine/ecs";
import type { Entity } from "ecs";
import { isInside } from "../../engine/components/layer";
import { LIGHT } from "../../engine/components/light";
import { Position, POSITION } from "../../engine/components/position";
import { PLAYER } from "../../engine/components/player";
import { SOUL } from "../../engine/components/soul";
import { aspectRatio } from "../../renderers/interface/dimensions";
import { copy, signedDistance } from "../math/std";

const hearingRange = 10;

// Distance at which each cue starts getting quieter. The orb beam is an attack warning.
const nearDistances: Partial<Record<SoundPreset, number>> = {
  beam: 5,
  fire: 0.2,
  rain: 2,
  slide: 1,
};

function mixAt(
  source: Position,
  listener: Entity,
  size: number,
  near: number
) {
  const x = signedDistance(listener[POSITION].x, source.x, size) * aspectRatio;
  const y = signedDistance(listener[POSITION].y, source.y, size);
  const distance = Math.hypot(x, y);
  const beyondSight = Math.max(0, distance - (listener[LIGHT]?.visibility ?? 0));
  const effectiveDistance = (2 * distance) / 3 + beyondSight;
  const edge = Math.max(0, Math.min(1, (hearingRange - distance) / 2));
  return {
    volume: edge * (near / Math.max(near, effectiveDistance)),
    pan: Math.max(-1, Math.min(1, x / hearingRange)),
  };
}

export function getSoundSource(
  world: World,
  position: Position,
  preset: SoundPreset,
  variant?: number
) {
  const hero =
    world.getEntity([PLAYER, SOUL, POSITION]) ||
    world.getEntity([PLAYER, POSITION]);
  if (!hero) return;
  const near = nearDistances[preset] ?? 1.5;
  const mix = mixAt(position, hero, world.metadata.gameEntity.LEVEL.size, near);
  if (!mix.volume) return;
  // Bubble variant 2 is rain landing on water.
  const rainIndoors =
    preset === "rain" || (preset === "bubble" && variant === 2)
      ? isInside(world, hero)
      : undefined;
  return { world, position: copy(position), near, ...mix, rainIndoors };
}

export type SoundSource = NonNullable<ReturnType<typeof getSoundSource>>;

const voices = new Set<{
  source: SoundSource;
  gain: GainNode;
  panner: StereoPannerNode;
  volume: number;
}>();

let rainFilters = new WeakMap<World, BiquadFilterNode>();

const rainCutoff = (filter: BiquadFilterNode, indoors: boolean) =>
  indoors ? 1350 : filter.context.sampleRate / 2;

export function setRainIndoors(world: World, indoors: boolean) {
  const filter = rainFilters.get(world);
  if (filter) {
    filter.frequency.setTargetAtTime(
      rainCutoff(filter, indoors),
      filter.context.currentTime,
      0.12
    );
  }
}

function rainOutput(world: World, indoors: boolean, master: GainNode) {
  let filter = rainFilters.get(world);
  if (!filter) {
    filter = master.context.createBiquadFilter();
    filter.Q.value = -3;
    filter.frequency.value = rainCutoff(filter, indoors);
    filter.connect(master);
    rainFilters.set(world, filter);
  }
  return filter;
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
  panner.connect(
    source.rainIndoors === undefined
      ? master
      : rainOutput(source.world, source.rainIndoors, master)
  );
  const voice = { source, gain, panner, volume: stereoVolume };
  voices.add(voice);
  return () => {
    voices.delete(voice);
  };
}

function fade(param: AudioParam, target: number, now: number, end: number) {
  const current = param.value;
  param.cancelScheduledValues(now);
  param.setValueAtTime(current, now);
  param.linearRampToValueAtTime(target, end);
}

export function moveSoundListener(
  world: World,
  hero: Entity,
  animate: boolean
) {
  if (!voices.size) return;
  const size = world.metadata.gameEntity.LEVEL.size;
  const tick = animate
    ? hero.MOVABLE?.spring?.duration ??
      world.getEntityByIdAndComponents(hero.MOVABLE?.reference, ["REFERENCE"])
        ?.REFERENCE.tick ??
      0
    : 0;
  for (const { source, gain, panner, volume } of voices) {
    if (source.world !== world) continue;
    const mix = mixAt(source.position, hero, size, source.near);
    const now = gain.context.currentTime;
    const end = now + tick / 1000;
    fade(gain.gain, mix.volume * volume, now, end);
    fade(panner.pan, mix.pan, now, end);
  }
}

export function clearSoundSources() {
  voices.clear();
  rainFilters = new WeakMap();
}
