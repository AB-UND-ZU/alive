import { SoundEffect } from "jsfxr";
import { ensureAudio } from "./resumable";

// render real sounds, the global test setup only records played names
jest.mock("./riffwave", () =>
  function RIFFWAVE(this: { header: object }) {
    this.header = {};
  }
);
const { play } = jest.requireActual<typeof import(".")>(".");

const AudioContext = (window as any).AudioContext;

// jsfxr scales samples by this factor of the sound volume
const rainGain = (proximity: number) =>
  Math.exp((1 / 128) * (proximity / 2) ** 0.5) - 1;

describe("sound", () => {
  let synthesized: jest.SpyInstance;
  let started: jest.SpyInstance;
  let gains: { gain: { value: number } }[];

  beforeAll(() => ensureAudio());

  beforeEach(() => {
    synthesized = jest.spyOn(SoundEffect.prototype, "getRawBuffer");
    started = jest.spyOn(AudioContext.prototype, "createBufferSource");
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

  it("plays frequent sounds every time but synthesizes only a few variants", () => {
    for (let drop = 0; drop < 20; drop += 1) {
      play("rain", { proximity: 1 / (drop + 1), delay: drop });
    }

    expect(started).toHaveBeenCalledTimes(20);
    expect(synthesized).toHaveBeenCalledTimes(4);
  });

  it("replays variants at the volume of the requested proximity", () => {
    for (let drop = 0; drop < 4; drop += 1) {
      play("fire", { proximity: 1 });
    }
    play("rain", { proximity: 1, intensity: 0.5 });
    play("rain", { proximity: 1, intensity: 0.5 });
    play("rain", { proximity: 1, intensity: 0.5 });
    play("rain", { proximity: 1, intensity: 0.5 });
    play("rain", { proximity: 0.25, intensity: 0.5 });

    expect(gains.slice(0, -1).map((node) => node.gain.value)).toEqual(
      Array(8).fill(1)
    );
    expect(gains[8].gain.value).toBeCloseTo(rainGain(0.25) / rainGain(1), 10);
  });

  it("synthesizes every note of a melody", () => {
    play("talk", { notes: 3, spacing: 50 });
    play("talk", { notes: 3, spacing: 50 });

    expect(synthesized).toHaveBeenCalledTimes(6);
    expect(started).toHaveBeenCalledTimes(2);
  });

  it("drops the least recently played sounds to bound memory", () => {
    const fill = (intensity: number) => {
      for (let hit = 0; hit < 4; hit += 1) play("hit", { intensity });
    };
    fill(100);
    for (let intensity = 101; intensity <= 108; intensity += 1) fill(intensity);
    synthesized.mockClear();

    fill(108);
    expect(synthesized).not.toHaveBeenCalled();

    fill(100);
    expect(synthesized).toHaveBeenCalledTimes(4);
  });
});
