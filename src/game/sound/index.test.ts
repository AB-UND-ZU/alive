import { SoundEffect } from "jsfxr";
import { ensureAudio } from "./resumable";

jest.mock("./createWorker", () => ({ createSoundWorker: () => undefined }));

// render real sounds, the global test setup only records played names
const { play, loadSounds } = jest.requireActual<typeof import(".")>(".");

const AudioContext = (window as any).AudioContext;

// jsfxr scales samples by this factor of the sound volume
const rainGain = (proximity: number) =>
  Math.exp((1 / 128) * (proximity / 2) ** 0.5) - 1;

describe("sound", () => {
  let synthesized: jest.SpyInstance;
  let buffers: jest.SpyInstance;
  let starts: number[];
  let gains: { gain: { value: number } }[];

  beforeAll(() => ensureAudio());

  beforeEach(() => {
    synthesized = jest.spyOn(SoundEffect.prototype, "getRawBuffer");
    buffers = jest.spyOn(AudioContext.prototype, "createBuffer");
    starts = [];
    const createBufferSource = AudioContext.prototype.createBufferSource;
    jest
      .spyOn(AudioContext.prototype, "createBufferSource")
      .mockImplementation(function (this: unknown) {
        const node = createBufferSource.call(this);
        node.start = (time: number) => starts.push(time);
        return node;
      });
    gains = [];
    const createGain = AudioContext.prototype.createGain;
    jest
      .spyOn(AudioContext.prototype, "createGain")
      .mockImplementation(function (this: unknown) {
        const node = createGain.call(this);
        gains.push(node);
        return node;
      });
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(["rain", "sail"] as const)(
    "synthesizes %s once per seed and replays it",
    (preset) => {
      for (let drop = 0; drop < 20; drop += 1) {
        play(preset, { proximity: 1 / (drop + 1), delay: drop, seed: 1 });
      }
      expect(starts).toHaveLength(20);
      expect(synthesized).toHaveBeenCalledTimes(1);
    }
  );

  it("picks one of a few seeds when none is given", () => {
    for (let cast = 0; cast < 20; cast += 1) play("beam", { variant: 3 });

    expect(starts).toHaveLength(20);
    expect(synthesized.mock.calls.length).toBeGreaterThan(1);
    expect(synthesized.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("replays sounds at the volume of the requested proximity", () => {
    play("fire", { proximity: 1, seed: 0 });
    play("fire", { proximity: 1, seed: 0 });
    play("rain", { proximity: 1, intensity: 0.5, seed: 0 });
    play("rain", { proximity: 0.25, intensity: 0.5, seed: 0 });

    expect(gains.slice(0, 3).map((node) => node.gain.value)).toEqual([1, 1, 1]);
    expect(gains[3].gain.value).toBeCloseTo(rainGain(0.25) / rainGain(1), 10);
  });

  it("schedules the cached notes of a melody on the audio clock", () => {
    play("talk", { notes: 3, spacing: 50, seed: 0 });
    play("talk", {
      notes: 3,
      spacing: 50,
      pattern: [true, false, true],
      seed: 0,
    });

    expect(synthesized).toHaveBeenCalledTimes(3);
    expect(starts).toEqual([0, 0.05, 0.1, 0, 0.1]);
  });

  it("keeps the original sample rate without silent tails", () => {
    play("wave", { seed: 2 });

    const rendered = synthesized.mock.results[0].value.normalized;
    const [, length, sampleRate] = buffers.mock.calls[0];
    expect(sampleRate).toBe(44100);
    expect(length).toBeLessThan(rendered.length);
    const peak = Math.max(...rendered.map(Math.abs));
    expect(Math.abs(rendered[length - 1])).toBeGreaterThan(peak / 1000);
  });

  it("keeps the prompt cue shorter and quieter than a danger warning", () => {
    play("prompt", { seed: 3 });
    play("danger", { seed: 3 });

    const [prompt, danger] = synthesized.mock.results.map(
      ({ value }) => value.normalized as number[]
    );
    const peak = (samples: number[]) =>
      samples.reduce((value, sample) => Math.max(value, Math.abs(sample)), 0);
    expect(buffers.mock.calls[0][1]).toBeLessThan(buffers.mock.calls[1][1]);
    expect(peak(prompt)).toBeLessThan(peak(danger) / 2);
  });

  it("attenuates distant prompts without changing the default UI volume or buffer", () => {
    play("prompt", { variant: 2, seed: 0 });
    play("prompt", { variant: 2, proximity: 1, seed: 0 });
    play("prompt", { variant: 2, proximity: 0.25, seed: 0 });
    play("prompt", { variant: 2, seed: 0 });

    expect(starts).toHaveLength(4);
    expect(synthesized).toHaveBeenCalledTimes(1);
    expect(buffers).toHaveBeenCalledTimes(1);
    expect(gains.slice(0, 2).map((node) => node.gain.value)).toEqual([1, 1]);
    expect(gains[2].gain.value).toBeCloseTo(0.25, 1);
    expect(gains[3].gain.value).toBe(1);
  });

  it("loads every listed variant and seed once before playback", async () => {
    const loading = loadSounds({ move: [300, 266], open: [600] });
    expect(loadSounds()).toBe(loading);
    await loading;
    synthesized.mockClear();

    for (const seed of [0, 1, 2, 3] as const) {
      play("danger", { variant: 72, intensity: 1, seed });
      play("level", { variant: 12, seed });
      play("arrow", { variant: 4, seed });
      play("sail", { seed });
      play("open", { intensity: 600, seed });
      for (const intensity of [300, 266]) {
        for (const variant of [1, 2, 3] as const) {
          play("move", { intensity, variant, seed });
        }
      }
    }
    expect(synthesized).not.toHaveBeenCalled();

    // sounds with other options are synthesized when first played
    play("magic", { intensity: 3, seed: 0 });
    expect(synthesized).toHaveBeenCalledTimes(1);
  });
});
