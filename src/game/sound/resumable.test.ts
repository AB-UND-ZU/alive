import { createSoundBuffer } from "./resumable";

test("activity gates silence output without changing the user's Sound FX setting", async () => {
  const edges = new Map<object, any>();
  const output: number[] = [];
  const destination = {};
  const makeNode = () => ({
    gain: { value: 1 },
    connect(target: object) {
      edges.set(this, target);
    },
    start() {
      let volume = 1;
      let current = edges.get(this);
      while (current && current !== destination) {
        volume *= current.gain.value;
        current = edges.get(current);
      }
      output.push(volume);
    },
  });
  const original = window.AudioContext;
  (window as any).AudioContext = class {
    state = "running";
    currentTime = 0;
    destination = destination;
    createGain = makeNode;
    createBufferSource = makeNode;
    createBuffer() {
      return { getChannelData: () => new Float32Array(1) };
    }
  };
  try {
    let audio: typeof import("./resumable");
    jest.isolateModules(() => {
      audio = jest.requireActual("./resumable");
    });
    const buffer: ReturnType<typeof createSoundBuffer> =
      audio!.createSoundBuffer([1], 44100);
    audio!.setAudioActive(false);
    expect(audio!.isPlaying()).toBe(false);
    buffer.play(0);
    audio!.unmuteAudio();
    buffer.play(0);
    audio!.setAudioActive(true);
    expect(audio!.isPlaying()).toBe(true);
    buffer.play(0);
    audio!.muteAudio();
    audio!.setAudioActive(false);
    audio!.setAudioActive(true);
    expect(audio!.isPlaying()).toBe(false);
    buffer.play(0);
    expect(output).toEqual([0, 0, 1, 0]);
  } finally {
    window.AudioContext = original;
  }
});
