// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { seedRandom, resetPlayedSounds } from "./testing/env";

// enable act() for renderers other than @testing-library/react
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// --- browser APIs missing in jsdom -----------------------------------------

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList);
}

// no 2d canvas in jsdom, callers already handle a missing context
HTMLCanvasElement.prototype.getContext = (() => null) as any;

// minimal Web Audio stub, only needed so audio modules can be imported
class FakeAudioParam {
  constructor(public value: number) {}
  setValueAtTime(value: number) { this.value = value; }
  setTargetAtTime(value: number) { this.value = value; }
  cancelScheduledValues() {}
  linearRampToValueAtTime(value: number) { this.value = value; }
}
class FakeAudioNode {
  constructor(public context: FakeAudioContext) {}
  gain = new FakeAudioParam(1);
  playbackRate = new FakeAudioParam(1);
  buffer: unknown = null;
  connect() {
    return this;
  }
  disconnect() {}
  start() {}
  stop() {}
}
class FakeAudioContext {
  state = "suspended";
  destination = new FakeAudioNode(this);
  sampleRate = 44100;
  currentTime = 0;
  createGain() {
    return new FakeAudioNode(this);
  }
  createBiquadFilter() {
    return {
      context: this,
      frequency: new FakeAudioParam(350),
      Q: new FakeAudioParam(1),
      connect() {},
    };
  }
  createStereoPanner() {
    return { pan: new FakeAudioParam(0), connect() {}, disconnect() {} };
  }
  createBufferSource() {
    return new FakeAudioNode(this);
  }
  createBuffer(_channels: number, length: number) {
    const data = Array.from({ length: _channels }, () => new Float32Array(length));
    return {
      getChannelData: (channel: number) => data[channel],
      copyToChannel: (samples: Float32Array, channel: number) =>
        data[channel].set(samples),
    };
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
}
(window as any).AudioContext = FakeAudioContext;

// Run the generation worker’s message handler in-process in jsdom.
jest.mock("./game/levels/createWorker", () => ({
  createLevelWorker: () => ({
    terminate() {},
    onmessage(_event: { data: unknown }) {},
    postMessage({
      request,
    }: {
      request: import("./game/levels/generation").GenerationRequest;
    }) {
      jest
        .requireActual("./game/levels/generation")
        .runGeneration(request, (data: unknown) => this.onmessage({ data }));
    },
  }),
}));

// --- sound: record instead of synthesizing ---------------------------------

jest.mock("./game/sound/createWorker", () => ({
  createSoundWorker: jest.fn(() => undefined),
}));

// Playback and loading tests can exercise the real catalog with one sample per cue.
jest.mock("./game/sound/synthesis", () => ({
  __esModule: true,
  synthesizeSound: () => Float32Array.of(0.25),
}));

jest.mock("./game/sound", () => {
  const actual = jest.requireActual("./game/sound");
  const env = jest.requireActual("./testing/env");
  const { getSoundSource } = jest.requireActual("./game/sound/spatial");
  return {
    ...actual,
    loadSounds: jest.fn(() => Promise.resolve()),
    play: (...[world, preset, options]: Parameters<typeof import("./game/sound").play>) => {
      if (
        !options?.position ||
        (world && getSoundSource(world, options.position, preset, options.variant))
      ) {
        env.playedSounds.push(preset);
      }
    },
  };
});

// --- determinism ------------------------------------------------------------

// seed for module level code and beforeAll hooks
seedRandom(1);

beforeEach(() => {
  // every test starts from the same pseudo random sequence
  seedRandom(1);
  resetPlayedSounds();
  localStorage.clear();
});
