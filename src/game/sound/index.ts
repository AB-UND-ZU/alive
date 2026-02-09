import { Consumable, Stackable } from "../../engine/components/item";
import { NpcType } from "../../engine/components/npc";
import { UnitStats } from "../../engine/components/stats";
import { random } from "../math/std";
import { isPlaying, ResumableSoundEffect } from "./resumable";
import { Params, sfxr, waveforms } from "jsfxr";

export const npcVariants: Partial<Record<NpcType, number>> = {
  wormBoss: 1,
  orb: 1,
  goldOrb: 1,
  prism: 2,
  goldPrism: 2,
  eye: 3,
  goldEye: 3,
  fairy: 18,
};

export const pickupOptions: Partial<
  Record<
    Stackable | Consumable | keyof UnitStats,
    { intensity: number; variant: number }
  >
> = {
  // stats
  hp: { variant: 4, intensity: 6 },
  mp: { variant: 2, intensity: 6 },
  maxHp: { variant: 4, intensity: 8 },
  maxMp: { variant: 2, intensity: 8 },

  // consume
  key: { variant: 6, intensity: 2 },
  potion: { variant: 3, intensity: 2 },

  // stackable
  ore: { variant: 1, intensity: 1 },
  stick: { variant: 1, intensity: 2 },
  leaf: { variant: 1, intensity: 3 },
  apple: { variant: 5, intensity: 1 },
  shroom: { variant: 5, intensity: 2 },
  berry: { variant: 5, intensity: 3 },
  flower: { variant: 5, intensity: 4 },
  banana: { variant: 5, intensity: 5 },
  coconut: { variant: 5, intensity: 6 },
  fruit: { variant: 7, intensity: 2 },
  herb: { variant: 7, intensity: 3 },
  seed: { variant: 7, intensity: 4 },
  gem: { variant: 10, intensity: 2 },
  crystal: { variant: 10, intensity: 3 },
  coin: { variant: 13, intensity: 4 },
};

function frnd(range: number) {
  return Math.random() * range;
}

export type SfxOptions = {
  delay?: number;
  intensity?: number;
  proximity?: number;
  variant?: number;
};

class Presets extends Params {
  move(options: SfxOptions) {
    const intensity = (options.intensity || 350) / 1000;
    const proximity = options.proximity || 1;
    const variant = options.variant || 1;
    this.sound_vol = (1 / 128) * proximity ** 1.2 * variant ** 0.2;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = intensity - 0.08;
    this.p_env_sustain = 0.1 * variant - 0.05;
    this.p_env_punch = 0.7 - 0.2 * variant;
    this.p_env_decay = intensity / 5 + 0.2;
    this.p_base_freq = 0.3 / variant + frnd(0.1);
    this.p_freq_limit = 0;
    this.p_freq_ramp = Math.pow(frnd(1) + 1, 3) * variant;
    this.p_freq_dramp = Math.pow(frnd(1) - 1, 9) * variant;
    return this;
  }

  slide(options: SfxOptions) {
    const proximity = options.proximity || 1;
    const variant = options.variant || 1;
    this.wave_type = waveforms.SQUARE;
    this.sound_vol = ((1 / 8) * proximity * (10 - Math.sqrt(variant))) / 7;
    this.p_env_attack = 0.02;
    this.p_env_sustain = 0.2;
    this.p_env_decay = 0.1 + frnd(0.1) * variant;
    this.p_env_punch = 0.5;
    this.p_base_freq = frnd(0.01) + 0.07 + 0.03 * variant;
    this.p_duty = frnd(0.05) + 0.05;
    this.p_duty_ramp = frnd(0.01) + 0.01;
    this.p_vib_strength = 0.3 + frnd(0.1);
    this.p_vib_speed = 0.1;
    this.p_lpf_freq = 0.1 + frnd(0.1);
    this.p_lpf_ramp = -0.2;
    this.p_lpf_resonance = 0.2;
    this.p_hpf_freq = frnd(0.1) + 0.4;
    this.p_hpf_ramp = frnd(0.1) - 0.4;
    return this;
  }

  hit(options: SfxOptions) {
    const intensity = Math.min(((options.intensity || 1) + 4) ** 0.7 - 2, 5);
    const proximity = options.proximity || 1;
    const variant = options.variant || 1;
    this.sound_vol = (Math.sqrt(intensity) / 48) * proximity;
    this.wave_type = waveforms.NOISE;
    this.p_base_freq = 1.5 - frnd(0.2) * intensity ** 2;
    this.p_freq_ramp = -0.5 - frnd(0.2) * (intensity / 2);
    this.p_env_attack = 0;
    this.p_env_punch = 0.975;
    this.p_env_sustain = 0.1 * intensity + frnd(0.1);
    this.p_env_decay = 0.1 + frnd(0.1);
    this.p_lpf_freq = (variant + 1) / 3;
    this.p_lpf_resonance = 0.5;
    return this;
  }

  magic(options: SfxOptions) {
    const intensity = Math.min(((options.intensity || 1) + 4) ** 0.7 - 2, 5);
    const proximity = options.proximity || 1;
    this.sound_vol = (Math.sqrt(intensity) / 32) * proximity ** 0.8;
    this.wave_type = waveforms.NOISE;
    this.p_base_freq = 0.6 + frnd(0.1);
    this.p_freq_limit = frnd(0.1);
    this.p_freq_ramp = -0.3 - frnd(0.05);
    this.p_env_attack = 0.05;
    this.p_env_sustain = 0.2 * Math.sqrt(intensity) + frnd(0.05);
    this.p_env_decay = 0.3 + frnd(0.1);
    this.p_env_punch = 0.7 + frnd(0.2);
    this.p_hpf_freq = 0.7 + frnd(0.1);
    this.p_hpf_ramp = frnd(0.1) - 0.5;

    return this;
  }

  pickup(options: SfxOptions) {
    const variant = options.variant || 5;
    const intensity = options.intensity || -5;
    this.sound_vol = 1 / 32;
    this.wave_type = waveforms.SAWTOOTH;
    this.p_base_freq = 0.4 + variant / 48 + frnd(0.01);
    this.p_env_attack = 0;
    this.p_env_sustain = 0.2 + frnd(0.05);
    this.p_env_decay = 0.3 + frnd(0.05);
    this.p_env_punch = 0.3 + frnd(0.05);
    this.p_arp_speed = 0.4 + frnd(0.05);
    this.p_arp_mod = 0.25 + intensity / 12 + frnd(0.01);
    return this;
  }

  xp(options: SfxOptions) {
    this.sound_vol = 1 / 32;
    this.wave_type = waveforms.SAWTOOTH;
    this.p_base_freq = 1.1 + frnd(0.2);
    this.p_env_attack = 0;
    this.p_env_sustain = 0.1 + frnd(0.1);
    this.p_env_decay = 0.1 + frnd(0.1);
    this.p_env_punch = 0.5 + frnd(0.1);
    return this;
  }

  die(options: SfxOptions) {
    const variant = options.variant || 1;
    const intensity = (5 + (options.intensity || 1)) ** 0.3 - 1;
    this.sound_vol = 1 / 16;
    this.wave_type = waveforms.SQUARE;
    this.p_base_freq = 0.4 / variant + frnd(0.02);
    this.p_freq_limit = this.p_base_freq - 0.2;
    this.p_freq_ramp = -0.175 / Math.sqrt(intensity) - frnd(0.01);
    this.p_env_punch = 0.8 / variant + frnd(0.1);
    this.p_env_attack = 0.2 / variant;
    this.p_env_sustain = (intensity * 0.2) / variant;
    this.p_env_decay =
      (Math.sqrt(intensity) * 0.5) / variant + frnd(0.3) / variant;
    this.p_hpf_freq = 0.2 + frnd(0.2);
    this.p_lpf_freq = 0.5 + frnd(0.2);
    this.p_vib_strength = 0.05 + frnd(0.05);
    this.p_vib_speed = 0.4 + frnd(0.1);

    return this;
  }

  bubble(options: SfxOptions) {
    const proximity = options.proximity || 1;
    const variant = options.variant || 1;
    this.wave_type = waveforms.SINE;
    this.sound_vol = (1 / 32) * proximity ** 1.2 * variant ** 2;
    this.p_env_attack = (frnd(0.2) + 0.2) / variant;
    this.p_env_sustain = 0.1 / variant;
    this.p_env_decay = 0.2 / variant;
    this.p_base_freq = 0.15 * variant ** 0.5 + frnd(0.05);
    this.p_freq_ramp = 0.25 * variant ** 0.1;
    this.p_freq_dramp = -0.16 * variant ** 0.3;
    if (random(0, 1) === 0 && variant === 1) {
      this.p_env_decay = 0.4;
      this.p_freq_ramp = 0.286;
      this.p_freq_dramp = -0.07;
      this.p_repeat_speed = frnd(0.05) + 0.15;
      this.p_arp_mod = frnd(0.3) - 0.7;
      this.p_arp_speed = frnd(0.3) + 0.4;
    }
    this.p_lpf_freq = 0.15 + frnd(0.05);
    this.p_lpf_ramp = -0.1;
    this.p_hpf_freq = 0.25;
    this.p_hpf_ramp = -1;
  }

  rain(options: SfxOptions) {
    const proximity = options.proximity || 1;
    const intensity = options.intensity || 1;
    this.sound_vol = (1 / 128) * (proximity / 2) ** 0.5;
    this.wave_type = waveforms.NOISE;
    this.p_base_freq = 0.6 + frnd(0.1);
    this.p_freq_limit = frnd(0.3);
    this.p_freq_ramp = -0.05 - frnd(0.05);
    this.p_env_attack = 0.7 + frnd(0.2);
    this.p_env_sustain = 0.6 + frnd(0.3);
    this.p_env_decay = 0.3 + frnd(0.4);
    this.p_hpf_freq = 0.8 + frnd(0.1);
    this.p_hpf_ramp = frnd(0.1) - 0.6;
    this.p_lpf_freq = intensity ** 2;
    this.p_lpf_resonance = 0.6;

    return this;
  }

  beam(options: SfxOptions) {
    const variant = options.variant || 1;
    this.sound_vol = (variant / 128) ** 0.5 / 6;
    this.wave_type = waveforms.SINE;
    this.p_env_attack = 0.6;
    this.p_env_sustain = 0.7;
    this.p_env_decay = 0.7;
    this.p_base_freq = 0.35 + frnd(0.05);
    this.p_freq_ramp = -0.2 - frnd(0.05);
    this.p_freq_dramp = -0.1;
    this.p_vib_strength = -0.15;
    this.p_vib_speed = 0.9;
    this.p_arp_mod = 0.7 + frnd(0.05);
    this.p_arp_speed = 0.5;
    this.p_repeat_speed = 0.6 / variant ** 0.8 - 0.1;
    this.p_lpf_freq = 0.333;
    this.p_lpf_ramp = 0.048;
    this.p_lpf_resonance = 0;
    this.p_hpf_freq = 0.3 + frnd(0.1);
    this.p_hpf_ramp = -0.07;

    return this;
  }

  wave(options: SfxOptions) {
    this.sound_vol = 1 / 4;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0.5;
    this.p_env_sustain = 0.2;
    this.p_env_decay = 0.9;
    this.p_base_freq = 0.05 + frnd(0.02);
    this.p_freq_ramp = 0.15 + frnd(0.1);
    this.p_freq_dramp = -0.0025;
    this.p_vib_strength = 0.1 + frnd(0.1);
    this.p_vib_speed = 0.175 + frnd(0.05);
    this.p_arp_mod = -0.15 + frnd(0.05);
    this.p_arp_speed = 0.3 + frnd(0.2);
    this.p_repeat_speed = 0.35;
    this.p_lpf_freq = 0.09;
    this.p_lpf_ramp = 0.05;
    this.p_lpf_resonance = 0.2;
    this.p_hpf_freq = 0.7;
    this.p_hpf_ramp = -0.01;

    return this;
  }

  slash(options: SfxOptions) {
    this.sound_vol = 1 / 32;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0.4;
    this.p_env_sustain = 0.2;
    this.p_env_punch = 0;
    this.p_env_decay = 0.35;
    this.p_base_freq = 0.4 + frnd(0.1);
    this.p_freq_limit = 0;
    this.p_freq_ramp = 0.07;
    this.p_freq_dramp = -0.2;
    this.p_vib_strength = -0.8;
    this.p_vib_speed = 0;
    this.p_arp_mod = -1;
    this.p_arp_speed = 1;
    this.p_lpf_freq = 0.75 + frnd(0.05);
    this.p_lpf_ramp = 0.015;
    this.p_lpf_resonance = 0.25;
    this.p_hpf_freq = 0.4 + frnd(0.1);
    this.p_hpf_ramp = -0.4 - frnd(0.1);

    return this;
  }

  talk(options: SfxOptions) {
    const variant = options.variant || 1;
    this.sound_vol = variant / 32;
    this.wave_type = waveforms.SAWTOOTH;

    this.p_env_attack = 0.2 / variant - frnd(0.2);
    this.p_env_sustain = 0.5 * variant + frnd(0.4);
    this.p_env_punch = 0.2 * variant + frnd(0.5);
    this.p_env_decay = 0.3 * variant + frnd(0.6);
    this.p_base_freq = 0.25 / variant + frnd(0.2);
    this.p_freq_limit = 0.1 / variant;
    this.p_freq_ramp = frnd(0.05) - 0.1 * variant;
    this.p_freq_dramp = 0.1 * variant + frnd(0.05);
    this.p_vib_strength = 0.4 + frnd(0.3) * variant;
    this.p_vib_speed = 0.05 + frnd(0.2) * variant;
    this.p_arp_mod = 0.5 - frnd(1) / variant;
    this.p_arp_speed = 0.05 + frnd(0.5) * variant;
    this.p_duty = 0.5 + frnd(0.5);
    this.p_duty_ramp = frnd(0.8) - 0.2;
    this.p_repeat_speed = 0.1 + frnd(0.4) / variant;
    this.p_lpf_freq = 0.25;
    this.p_lpf_ramp = -0.25;
    this.p_lpf_resonance = 0.85;
    this.p_hpf_freq = 0.75;
    this.p_hpf_ramp = -0.1;

    return this;
  }

  fire(options: SfxOptions) {
    this.wave_type = waveforms.NOISE;
    const proximity = options.proximity || 1;
    this.sound_vol = proximity * 3;

    this.p_env_attack = 0.5;
    this.p_env_sustain = 0.2;
    this.p_env_punch = 0;
    this.p_env_decay = 0.8;
    this.p_base_freq = 0.1 + frnd(0.2);
    this.p_freq_limit = 0;
    this.p_freq_ramp = -frnd(0.75);
    this.p_freq_dramp = -0.35;
    this.p_vib_strength = 0.3;
    this.p_vib_speed = 0.54;
    this.p_arp_mod = -0.45;
    this.p_arp_speed = 1;
    this.p_duty = 0.04;
    this.p_duty_ramp = 0.09;
    this.p_repeat_speed = 0;
    this.p_pha_offset = -0.13;
    this.p_pha_ramp = 0.013;
    this.p_lpf_freq = 0.075;
    this.p_lpf_ramp = -0.4;
    this.p_lpf_resonance = 0.15;
    this.p_hpf_freq = 0.5;
    this.p_hpf_ramp = -0.35;

    return this;
  }

  crackle(options: SfxOptions) {
    this.wave_type = waveforms.NOISE;
    const proximity = options.proximity || 1;
    const intensity = options.intensity || 1;
    this.sound_vol = proximity / 16 / intensity;

    this.p_env_sustain = 0.05 + frnd(0.05);
    this.p_env_punch = 0.5 + frnd(0.5);
    this.p_env_decay = 0.05 + frnd(0.05);
    this.p_base_freq = 0.4 + frnd(0.4);
    this.p_freq_limit = 0.05;
    this.p_freq_ramp = 0.1 + frnd(0.1);
    this.p_freq_dramp = -0.349;
    this.p_vib_strength = 0.85;
    this.p_vib_speed = 0.35;
    this.p_arp_mod = -0.8;
    this.p_arp_speed = 0.85;
    this.p_pha_offset = frnd(0.5) - 0.25;
    this.p_pha_ramp = 0.3 + frnd(0.3);
    this.p_lpf_freq = 0.7;
    this.p_lpf_ramp = 0.45;
    this.p_lpf_resonance = 0.4;
    this.p_hpf_freq = 0.75;
    this.p_hpf_ramp = -0.5;

    return this;
  }
}

export const play = (
  preset: keyof Presets,
  { delay, ...options }: SfxOptions = {}
) => {
  if (!isPlaying()) return;

  if (delay) {
    setTimeout(play, delay, preset, options);
    return;
  }

  let params = new Params();

  if (preset in params) {
    params = sfxr.generate(preset as keyof Params);
  } else {
    const presets = new Presets();
    if (typeof presets[preset] === "function") {
      (presets[preset] as Function)(options);
      params = presets;
    }
  }

  new ResumableSoundEffect(params).generate().getAudio().play();
};
