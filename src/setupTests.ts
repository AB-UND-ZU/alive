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
class FakeAudioNode {
  gain = { value: 1 };
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
  destination = new FakeAudioNode();
  sampleRate = 44100;
  currentTime = 0;
  createGain() {
    return new FakeAudioNode();
  }
  createBufferSource() {
    return new FakeAudioNode();
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
}
(window as any).AudioContext = FakeAudioContext;

// --- sound: record instead of synthesizing ---------------------------------

// synthesizing sfx is by far the slowest part of a tick, so only record calls
jest.mock("./game/sound", () => {
  const actual = jest.requireActual("./game/sound");
  const env = jest.requireActual("./testing/env");
  return {
    ...actual,
    play: (...args: unknown[]) => {
      env.playedSounds.push(args[0]);
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
