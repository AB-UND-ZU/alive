import { Params, SoundEffect } from "jsfxr";
import { seedRandom } from "../../testing/env";
import { ensureAudio } from "./resumable";
import { synthesizeSound } from "./synthesis";

jest.unmock("./synthesis");

it.each([0, 1, 2, 3])(
  "preserves every stored PCM sample and tail boundary for waveform %s",
  (wave) => {
    const params = new Params();
    params.wave_type = wave;
    params.sample_rate = 44100;
    params.p_env_sustain = 0.2;
    params.p_env_decay = 0.3;
    seedRandom(73);
    const original = new SoundEffect(params).getRawBuffer().normalized;
    const peak = original.reduce(
      (max, sample) => Math.max(max, Math.abs(sample)),
      0
    );
    let length = original.length;
    while (length > 0 && Math.abs(original[length - 1]) <= peak / 1000)
      length--;
    seedRandom(73);
    expect(synthesizeSound(params)).toEqual(
      new Float32Array(original.slice(0, length))
    );
  }
);

it("preserves high frequencies above the half-rate Nyquist limit", () => {
  const params = new Params();
  params.sample_rate = 44100;
  params.wave_type = 2;
  params.p_base_freq = 2;
  params.p_env_sustain = 0.2;
  params.p_env_decay = 0.1;
  const samples = synthesizeSound(params).slice(100, 2100);
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    const positive = samples[i] >= 0;
    const previousPositive = samples[i - 1] >= 0;
    if (positive !== previousPositive) crossings++;
  }
  const frequency = (crossings * params.sample_rate) / (2 * samples.length);
  expect(frequency).toBeGreaterThan(13000);
  expect(frequency).toBeLessThan(15000);
});

describe("preset waveforms", () => {
  const { play } = jest.requireActual<typeof import(".")>(".");
  let synthesized: jest.SpyInstance;
  let buffers: jest.SpyInstance;

  beforeAll(() => ensureAudio());
  beforeEach(() => {
    synthesized = jest.spyOn(SoundEffect.prototype, "getRawBuffer");
    buffers = jest.spyOn(window.AudioContext.prototype, "createBuffer");
  });
  afterEach(() => jest.restoreAllMocks());

  it("keeps the original sample rate without silent tails", () => {
    play(undefined, undefined, "wave", { seed: 2 });

    const rendered = synthesized.mock.results[0].value.normalized;
    const [, length, sampleRate] = buffers.mock.calls[0];
    expect(sampleRate).toBe(44100);
    expect(length).toBeLessThan(rendered.length);
    const peak = Math.max(...rendered.map(Math.abs));
    expect(Math.abs(rendered[length - 1])).toBeGreaterThan(peak / 1000);
  });

  it.each([0, 1, 2, 3] as const)(
    "keeps orb beam sweeps audible without sharp clicks for seed %s",
    (seed) => {
      play(undefined, undefined, "beam", { variant: 3, seed });
      const samples: number[] = synthesized.mock.results[0].value.normalized;
      let largestStep = 0;
      let energy = 0;
      for (let i = 0; i < samples.length; i++) {
        const step = samples[i] - (samples[i - 1] ?? 0);
        largestStep = Math.max(largestStep, Math.abs(step));
        energy += samples[i] ** 2;
      }
      expect(Math.sqrt(energy / samples.length)).toBeGreaterThan(0.02);
      expect(largestStep).toBeLessThan(0.01);
    }
  );

  it("keeps the prompt cue shorter and quieter than a danger warning", () => {
    play(undefined, undefined, "prompt", { seed: 3 });
    play(undefined, undefined, "danger", { seed: 3 });

    const [prompt, danger] = synthesized.mock.results.map(
      ({ value }) => value.normalized as number[]
    );
    const peak = (samples: number[]) =>
      samples.reduce((value, sample) => Math.max(value, Math.abs(sample)), 0);
    expect(buffers.mock.calls[0][1]).toBeLessThan(buffers.mock.calls[1][1]);
    expect(peak(prompt)).toBeLessThan(peak(danger) / 2);
  });
});
