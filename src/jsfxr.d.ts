declare module "jsfxr" {
  // Wave shape constants
  export const waveforms: {
    SQUARE: 0;
    SAWTOOTH: 1;
    SINE: 2;
    NOISE: 3;
  };

  // Playback volume and oversampling
  export let masterVolume: number;
  export let OVERSAMPLING: number;

  // Core sound parameters interface
  export class Params {
    oldParams: boolean;

    // Wave shape
    wave_type: number;

    // Envelope
    p_env_attack: number; // [0..1]
    p_env_sustain: number; // [0..1]
    p_env_punch: number; // [0..1]
    p_env_decay: number; // [0..1]

    // Tone
    p_base_freq: number; // [0..1]
    p_freq_limit: number; // [0..1]
    p_freq_ramp: number; // [-1..1]
    p_freq_dramp: number; // [-1..1]

    // Vibrato
    p_vib_strength: number; // [0..1]
    p_vib_speed: number; // [0..1]

    // Tonal change
    p_arp_mod: number; // [-1..1]
    p_arp_speed: number; // [0..1]

    // Square wave duty
    p_duty: number; // [0..1]
    p_duty_ramp: number; // [-1..1]

    // Repeat
    p_repeat_speed: number; // [0..1]

    // Flanger
    p_pha_offset: number; // [-1..1]
    p_pha_ramp: number; // [-1..1]

    // Low-pass filter
    p_lpf_freq: number; // [0..1]
    p_lpf_ramp: number; // [-1..1]
    p_lpf_resonance: number; // [0..1]

    // High-pass filter
    p_hpf_freq: number; // [0..1]
    p_hpf_ramp: number; // [-1..1]

    // Sample parameters
    sound_vol: number; // [0..1]
    sample_rate: number; // e.g. 44100
    sample_size: number; // bits per sample, e.g. 8

    // Methods for serialization and presets
    toB58(): string;
    fromB58(b58encoded: string): Params;
    fromJSON(struct: Partial<Params>): Params;

    pickupCoin(): Params;
    laserShoot(): Params;
    explosion(): Params;
    powerUp(): Params;
    hitHurt(): Params;
    jump(): Params;
    blipSelect(): Params;
    synth(): Params;
    tone(): Params;
    click(): Params;
    random(): Params;
    mutate(): Params;

    buffer: Float32Array;
    header: { sampleRate: number };
  }

  // sfxr namespace with utility methods
  export namespace sfxr {
    function toBuffer(synthdef: Partial<Params>): ArrayBuffer;
    function toWebAudio(
      synthdef: Partial<Params>,
      audiocontext?: AudioContext
    ): AudioBufferSourceNode | undefined;
    function toWave(synthdef: Partial<Params>): SoundEffect;
    function toAudio(synthdef: Partial<Params>): any;
    function play(synthdef: Partial<Params>): any;
    function b58decode(b58encoded: string): Partial<Params>;
    function b58encode(synthdef: Partial<Params>): string;
    function generate(
      algorithm: keyof Params,
      options?: Partial<Params>
    ): Params;
  }

  // SoundEffect class
  export class SoundEffect {
    parameters: Partial<Params>;
    waveShape: number;

    constructor(ps: string | Partial<Params>);
    init(ps: Partial<Params>): void;
    initForRepeat(): void;
    getRawBuffer(): {
      buffer: Float32Array;
      normalized: Float32Array;
      clipped: number;
    };
    generate(): this;
    getAudio(): any;
    play(): any;
  }
}
