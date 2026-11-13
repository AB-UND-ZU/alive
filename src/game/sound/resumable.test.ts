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

describe("audio recovery", () => {
  let original: typeof window.AudioContext;
  let context: {
    state: string;
    resume: jest.Mock<Promise<void>, []>;
    suspend: jest.Mock<Promise<void>, []>;
  };
  let audio: typeof import("./resumable");

  beforeEach(() => {
    original = window.AudioContext;
    (window as any).AudioContext = class {
      state = "suspended";
      destination = {};
      resume = jest.fn(async () => {
        // Reproduce Safari's stuck interrupted state until explicitly suspended.
        if (this.state !== "interrupted") this.state = "running";
      });
      suspend = jest.fn(async () => {
        this.state = "suspended";
      });
      createGain() {
        return { gain: { value: 1 }, connect() {} };
      }
      constructor() {
        context = this;
      }
    };
    jest.isolateModules(() => {
      audio = jest.requireActual("./resumable");
    });
  });

  afterEach(() => {
    window.AudioContext = original;
  });

  it("resumes a suspended context directly during the user gesture", async () => {
    const resumed = audio.ensureAudio();

    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.suspend).not.toHaveBeenCalled();
    await resumed;
    expect(audio.isPlaying()).toBe(true);
  });

  it("recovers interrupted audio after repeatedly switching tabs or locking the phone", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      context.state = "interrupted";
      expect(audio.isPlaying()).toBe(false);

      await audio.ensureAudio();

      expect(context.suspend).toHaveBeenCalledTimes(attempt + 1);
      expect(context.resume).toHaveBeenCalledTimes(attempt + 1);
      expect(audio.isPlaying()).toBe(true);
    }
  });

  it("keeps the Sound FX setting and preview activity gate during recovery", async () => {
    audio.muteAudio();
    audio.setAudioActive(false);
    context.state = "interrupted";

    await audio.ensureAudio();

    expect(context.state).toBe("running");
    expect(audio.isPlaying()).toBe(false);
    audio.unmuteAudio();
    expect(audio.isPlaying()).toBe(false);
    audio.setAudioActive(true);
    expect(audio.isPlaying()).toBe(true);
  });

  it("leaves running audio alone", async () => {
    context.state = "running";

    await audio.ensureAudio();

    expect(context.resume).not.toHaveBeenCalled();
    expect(context.suspend).not.toHaveBeenCalled();
  });
});
