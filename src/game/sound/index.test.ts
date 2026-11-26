import { assignBuilding } from "../../bindings/creation";
import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  holdMove,
  step,
  trigger,
} from "../../testing/harness";
import { defaultLight } from "../../engine/systems/consume";
import { moveEntity } from "../../engine/systems/map";
import * as synthesis from "./synthesis";
import { ensureAudio } from "./resumable";

jest.mock("./createWorker", () => ({ createSoundWorker: () => undefined }));

// Exercise playback and preset selection with one sample per synthesized sound.
const { play, loadSounds } = jest.requireActual<typeof import(".")>(".");

const AudioContext = (window as any).AudioContext;

describe("sound", () => {
  let synthesized: jest.SpyInstance;
  let buffers: jest.SpyInstance;
  let starts: number[];
  let sources: AudioBufferSourceNode[];
  let gains: { gain: { value: number } }[];

  beforeAll(() => ensureAudio());

  beforeEach(() => {
    synthesized = jest.spyOn(synthesis, "synthesizeSound");
    buffers = jest.spyOn(AudioContext.prototype, "createBuffer");
    starts = [];
    sources = [];
    const createBufferSource = AudioContext.prototype.createBufferSource;
    jest
      .spyOn(AudioContext.prototype, "createBufferSource")
      .mockImplementation(function (this: unknown) {
        const node = createBufferSource.call(this);
        sources.push(node);
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
    "synthesizes %s once per seed at different positions",
    (preset) => {
      const world = createAreaWorld("|♀ |", { size: 64 });
      for (let drop = 0; drop < 20; drop += 1) {
        play(world, preset, {
          position: { x: drop % 8, y: 0 },
          delay: drop,
          seed: 1,
        });
      }
      expect(starts).toHaveLength(20);
      expect(synthesized).toHaveBeenCalledTimes(1);
    }
  );

  it("muffles playing rain on entering a house and opens the same filter on leaving", () => {
    const world = createAreaWorld(`
|      |
| ╒╦╦╕ |
| ╠╬╬╣ |
| ╞╪╪╡ |
| └D┴┘ |
|  ♀   |
|      |
`, { legend: { D: "wood_door" } });
    assignBuilding(world, { x: 3, y: 2 });
    const hero = assertHero(world);
    const outside = { ...hero.POSITION };
    const options = { position: outside, seed: 0 } as const;
    const filters = jest.spyOn(AudioContext.prototype, "createBiquadFilter");
    play(world, "bubble", { ...options, variant: 1 });
    expect(filters).not.toHaveBeenCalled();
    play(world, "rain", options);
    const filter = filters.mock.results[0].value;
    const frequency = filter.frequency;
    const open = frequency.value;
    const transition = jest.spyOn(frequency, "setTargetAtTime");

    step(world, 15);
    trigger(world, "interact");
    holdMove(world, ["up"]);
    advanceUntil(world, () => !!hero.LAYER?.structure, 3000);
    expect(frequency.value).toBeLessThan(open / 4);
    play(world, "bubble", { ...options, variant: 2 });
    play(world, "rain", options);
    holdMove(world, ["down"]);
    advanceUntil(world, () => !hero.LAYER?.structure, 1000);
    expect(frequency.value).toBe(open);
    expect(transition).toHaveBeenCalledTimes(2);
    expect(filters).toHaveBeenCalledTimes(1);
  });

  it("picks one of a few seeds when none is given", () => {
    for (let cast = 0; cast < 20; cast += 1) play(undefined, "beam", { variant: 3 });

    expect(starts).toHaveLength(20);
    expect(synthesized.mock.calls.length).toBeGreaterThan(1);
    expect(synthesized.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("culls distant deaths before synthesis and pans audible hits across the map seam", () => {
    const world = createAreaWorld("|♀ |", { size: 64 });
    const pan = jest.spyOn(AudioContext.prototype, "createStereoPanner");
    play(world, "die", { position: { x: 0, y: 10 }, seed: 1 });
    expect(synthesized).not.toHaveBeenCalled();
    expect(starts).toEqual([]);

    for (const x of [0, 5, 59])
      play(world, "hit", { position: { x, y: 0 }, seed: 1 });
    expect(synthesized).toHaveBeenCalledTimes(1);
    expect(buffers).toHaveBeenCalledTimes(1);
    expect(gains[0].gain.value).toBe(Math.SQRT2);
    expect(gains[1].gain.value).toBeLessThan(gains[0].gain.value);
    expect(gains[2].gain.value).toBe(gains[1].gain.value);
    const pans = pan.mock.results.map(({ value }) => value.pan.value);
    expect(pans[0]).toBe(0);
    expect(pans[1]).toBeGreaterThan(0);
    expect(pans[2]).toBe(-pans[1]);
  });

  it("keeps nearby interactions and orb warnings audible and fades faster beyond the hero's sight", () => {
    const world = createAreaWorld("|♀ |", { size: 64 });
    const level = (
      preset: "prompt" | "danger" | "beam" | "fire",
      y: number
    ) => {
      play(world, preset, { position: { x: 0, y }, seed: 1 });
      return gains[gains.length - 1].gain.value / Math.SQRT2;
    };
    const light = assertHero(world).LIGHT!;
    light.visibility = 6;
    expect(level("prompt", 1)).toBe(1);
    const inside = level("danger", 5);
    const boundary = level("danger", 6);
    const outside = level("danger", 7);
    expect(boundary).toBeGreaterThan(0.25);
    expect(outside / boundary).toBeLessThan(boundary / inside);

    light.visibility = defaultLight.visibility;
    expect(level("danger", 6)).toBeLessThan(boundary);
    expect(level("beam", 6)).toBeGreaterThan(0.75);
    expect(level("fire", 4)).toBeLessThan(0.07);
    expect(level("beam", 9)).toBeLessThan(level("beam", 8));
    const started = starts.length;
    play(world, "beam", { position: { x: 0, y: 10 } });
    expect(starts).toHaveLength(started);
  });

  it("schedules the cached notes of a melody on the audio clock", () => {
    play(undefined, "talk", { notes: 3, spacing: 50, seed: 0 });
    play(undefined, "talk", {
      notes: 3,
      spacing: 50,
      pattern: [true, false, true],
      seed: 0,
    });

    expect(synthesized).toHaveBeenCalledTimes(3);
    expect(starts).toEqual([0, 0.05, 0.1, 0, 0.1]);
  });

  it("staggers positioned sounds on the same tick while preserving UI and melody timing", () => {
    const world = createAreaWorld("|♀ |", { size: 64 });
    const options = { position: { x: 0, y: 0 }, seed: 0, delay: 100 } as const;
    const random = jest.spyOn(Math, "random").mockReturnValue(0);

    play(world, "confirm", { delay: 100, seed: 0 });
    play(world, "talk", options);
    random.mockReturnValue(0.5);
    play(world, "talk", { ...options, notes: 3, spacing: 50 });
    random.mockReturnValue(0.9);
    play(world, "talk", options);

    const hero = assertHero(world);
    play(world, "move", { position: hero.POSITION, seed: 0 });
    play(world, "hit", { ...options, actor: hero });
    play(world, "harvest", { ...options, actor: hero });
    expect(starts).toEqual([0.1, 0.1, 0.1125, 0.1625, 0.2125, 0.1405, 0, 0.1, 0.1]);
  });

  it("varies pitch between plays of cached sounds and keeps each chord in tune", () => {
    const world = createAreaWorld("|♀ |", { size: 64 });
    jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValue(1 - Number.EPSILON);
    const chord = { notes: 2, seed: 0 } as const;
    play(world, "fountain", chord);
    play(world, "fountain", { ...chord, position: { x: 0, y: 0 } });

    const rates = sources.map((source) => source.playbackRate.value);
    expect(1200 * Math.log2(rates[0])).toBeCloseTo(-10, 6);
    expect(rates[1]).toBe(rates[0]);
    expect(1200 * Math.log2(rates[2])).toBeCloseTo(10, 6);
    expect(rates[3]).toBe(rates[2]);
    expect(sources[2].buffer).toBe(sources[0].buffer);
    expect(sources[3].buffer).toBe(sources[1].buffer);
  });

  it("fades an active sound over the hero's movement tick and leaves UI sounds centered", () => {
    const world = createAreaWorld("|♀ |", { size: 64 });
    const hero = assertHero(world);
    const tick = world.assertByIdAndComponents(hero.MOVABLE.reference, [
      "REFERENCE",
    ]).REFERENCE.tick;
    const panners = jest.spyOn(AudioContext.prototype, "createStereoPanner");
    play(world, "prompt", { variant: 2, seed: 0 });
    play(world, "prompt", { position: { x: 2, y: 0 }, variant: 2, seed: 0 });
    expect(panners).toHaveBeenCalledTimes(1);
    expect(gains[0].gain.value).toBe(1);
    const gain = gains[1].gain as AudioParam;
    const volume = jest.spyOn(gain, "linearRampToValueAtTime");
    const pan = jest.spyOn(
      panners.mock.results[0].value.pan,
      "linearRampToValueAtTime"
    );
    moveEntity(world, hero, { x: 2, y: 0 });
    expect(volume).toHaveBeenLastCalledWith(Math.SQRT2, tick / 1000);
    expect(pan).toHaveBeenLastCalledWith(0, tick / 1000);
    moveEntity(world, hero, { x: 3, y: 0 });
    expect(pan.mock.calls[1][0]).toBeLessThan(0);
    moveEntity(world, hero, { x: 2, y: 11 }, false);
    expect(volume).toHaveBeenLastCalledWith(0, 0);
    sources[1].onended!.call(sources[1], new Event("ended"));
    moveEntity(world, hero, { x: 2, y: 0 });
    expect(volume).toHaveBeenCalledTimes(3);
    expect(starts).toHaveLength(2);
    expect(synthesized).toHaveBeenCalledTimes(1);
  });

  it("loads every listed variant and seed once before playback", async () => {
    const loading = loadSounds({ move: [300, 266], open: [600] });
    expect(loadSounds()).toBe(loading);
    await loading;
    synthesized.mockClear();

    for (const seed of [0, 1, 2, 3] as const) {
      play(undefined, "danger", { variant: 72, intensity: 1, seed });
      play(undefined, "level", { variant: 12, seed });
      play(undefined, "arrow", { variant: 4, seed });
      play(undefined, "sail", { seed });
      play(undefined, "open", { intensity: 600, seed });
      for (const intensity of [300, 266]) {
        for (const variant of [1, 2, 3] as const) {
          play(undefined, "move", { intensity, variant, seed });
        }
      }
    }
    expect(synthesized).not.toHaveBeenCalled();

    // sounds with other options are synthesized when first played
    play(undefined, "magic", { intensity: 3, seed: 0 });
    expect(synthesized).toHaveBeenCalledTimes(1);
  });
});
