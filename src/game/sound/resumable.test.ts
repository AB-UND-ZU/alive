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
    disconnect() {
      edges.delete(this);
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
      return { copyToChannel() {} };
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
        return { gain: { value: 1 }, connect() {}, disconnect() {} };
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

it("uses the injected native context clock, scheduling and gain gates", async () => {
  const original = window.AudioContext;
  (window as any).AudioContext = undefined;
  try {
    let audio: typeof import("./resumable");
    jest.isolateModules(() => {
      audio = jest.requireActual("./resumable");
    });
    const gains: {
      gain: { value: number };
      connect: jest.Mock;
      disconnect: jest.Mock;
    }[] = [];
    const starts: number[] = [];
    const context = {
      state: "running",
      currentTime: 2,
      destination: {},
      createGain: () => {
        const node = {
          gain: { value: 1 },
          connect: jest.fn(),
          disconnect: jest.fn(),
        };
        gains.push(node);
        return node;
      },
      createBuffer: () => ({ copyToChannel: jest.fn() }),
      createBufferSource: () => ({
        connect: jest.fn(),
        start: (time: number) => starts.push(time),
      }),
      suspend: jest.fn(async () => {
        context.state = "suspended";
      }),
      resume: jest.fn(async () => {
        context.state = "running";
      }),
    };
    audio!.setAudioContext(context as unknown as AudioContext);
    const sound = audio!.createSoundBuffer(new Float32Array([0.5, -0.5]), 44100);
    expect(audio!.isPlaying()).toBe(true);
    expect(audio!.getAudioTime(250)).toBe(2.25);
    sound.play(2.25, 0.5);
    expect(starts).toEqual([2.25]);
    expect(gains[2].gain.value).toBe(0.5);
    expect(gains[2].connect).toHaveBeenCalledWith(gains[0]);
    audio!.setAudioActive(false);
    expect(gains[1].gain.value).toBe(0);
    audio!.muteAudio();
    audio!.setAudioActive(true);
    expect(audio!.isPlaying()).toBe(false);
    expect(gains[0].gain.value).toBe(0);
    audio!.unmuteAudio();
    expect(audio!.isPlaying()).toBe(true);
    await audio!.suspendAudio();
    expect(audio!.isPlaying()).toBe(false);
    await audio!.ensureAudio();
    expect(audio!.isPlaying()).toBe(true);
    context.currentTime = 3;
    sound.play(2);
    expect(starts).toEqual([2.25, 3]);
    audio!.muteAudio();
    audio!.setAudioActive(false);
    audio!.setAudioContext({ ...context } as unknown as AudioContext);
    const playsBeforeReplacement = starts.length;
    sound.play(4);
    expect(starts).toHaveLength(playsBeforeReplacement);
    expect(gains[0].disconnect).toHaveBeenCalledTimes(1);
    expect(gains[1].disconnect).toHaveBeenCalledTimes(1);
    expect(gains[4].gain.value).toBe(0);
    expect(gains[5].gain.value).toBe(0);
    audio!.setAudioContext();
    expect(gains[4].disconnect).toHaveBeenCalledTimes(1);
    expect(audio!.isPlaying()).toBe(false);
    const previous = starts.length;
    sound.play(4);
    expect(starts).toHaveLength(previous);
  } finally {
    window.AudioContext = original;
  }
});

it("deinterleaves stereo PCM into browser audio channels", () => {
  const original = window.AudioContext;
  const channels = [new Float32Array(2), new Float32Array(2)];
  const createBuffer = jest.fn(() => ({
    copyToChannel: (samples: Float32Array, channel: number) =>
      channels[channel].set(samples),
  }));
  (window as any).AudioContext = class {
    destination = {};
    createGain = () => ({ gain: { value: 1 }, connect() {} });
    createBuffer = createBuffer;
  };
  try {
    jest.isolateModules(() => {
      const audio =
        jest.requireActual<typeof import("./resumable")>("./resumable");
      audio.createSoundBuffer([0.25, 0.75, 0.5, -0.5], 44100, 2);
    });
    expect(createBuffer).toHaveBeenCalledWith(2, 2, 44100);
    expect([...channels[0]]).toEqual([0.25, 0.5]);
    expect([...channels[1]]).toEqual([0.75, -0.5]);
  } finally {
    window.AudioContext = original;
  }
});

it("copies a mono Float32Array directly without cloning it", () => {
  jest.isolateModules(() => {
    const audio = jest.requireActual<typeof import("./resumable")>("./resumable");
    const copyToChannel = jest.fn();
    const context = {
      destination: {},
      createGain: () => ({ gain: { value: 1 }, connect() {}, disconnect() {} }),
      createBuffer: () => ({ copyToChannel }),
    };
    audio.setAudioContext(context as unknown as AudioContext);
    const samples = new Float32Array([0.25, -0.5]);
    audio.createSoundBuffer(samples, 44100);
    expect(copyToChannel).toHaveBeenCalledWith(samples, 0);
    expect(copyToChannel.mock.calls[0][0]).toBe(samples);
    audio.setAudioContext();
  });
});
