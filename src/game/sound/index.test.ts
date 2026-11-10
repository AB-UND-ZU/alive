import { SoundEffect } from "jsfxr";
import { ensureAudio } from "./resumable";

// render real sounds, the global test setup only records played names
const { play } = jest.requireActual<typeof import(".")>(".");

const AudioContext = (window as any).AudioContext;

// jsfxr scales samples by this factor of the sound volume
const rainGain = (proximity: number) =>
  Math.exp((1 / 128) * (proximity / 2) ** 0.5) - 1;

describe("sound", () => {
  let synthesized: jest.SpyInstance;
  let buffers: jest.SpyInstance;
  let starts: number[];
  let gains: { gain: { value: number } }[];

  beforeAll(() => {
    // background synthesis only runs when a test advances timers
    jest.useFakeTimers();
    return ensureAudio();
  });

  afterAll(() => jest.useRealTimers());

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

  it("stores sounds at a reduced sample rate without silent tails", () => {
    play("wave", { seed: 2 });

    const rendered = synthesized.mock.results[0].value.normalized;
    const [, length, sampleRate] = buffers.mock.calls[0];
    expect(sampleRate).toBe(22050);
    expect(length).toBeLessThan(rendered.length);
    const peak = Math.max(...rendered.map(Math.abs));
    expect(Math.abs(rendered[length - 1])).toBeGreaterThan(peak / 1000);
  });

  it("synthesizes every listed variant and seed in the background", () => {
    jest.runAllTimers();
    synthesized.mockClear();

    for (const seed of [0, 1, 2, 3] as const) {
      play("danger", { variant: 72, intensity: 1, seed });
      play("level", { variant: 12, seed });
      play("arrow", { variant: 4, seed });
      play("sail", { seed });
    }
    expect(synthesized).not.toHaveBeenCalled();

    // sounds with other options are synthesized when first played
    play("magic", { intensity: 3, seed: 0 });
    expect(synthesized).toHaveBeenCalledTimes(1);
  });
});
