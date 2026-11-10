import { Consumable, Stackable } from "../../engine/components/item";
import { NpcType } from "../../engine/components/npc";
import { UnitStats } from "../../engine/components/stats";
import {
  createSoundBuffer,
  getAudioTime,
  isPlaying,
  SoundBuffer,
} from "./resumable";
import { Params, waveforms } from "jsfxr";
import { createRng } from "../math/rng";
import { random } from "../math/std";
import { synthesizeSound } from "./synthesis";
import { prewarmSounds } from "./prewarm";

export const npcVariants: Partial<Record<NpcType, SoundVariant<"slide">>> = {
  golem: 1,
  wormBoss: 1,
  orb: 1,
  goldOrb: 1,
  prism: 2,
  goldPrism: 2,
  eye: 3,
  goldEye: 3,
  fairy: 18,
  chick: 18,
};

export const pickupOptions: Partial<
  Record<
    Stackable | Consumable | keyof UnitStats,
    { intensity: number; variant: SoundVariant<"pickup"> }
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
  sapling: { variant: 7, intensity: 4 },
  crystal: { variant: 10, intensity: 2 },
  mineral: { variant: 10, intensity: 3 },
  coin: { variant: 13, intensity: 4 },
};

// a few seeds give each sound its random character while keeping them
// few enough to be synthesized ahead of their first use
const seeds = [0, 1, 2, 3] as const;
type Seed = (typeof seeds)[number];

let rng = createRng(0);
const frnd = (range: number) => rng() * range;

type SoundOptions = {
  delay?: number;
  intensity?: number;
  proximity?: number;
  variant?: number;
  seed?: number;
  notes?: number;
  spacing?: number;
  pattern?: boolean[];
};

export type SfxOptions<P extends SoundPreset> = SoundOptions & {
  variant?: SoundVariant<P>;
  seed?: Seed;
};

class Presets extends Params {
  move(options: SoundOptions) {
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

  slide(options: SoundOptions) {
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

  hit(options: SoundOptions) {
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

  magic(options: SoundOptions) {
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

  pickup(options: SoundOptions) {
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

  xp(options: SoundOptions) {
    this.sound_vol = 1 / 32;
    this.wave_type = waveforms.SAWTOOTH;
    this.p_base_freq = 1.1 + frnd(0.2);
    this.p_env_attack = 0;
    this.p_env_sustain = 0.1 + frnd(0.1);
    this.p_env_decay = 0.1 + frnd(0.1);
    this.p_env_punch = 0.5 + frnd(0.1);
    return this;
  }

  die(options: SoundOptions) {
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

  bubble(options: SoundOptions) {
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
    if (frnd(1) < 0.5 && variant === 1) {
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

  sail(options: SoundOptions) {
    const proximity = options.proximity || 1;
    this.wave_type = waveforms.NOISE;
    this.sound_vol = (1 / 56) * proximity ** 1.2;
    this.p_env_attack = 0.5;
    this.p_env_sustain = 0.15;
    this.p_env_decay = 0.6 + frnd(0.02);
    this.p_base_freq = 0.6 + frnd(0.02);
    this.p_lpf_freq = 0.21 + frnd(0.01);
    this.p_hpf_freq = 0.025;
    return this;
  }

  rain(options: SoundOptions) {
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

  beam(options: SoundOptions) {
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

  wave(options: SoundOptions) {
    const intensity = options.intensity || 1;
    this.sound_vol = 1 / 4;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0.5;
    this.p_env_sustain = 0.2;
    this.p_env_decay = 0.9 * intensity;
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

  slash(options: SoundOptions) {
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

  talk(options: SoundOptions) {
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

  fire(options: SoundOptions) {
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

  crackle(options: SoundOptions) {
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

  // abilities
  danger(options: SoundOptions) {
    const variant = options.variant || 1;
    const intensity = options.intensity || 1;
    const proximity = options.proximity || 1;
    // one harsh alert beep, pitch and tone per mob type, longer for bosses
    this.sound_vol = (1 / 12) * proximity;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = intensity === 2 ? 0.3 : 0.12;
    this.p_env_punch = 0.5;
    this.p_env_decay = intensity === 2 ? 0.25 : 0.1;
    this.p_base_freq = 0.42 + 0.01 * ((variant - 1) % 24) + frnd(0.002);
    this.p_vib_strength = intensity === 2 ? 0.4 : 0.3;
    this.p_vib_speed = intensity === 2 ? 0.7 : 0.9;
    this.p_duty = [0.3, 0.6, 0][Math.floor((variant - 1) / 24) % 3];
    this.p_lpf_freq = 0.6;

    return this;
  }

  arrow(options: SoundOptions) {
    const variant = options.variant || 1;
    const proximity = options.proximity || 1;
    this.p_env_attack = 0;

    if (variant === 1) {
      // bow string twang
      this.sound_vol = (1 / 28) * proximity;
      this.wave_type = waveforms.SQUARE;
      this.p_env_sustain = 0.04;
      this.p_env_punch = 0.5;
      this.p_env_decay = 0.28 + frnd(0.01);
      this.p_base_freq = 0.3 + frnd(0.005);
      this.p_freq_ramp = -0.3;
      this.p_duty = 0.3;
      this.p_vib_strength = 0.2;
      this.p_vib_speed = 0.7;
      this.p_lpf_freq = 0.45;
    } else if (variant === 2) {
      // bounce off
      this.sound_vol = (1 / 24) * proximity;
      this.wave_type = waveforms.NOISE;
      this.p_env_sustain = 0.02;
      this.p_env_punch = 1;
      this.p_env_decay = 0.12 + frnd(0.005);
      this.p_base_freq = 0.8;
      this.p_lpf_freq = 0.3 + frnd(0.01);
      this.p_lpf_resonance = 0.7;
      this.p_hpf_freq = 0.2;
    } else if (variant === 3) {
      // hit like a spell but with a sharp attack
      this.sound_vol = (1 / 15) * proximity;
      this.wave_type = waveforms.NOISE;
      this.p_env_sustain = 0.1;
      this.p_env_punch = 1;
      this.p_env_decay = 0.28 + frnd(0.02);
      this.p_base_freq = 0.6 + frnd(0.05);
      this.p_freq_ramp = -0.3;
      this.p_hpf_freq = 0.6;
      this.p_hpf_ramp = -0.4;
    } else {
      // dropping on the floor
      this.sound_vol = (1 / 20) * proximity;
      this.wave_type = waveforms.NOISE;
      this.p_env_sustain = 0.02;
      this.p_env_punch = 1;
      this.p_env_decay = 0.16 + frnd(0.01);
      this.p_base_freq = 0.5;
      this.p_lpf_freq = 0.22 + frnd(0.01);
      this.p_lpf_resonance = 0.6;
      this.p_hpf_freq = 0.05;
    }

    return this;
  }

  spear(options: SoundOptions) {
    const proximity = options.proximity || 1;
    this.sound_vol = (1 / 40) * proximity;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0.08;
    this.p_env_sustain = 0.1;
    this.p_env_decay = 0.2 + frnd(0.01);
    this.p_base_freq = 0.5 + frnd(0.02);
    this.p_freq_ramp = 0.25;
    this.p_lpf_freq = 0.5;
    this.p_hpf_freq = 0.3;

    return this;
  }

  disc(options: SoundOptions) {
    const proximity = options.proximity || 1;
    this.sound_vol = (1 / 96) * proximity;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0.1;
    this.p_env_sustain = 0.2;
    this.p_env_decay = 0.25;
    // detuned so batches of discs beat against each other
    this.p_base_freq = 0.3 + frnd(0.03);
    this.p_vib_strength = 0.1;
    this.p_vib_speed = 0.4;
    this.p_lpf_freq = 0.2;

    return this;
  }

  bolt(options: SoundOptions) {
    const proximity = options.proximity || 1;
    this.sound_vol = (1 / 40) * proximity;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.05;
    this.p_env_decay = 0.16 + frnd(0.01);
    this.p_base_freq = 0.7 + frnd(0.01);
    this.p_freq_ramp = -0.4;
    this.p_duty = 0.4;
    this.p_lpf_freq = 0.45;

    return this;
  }

  blast(options: SoundOptions) {
    const proximity = options.proximity || 1;
    this.sound_vol = (1 / 24) * proximity;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0.2;
    this.p_env_sustain = 0.2;
    this.p_env_decay = 0.3 + frnd(0.02);
    this.p_base_freq = 0.1 + frnd(0.01);
    this.p_freq_ramp = 0.15;
    this.p_lpf_freq = 0.3;
    this.p_lpf_resonance = 0.3;

    return this;
  }

  trap(options: SoundOptions) {
    const variant = options.variant || 1;
    const intensity = options.intensity || 1;
    const proximity = options.proximity || 1;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0;
    this.p_env_punch = 1;

    if (intensity === 1) {
      // set mechanism, small crackles slowly fading
      this.sound_vol = (1 / 72) * proximity * 0.8 ** (variant - 1);
      this.p_env_sustain = 0.01;
      this.p_env_decay = 0.04 + frnd(0.02);
      this.p_base_freq = 0.7 + frnd(0.2);
      this.p_lpf_freq = 0.5;
      this.p_lpf_resonance = 0.4;
      this.p_hpf_freq = 0.4;
    } else if (variant === 1) {
      // steel jaws clank shut
      this.sound_vol = (1 / 32) * proximity;
      this.p_env_sustain = 0.03;
      this.p_env_decay = 0.32 + frnd(0.01);
      this.p_base_freq = 0.9;
      this.p_freq_ramp = -0.05;
      this.p_lpf_freq = 0.3 + frnd(0.005);
      this.p_lpf_resonance = 0.9;
      this.p_hpf_freq = 0.15;
    } else {
      // crunch of the bite
      this.sound_vol = (1 / 16) * proximity;
      this.p_env_sustain = 0.04;
      this.p_env_decay = 0.2 + frnd(0.01);
      this.p_base_freq = 0.25;
      this.p_freq_ramp = -0.1;
      this.p_lpf_freq = 0.2;
      this.p_lpf_resonance = 0.5;
    }

    return this;
  }

  dash(options: SoundOptions) {
    const variant = options.variant || 1;
    const intensity = options.intensity || 500;
    const proximity = options.proximity || 1;

    if (variant === 1) {
      // rising charge while dash arrows show
      this.sound_vol = (1 / 56) * proximity;
      this.wave_type = waveforms.SQUARE;
      this.p_env_attack = 0.05;
      this.p_env_sustain = Math.sqrt((intensity * 44.1) / 100000);
      this.p_env_decay = 0.05;
      this.p_base_freq = 0.3 + frnd(0.005);
      this.p_freq_ramp = 0.1;
      this.p_vib_strength = 0.3;
      this.p_vib_speed = 0.6;
      this.p_duty = 0.7;
      this.p_lpf_freq = 0.35;
    } else {
      // whoosh on teleport
      this.sound_vol = (1 / 32) * proximity;
      this.wave_type = waveforms.NOISE;
      this.p_env_attack = 0.12;
      this.p_env_sustain = 0.05;
      this.p_env_decay = 0.25 + frnd(0.01);
      this.p_base_freq = 0.3 + frnd(0.02);
      this.p_lpf_freq = 0.3;
      this.p_lpf_ramp = 0.1;
      this.p_hpf_freq = 0.2;
    }

    return this;
  }

  zap(options: SoundOptions) {
    const variant = options.variant || 1;
    const proximity = options.proximity || 1;
    this.p_env_attack = 0;

    if (variant === 1) {
      // charge up
      this.sound_vol = (1 / 64) * proximity;
      this.wave_type = waveforms.SQUARE;
      this.p_env_sustain = 0.2;
      this.p_env_decay = 0.15;
      this.p_base_freq = 0.6 + frnd(0.005);
      this.p_freq_ramp = 0.2;
      this.p_vib_strength = 0.6;
      this.p_vib_speed = 0.9;
      this.p_repeat_speed = 0.7;
      this.p_duty = 0.7;
      this.p_lpf_freq = 0.55;
      this.p_hpf_freq = 0.3;
    } else if (variant === 2) {
      // lightning crack
      this.sound_vol = (1 / 24) * proximity;
      this.wave_type = waveforms.NOISE;
      this.p_env_sustain = 0.05;
      this.p_env_punch = 1;
      this.p_env_decay = 0.15 + frnd(0.01);
      this.p_base_freq = 0.9;
      this.p_freq_ramp = -0.2;
      this.p_vib_strength = 0.5;
      this.p_vib_speed = 0.9;
      this.p_hpf_freq = 0.2;
    } else {
      // faint buzz while charged
      this.sound_vol = (1 / 110) * proximity;
      this.wave_type = waveforms.SQUARE;
      this.p_env_sustain = 0.06;
      this.p_env_decay = 0.1 + frnd(0.005);
      this.p_base_freq = 0.3 + frnd(0.005);
      this.p_freq_ramp = 0.15;
      this.p_vib_strength = 0.5;
      this.p_vib_speed = 0.95;
      this.p_repeat_speed = 0.75;
      this.p_duty = 0.8;
      this.p_lpf_freq = 0.5;
      this.p_hpf_freq = 0.2;
    }

    return this;
  }

  spark(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = 1 / 40;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.01;
    this.p_env_punch = 1;
    this.p_env_decay = 0.06 + frnd(0.01);
    this.p_base_freq = 0.9 + frnd(0.1);
    this.p_freq_ramp = -0.3;
    this.p_vib_strength = 0.6;
    this.p_vib_speed = 0.9;
    this.p_hpf_freq = 0.45 + 0.02 * (variant % 4);

    return this;
  }

  block(options: SoundOptions) {
    const variant = options.variant || 1;
    const proximity = options.proximity || 1;

    if (variant === 1) {
      // shield up
      this.sound_vol = (1 / 32) * proximity;
      this.wave_type = waveforms.SINE;
      this.p_env_attack = 0.1;
      this.p_env_sustain = 0.1;
      this.p_env_decay = 0.2;
      this.p_base_freq = 0.3 + frnd(0.002);
      this.p_freq_ramp = 0.15;
    } else if (variant === 2) {
      // hit bouncing off the bubble
      this.sound_vol = (1 / 28) * proximity;
      this.wave_type = waveforms.SINE;
      this.p_env_attack = 0;
      this.p_env_sustain = 0.12;
      this.p_env_punch = 0.4;
      this.p_env_decay = 0.3 + frnd(0.01);
      this.p_base_freq = 0.26 + frnd(0.002);
      this.p_freq_ramp = 0.3;
      this.p_freq_dramp = -0.1;
      this.p_vib_strength = 0.15;
      this.p_vib_speed = 0.3;
    } else if (variant === 3) {
      // shield breaks
      this.sound_vol = (1 / 28) * proximity;
      this.wave_type = waveforms.NOISE;
      this.p_env_attack = 0;
      this.p_env_sustain = 0.04;
      this.p_env_punch = 1;
      this.p_env_decay = 0.25 + frnd(0.01);
      this.p_base_freq = 0.7;
      this.p_freq_ramp = -0.1;
      this.p_lpf_freq = 0.5;
      this.p_hpf_freq = 0.2;
    } else {
      // faint hum while shielded
      this.sound_vol = (1 / 128) * proximity;
      this.wave_type = waveforms.SINE;
      this.p_env_attack = 0.05;
      this.p_env_sustain = 0.06;
      this.p_env_decay = 0.12;
      this.p_base_freq = 0.33 + frnd(0.002);
      this.p_vib_strength = 0.1;
      this.p_vib_speed = 0.4;
    }

    return this;
  }

  totem(options: SoundOptions) {
    const variant = options.variant || 1;
    const proximity = options.proximity || 1;
    this.wave_type = waveforms.SINE;

    if (variant === 1) {
      // warm rise from C4 to E4 on summon
      this.sound_vol = (1 / 36) * proximity;
      this.p_env_attack = 0.06;
      this.p_env_sustain = 0.12;
      this.p_env_punch = 0.2;
      this.p_env_decay = 0.5 + frnd(0.01);
      this.p_base_freq = 0.2705;
      this.p_arp_mod = 0.479;
      this.p_arp_speed = 0.6;
      this.p_vib_strength = 0.04;
      this.p_vib_speed = 0.3;
    } else {
      // soft swell with each aura pulse
      this.sound_vol = (1 / 80) * proximity;
      this.p_env_attack = 0.32;
      this.p_env_sustain = 0.05;
      this.p_env_decay = 0.3;
      this.p_base_freq = 0.304 + frnd(0.002);
      this.p_vib_strength = 0.05;
      this.p_vib_speed = 0.3;
    }

    return this;
  }

  // tools
  tool(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = variant === 1 ? 1 / 56 : 1 / 64;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.01;
    this.p_env_punch = 1;
    this.p_env_decay = 0.08 + frnd(0.005);
    this.p_base_freq = 0.9;
    this.p_lpf_freq = (variant === 1 ? 0.4 : 0.3) + frnd(0.01);
    this.p_lpf_resonance = 0.7;
    this.p_hpf_freq = 0.3;

    return this;
  }

  harvest(options: SoundOptions) {
    const variant = options.variant || 1;
    const proximity = options.proximity || 1;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0;
    this.p_env_punch = 1;

    if (variant === 1) {
      // axe into wood
      this.sound_vol = (1 / 18) * proximity;
      this.p_env_sustain = 0.01;
      this.p_env_decay = 0.12 + frnd(0.01);
      this.p_base_freq = 0.25 + frnd(0.02);
      this.p_lpf_freq = 0.1 + frnd(0.005);
      this.p_lpf_resonance = 0.55;
      this.p_hpf_freq = 0.02;
    } else if (variant === 2) {
      // pickaxe on stone
      this.sound_vol = (1 / 24) * proximity;
      this.p_env_attack = 0.04;
      this.p_env_sustain = 0.04;
      this.p_env_punch = 0.4;
      this.p_env_decay = 0.2 + frnd(0.01);
      this.p_base_freq = 0.12 + frnd(0.02);
      this.p_freq_ramp = -0.05;
      this.p_vib_strength = 0.3;
      this.p_vib_speed = 0.7;
      this.p_lpf_freq = 0.25;
      this.p_lpf_resonance = 0.15;
      this.p_hpf_freq = 0.03;
    } else if (variant === 3) {
      // hammer on construction
      this.sound_vol = (1 / 36) * proximity;
      this.p_env_sustain = 0.02;
      this.p_env_decay = 0.1 + frnd(0.01);
      this.p_base_freq = 0.6;
      this.p_lpf_freq = 0.25 + frnd(0.01);
      this.p_lpf_resonance = 0.65;
      this.p_hpf_freq = 0.1;
    } else {
      // felled or broken, a soft round blop
      this.sound_vol = (1 / 32) * proximity;
      this.wave_type = waveforms.SINE;
      this.p_env_sustain = 0.05;
      this.p_env_punch = 0.5;
      this.p_env_decay = 0.14 + frnd(0.01);
      this.p_base_freq = 0.3 + frnd(0.005);
      this.p_freq_ramp = 0.25;
    }

    return this;
  }

  dig(options: SoundOptions) {
    this.sound_vol = 1 / 28;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0.03;
    this.p_env_sustain = 0.05;
    this.p_env_decay = 0.18 + frnd(0.01);
    this.p_base_freq = 0.15 + frnd(0.01);
    this.p_freq_ramp = 0.05;
    this.p_lpf_freq = 0.3;
    this.p_hpf_freq = 0.08;

    return this;
  }

  fish(options: SoundOptions) {
    const variant = options.variant || 1;
    this.p_env_attack = 0;

    if (variant === 1) {
      // toss line
      this.sound_vol = 1 / 48;
      this.wave_type = waveforms.NOISE;
      this.p_env_attack = 0.03;
      this.p_env_sustain = 0.1;
      this.p_env_decay = 0.2 + frnd(0.01);
      this.p_base_freq = 0.5;
      this.p_freq_ramp = 0.2;
      this.p_lpf_freq = 0.5;
      this.p_hpf_freq = 0.3;
    } else if (variant === 2) {
      // bait plops into water
      this.sound_vol = 1 / 28;
      this.wave_type = waveforms.SINE;
      this.p_env_sustain = 0.06;
      this.p_env_decay = 0.15 + frnd(0.01);
      this.p_base_freq = 0.35 + frnd(0.005);
      this.p_freq_ramp = -0.35;
    } else if (variant === 3 || variant === 4) {
      // bite, then tug before escaping
      this.sound_vol = 1 / 40;
      this.wave_type = waveforms.SINE;
      this.p_env_sustain = 0.04;
      this.p_env_punch = 0.5;
      this.p_env_decay = 0.12 + frnd(0.005);
      this.p_base_freq = (variant === 3 ? 0.5 : 0.42) + frnd(0.002);
    } else {
      // catch splash
      this.sound_vol = 1 / 32;
      this.wave_type = waveforms.NOISE;
      this.p_env_sustain = 0.05;
      this.p_env_punch = 0.6;
      this.p_env_decay = 0.25 + frnd(0.01);
      this.p_base_freq = 0.6;
      this.p_freq_ramp = -0.15;
      this.p_lpf_freq = 0.6;
      this.p_hpf_freq = 0.2;
    }

    return this;
  }

  escape(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = (1 / 36) * 0.6 ** (variant - 1);
    this.wave_type = waveforms.SINE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.05;
    this.p_env_decay = 0.15 + frnd(0.01);
    this.p_base_freq = 0.3 - 0.01 * variant + frnd(0.002);
    this.p_freq_ramp = -0.3;

    return this;
  }

  build(options: SoundOptions) {
    const variant = options.variant || 1;
    const intensity = options.intensity || 1;
    this.p_env_attack = 0;

    if (intensity === 2) {
      // construction complete, rising like equip
      this.sound_vol = 1 / 48;
      this.wave_type = waveforms.SQUARE;
      this.p_env_sustain = 0.06;
      this.p_env_punch = 0.4;
      this.p_env_decay = variant === 3 ? 0.26 : 0.12;
      // A4, E5, A5
      this.p_base_freq = [0.3485, 0.4285, 0.5015][variant - 1] + frnd(0.002);
      this.p_duty = 0.25;
      this.p_lpf_freq = 0.5;
      this.p_hpf_freq = 0.1;
    } else if (variant === 1) {
      // plot placed: low wooden thud
      this.sound_vol = 1 / 24;
      this.wave_type = waveforms.NOISE;
      this.p_env_sustain = 0.02;
      this.p_env_punch = 1;
      this.p_env_decay = 0.16 + frnd(0.01);
      this.p_base_freq = 0.4;
      this.p_lpf_freq = 0.14;
      this.p_lpf_resonance = 0.6;
      this.p_hpf_freq = 0.03;
    } else if (variant === 2 || variant === 3) {
      // two hammer taps on the stakes
      this.sound_vol = variant === 2 ? 1 / 40 : 1 / 44;
      this.wave_type = waveforms.SINE;
      this.p_env_sustain = 0.01;
      this.p_env_punch = 0.6;
      this.p_env_decay = 0.08 + frnd(0.005);
      this.p_base_freq = (variant === 2 ? 0.5 : 0.46) + frnd(0.005);
      this.p_freq_ramp = -0.2;
    } else {
      // dirt settling
      this.sound_vol = 1 / 48;
      this.wave_type = waveforms.NOISE;
      this.p_env_attack = 0.03;
      this.p_env_sustain = 0.03;
      this.p_env_decay = 0.14 + frnd(0.01);
      this.p_base_freq = 0.2 + frnd(0.01);
      this.p_lpf_freq = 0.3;
      this.p_hpf_freq = 0.1;
    }

    return this;
  }

  // ui
  select(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = 1 / 32;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0.02;
    this.p_env_sustain = 0.05;
    this.p_env_decay = 0.1 + frnd(0.01);
    this.p_base_freq = 0.32 + 0.03 * variant + frnd(0.002);
    this.p_lpf_freq = 0.2;

    return this;
  }

  tab(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = 1 / 48;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.1;
    this.p_env_punch = 0.2;
    this.p_env_decay = 0.12 + frnd(0.01);
    this.p_base_freq = 0.383 + frnd(0.002);
    this.p_arp_mod = variant === 1 ? 0.5 : -0.18;
    this.p_arp_speed = 0.75;
    this.p_duty = 0.25;
    this.p_lpf_freq = 0.45;
    this.p_hpf_freq = 0.1;

    return this;
  }

  prompt(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = 1 / 64;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.06;
    this.p_env_punch = 0.2;
    this.p_env_decay = 0.1 + frnd(0.005);
    this.p_base_freq = [0.41, 0.45][variant - 1] + frnd(0.002);
    this.p_duty = 0.8;
    this.p_lpf_freq = 0.4;

    return this;
  }

  open(options: SoundOptions) {
    const intensity = options.intensity || 120;
    this.sound_vol = 1 / 48;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0.03;
    this.p_env_sustain = Math.sqrt((intensity * 44.1) / 100000);
    this.p_env_decay = 0.08;
    this.p_base_freq = 0.2 + frnd(0.002);
    this.p_freq_ramp = 0.08;
    this.p_lpf_freq = 0.12;

    return this;
  }

  close(options: SoundOptions) {
    this.sound_vol = 1 / 56;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0.02;
    this.p_env_sustain = 0.2;
    this.p_env_decay = 0.1;
    this.p_base_freq = 0.21 + frnd(0.002);
    this.p_freq_ramp = -0.15;
    this.p_lpf_freq = 0.12;

    return this;
  }

  confirm(options: SoundOptions) {
    this.sound_vol = 1 / 48;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.17;
    this.p_env_punch = 0.3;
    this.p_env_decay = 0.18 + frnd(0.01);
    this.p_base_freq = 0.3805 + frnd(0.002);
    this.p_arp_mod = 0.595;
    this.p_arp_speed = 0.7;
    this.p_duty = 0.3;
    this.p_lpf_freq = 0.5;
    this.p_hpf_freq = 0.1;

    return this;
  }

  back(options: SoundOptions) {
    this.sound_vol = 1 / 56;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.17;
    this.p_env_punch = 0.3;
    this.p_env_decay = 0.18 + frnd(0.01);
    this.p_base_freq = 0.4735 + frnd(0.002);
    this.p_arp_mod = -0.215;
    this.p_arp_speed = 0.7;
    this.p_duty = 0.3;
    this.p_lpf_freq = 0.5;
    this.p_hpf_freq = 0.1;

    return this;
  }

  deny(options: SoundOptions) {
    this.sound_vol = 1 / 40;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.16;
    this.p_env_punch = 0.15;
    this.p_env_decay = 0.15;
    this.p_base_freq = 0.2605 + frnd(0.002);
    this.p_freq_ramp = -0.15;
    this.p_vib_strength = 0.08;
    this.p_vib_speed = 0.35;
    this.p_lpf_freq = 0.4;
    this.p_hpf_freq = 0.05;

    return this;
  }

  type(options: SoundOptions) {
    const variant = options.variant || 1;
    const intensity = options.intensity || 1;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0;
    this.p_env_punch = 1;

    if (variant === 1) {
      // switch click
      this.sound_vol = 1 / 96;
      this.p_env_sustain = 0.01;
      this.p_env_decay = 0.05 + frnd(0.005);
      this.p_base_freq = 1;
      this.p_lpf_freq = 0.45 + frnd(0.01);
      this.p_lpf_resonance = 0.5;
      this.p_hpf_freq = 0.4;
    } else {
      // key bottoming out
      this.sound_vol = 1 / 56;
      this.p_env_sustain = 0.02;
      this.p_env_decay = 0.1 + 0.02 * (intensity - 1) + frnd(0.01);
      this.p_base_freq = 0.6;
      this.p_lpf_freq = 0.235 - 0.01 * (intensity - 1) + frnd(0.006);
      this.p_lpf_resonance = 0.6;
      this.p_hpf_freq = 0.08;
    }

    return this;
  }

  text(options: SoundOptions) {
    this.sound_vol = 1 / 64;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.05;
    this.p_env_decay = 0.06;
    this.p_base_freq = 0.45 + frnd(0.002);
    this.p_duty = 0.8;
    this.p_lpf_freq = 0.5;

    return this;
  }

  equip(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = 1 / 48;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.06;
    this.p_env_punch = 0.4;
    this.p_env_decay = variant === 4 ? 0.24 : 0.12;
    this.p_base_freq =
      [0.3485, 0.3985, 0.4285, 0.5015][variant - 1] + frnd(0.002);
    this.p_duty = 0.25;
    this.p_lpf_freq = 0.5;
    this.p_hpf_freq = 0.1;

    return this;
  }

  anvil(options: SoundOptions) {
    this.sound_vol = 1 / 48;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.03;
    this.p_env_punch = 0.9;
    this.p_env_decay = 0.18 + frnd(0.01);
    this.p_base_freq = 0.6 + frnd(0.03);
    this.p_freq_ramp = -0.1;
    this.p_lpf_freq = 0.24 + frnd(0.006);
    this.p_lpf_resonance = 0.7;
    this.p_hpf_freq = 0.2;

    return this;
  }

  cling(options: SoundOptions) {
    this.sound_vol = 1 / 40;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.02;
    this.p_env_punch = 0.8;
    this.p_env_decay = 0.5 + frnd(0.02);
    this.p_base_freq = 0.792 + frnd(0.004);
    this.p_duty = 0.45;
    this.p_vib_strength = 0.04;
    this.p_vib_speed = 0.85;
    this.p_pha_offset = 0.07;
    this.p_pha_ramp = 0.02;
    this.p_lpf_freq = 0.55;
    this.p_lpf_resonance = 0.5;
    this.p_hpf_freq = 0.35;

    return this;
  }

  unlock(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = 1 / 96;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.02;
    this.p_env_punch = 0.8;
    this.p_env_decay = 0.1 + frnd(0.01);
    this.p_base_freq = 0.55 + frnd(0.02);
    this.p_lpf_freq = 0.26 + 0.04 * variant + frnd(0.004);
    this.p_lpf_resonance = 0.7;
    this.p_hpf_freq = 0.25;

    return this;
  }

  door(options: SoundOptions) {
    this.sound_vol = 1 / 40;
    this.wave_type = waveforms.SQUARE;
    this.p_env_attack = 0.02;
    this.p_env_sustain = 0.18;
    this.p_env_punch = 0.1;
    this.p_env_decay = 0.25 + frnd(0.01);
    this.p_base_freq = 0.183 + frnd(0.002);
    this.p_freq_ramp = 0.12;
    this.p_duty = 0.3;
    this.p_vib_strength = 0.15;
    this.p_vib_speed = 0.35;
    this.p_lpf_freq = 0.28;
    this.p_hpf_freq = 0.05;

    return this;
  }

  lever(options: SoundOptions) {
    const intensity = options.intensity || 1;
    this.sound_vol = 1 / 48;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.012;
    this.p_env_punch = 1;
    this.p_env_decay = 0.075 + frnd(0.004);
    this.p_base_freq = 1;
    this.p_lpf_freq = 0.42 - 0.04 * (intensity - 1) + frnd(0.004);
    this.p_lpf_resonance = 0.55;
    this.p_hpf_freq = 0.35;

    return this;
  }

  snow(options: SoundOptions) {
    const proximity = options.proximity || 1;
    this.sound_vol = (1 / 40) * proximity;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0.03;
    this.p_env_sustain = 0.06;
    this.p_env_decay = 0.16 + frnd(0.01);
    this.p_base_freq = 0.14 + frnd(0.01);
    this.p_freq_ramp = -0.05;
    this.p_lpf_freq = 0.4;
    this.p_hpf_freq = 0.15;

    return this;
  }

  push(options: SoundOptions) {
    this.sound_vol = 1 / 26;
    this.wave_type = waveforms.NOISE;
    this.p_env_attack = 0.18;
    this.p_env_sustain = 0.2;
    this.p_env_decay = 0.26 + frnd(0.01);
    this.p_base_freq = 0.5 + frnd(0.01);
    this.p_lpf_freq = 0.2;
    this.p_hpf_freq = 0.05;

    return this;
  }

  progress(options: SoundOptions) {
    const intensity = options.intensity || 1020;
    this.sound_vol = 1 / 96;
    this.wave_type = waveforms.NOISE;
    // reverse noise riser swelling and opening up until the first ring
    this.p_env_attack = Math.sqrt((intensity * 0.92 * 44.1) / 100000);
    this.p_env_sustain = Math.sqrt((intensity * 0.05 * 44.1) / 100000);
    this.p_env_decay = 0.04;
    this.p_base_freq = 0.3;
    this.p_freq_ramp = 0.08;
    this.p_lpf_freq = 0.1;
    this.p_lpf_ramp = 0.3;
    this.p_hpf_freq = 0.05;

    return this;
  }

  level(options: SoundOptions) {
    const variant = options.variant || 1;
    this.sound_vol = 1 / 48;
    this.wave_type = waveforms.SAWTOOTH;
    this.p_env_attack = 0.02;
    this.p_env_sustain = 0.05;
    this.p_env_punch = 0.15;
    this.p_env_decay = 0.75 + frnd(0.01);
    // C sus4 climbing from C3 without resolving, one chord tone per ring
    this.p_base_freq = [
      0.1899, 0.2336, 0.2705, 0.313, 0.3318, 0.3838, 0.4068, 0.4703, 0.5437,
      0.5762, 0.6659, 0.7696,
    ][Math.min(variant, 12) - 1];
    this.p_lpf_freq = 0.6;
    this.p_hpf_freq = 0.05;

    return this;
  }
}

export const soundPresets = Object.getOwnPropertyNames(
  Presets.prototype
).filter((name) => name !== "constructor") as SoundPreset[];

const range = (count: number) =>
  Array.from({ length: count }, (_, index) => index + 1);

// variants the game plays, including notes of melodies
const soundVariants = {
  move: [1, 2, 3],
  slide: [1, 2, 3, 18],
  hit: [1, 2],
  magic: [],
  pickup: [1, 2, 3, 4, 5, 6, 7, 10, 13],
  xp: [],
  die: [1, 2],
  bubble: [1, 2],
  sail: [],
  rain: [2],
  beam: [3],
  wave: [],
  slash: [],
  talk: [0.5, 1, 2],
  fire: [],
  crackle: [],
  danger: range(72),
  arrow: [1, 2, 3, 4],
  spear: [],
  disc: [],
  bolt: [],
  blast: [],
  trap: range(8),
  dash: [1, 2],
  zap: [1, 2, 3],
  spark: range(4),
  block: [1, 2, 3, 4],
  totem: [2],
  tool: [1, 2],
  harvest: [1, 2, 3, 4],
  dig: [],
  fish: [1, 2, 3, 4, 6],
  escape: range(4),
  build: range(4),
  select: [1, 2],
  tab: [1, 2],
  prompt: [1, 2],
  open: [],
  close: [],
  confirm: [],
  back: [],
  deny: [],
  type: [1, 2],
  text: [],
  equip: range(4),
  anvil: [],
  cling: [],
  unlock: [1, 2],
  door: [],
  lever: [],
  snow: [],
  push: [],
  progress: [],
  level: range(12),
} as const;

export type SoundPreset = Exclude<keyof Presets, keyof Params>;

// every preset needs to list its variants
const presetVariants: Record<SoundPreset, readonly number[]> = soundVariants;

type SoundVariant<P extends SoundPreset> = (typeof soundVariants)[P][number];

// slightly reduced quality halves the memory of synthesized sounds
const sampleRate = 22050;

const createParams = (preset: SoundPreset, options: SoundOptions) => {
  const params = new Presets();
  rng = createRng(options.seed || 0);
  params[preset](options);
  params.sample_rate = sampleRate;
  return params;
};

// jsfxr scales every sample by this factor of the sound volume
const getGain = (params: Params) => Math.exp(params.sound_vol) - 1;

// sounds only differing in volume share one synthesized buffer
const sounds = new Map<string, { sound: SoundBuffer; gain: number }>();

const getSoundKey = (params: Params) =>
  JSON.stringify({ ...params, sound_vol: 0 });

const getSound = (params: Params) => {
  const key = getSoundKey(params);
  let cached = sounds.get(key);

  if (!cached) {
    const samples = synthesizeSound(params);
    cached = {
      sound: createSoundBuffer(samples, params.sample_rate),
      gain: getGain(params),
    };
    sounds.set(key, cached);
  }

  return cached;
};

let precomputing = false;

// Warm the finite preset catalog without blocking game frames.
const precomputeSounds = () => {
  if (precomputing) return;
  precomputing = true;

  const pending = soundPresets.flatMap((preset) =>
    [undefined, ...presetVariants[preset]].flatMap((variant) =>
      seeds.map((seed) => createParams(preset, { variant, seed }))
    )
  );
  prewarmSounds(
    pending.filter((params) => getGain(params) > 0),
    (params) => sounds.has(getSoundKey(params)),
    (params, samples) => {
      sounds.set(getSoundKey(params), {
        sound: createSoundBuffer(samples, params.sample_rate),
        gain: getGain(params),
      });
    }
  );
};

export const play = <P extends SoundPreset>(
  preset: P,
  { delay = 0, notes = 1, spacing = 0, pattern, ...options }: SfxOptions<P> = {}
) => {
  if (!isPlaying()) return;

  precomputeSounds();

  for (let note = 1; note <= notes; note += 1) {
    // leave out rests, e.g. empty chars
    if (pattern && !pattern[note - 1]) continue;

    const params = createParams(preset, {
      ...options,
      variant: notes > 1 ? note : options.variant,
      seed: options.seed ?? seeds[random(0, seeds.length - 1)],
    });
    const gain = getGain(params);
    if (gain === 0) continue;

    // schedule notes on the audio clock to keep them in sequence when frames lag
    const cached = getSound(params);
    cached.sound.play(
      getAudioTime(delay + (note - 1) * spacing),
      gain / cached.gain
    );
  }
};
