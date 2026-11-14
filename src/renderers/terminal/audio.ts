import { spawn, spawnSync } from "child_process";
import {
  AudioChannels,
  AudioOutput,
  setAudioOutput,
} from "../../game/sound/resumable";

export const createAudioMixer = (
  sampleRate = 44100,
  channels: AudioChannels = 1
) => {
  let cursor = 0;
  let voices: {
    samples: ArrayLike<number>;
    start: number;
    volume: number;
    channels: AudioChannels;
  }[] = [];
  return {
    now: () => cursor / sampleRate,
    play: (
      samples: ArrayLike<number>,
      rate: number,
      time: number,
      volume: number,
      sourceChannels: AudioChannels = 1
    ) => {
      if (rate !== sampleRate) return;
      voices.push({
        samples,
        start: Math.max(cursor, Math.round(time * rate)),
        volume,
        channels: sourceChannels,
      });
    },
    stop: () => {
      voices = [];
    },
    read: (length: number) => {
      const samples = new Float32Array(length * channels);
      for (const voice of voices) {
        const start = Math.max(cursor, voice.start);
        const end = Math.min(
          cursor + length,
          voice.start + Math.floor(voice.samples.length / voice.channels)
        );
        for (let i = start; i < end; i++)
          for (let channel = 0; channel < channels; channel++) {
            const offset = (i - voice.start) * voice.channels;
            const value =
              voice.channels === 1
                ? voice.samples[offset]
                : channels === 1
                ? (voice.samples[offset] + voice.samples[offset + 1]) / 2
                : voice.samples[offset + channel];
            samples[(i - cursor) * channels + channel] += value * voice.volume;
          }
      }
      cursor += length;
      voices = voices.filter(
        (voice) =>
          voice.start + Math.floor(voice.samples.length / voice.channels) >
          cursor
      );
      for (let i = 0; i < samples.length; i++)
        samples[i] = Math.max(-1, Math.min(1, samples[i]));
      return samples;
    },
  } satisfies AudioOutput & { read: (length: number) => Float32Array };
};

export const startTerminalAudio = (channels: AudioChannels = 1) => {
  const sampleRate = 44100;
  const blockFrames = 1024;
  const input = [
    "-f",
    "wav",
    "-ignore_length",
    "1",
    "-max_size",
    String(blockFrames * 4 * channels),
    "-blocksize",
    String(blockFrames * 4 * channels),
    "-probesize",
    "32",
    "-analyzeduration",
    "1",
    "-i",
    "pipe:0",
  ];
  const player = [
    ...(process.platform === "darwin"
      ? [
          {
            command: "ffmpeg",
            probe: "-devices",
            args: [
              "-nostdin",
              "-progress",
              "pipe:1",
              "-stats_period",
              "0.05",
              "-loglevel",
              "quiet",
              ...input,
              "-c:a",
              "pcm_f32le",
              "-f",
              "audiotoolbox",
              "-",
            ],
          },
        ]
      : []),
    {
      command: "ffplay",
      probe: "-version",
      args: ["-nodisp", "-autoexit", "-loglevel", "quiet", ...input],
    },
    {
      command: "aplay",
      probe: "--version",
      args: [
        "-q",
        "-t",
        "raw",
        "-f",
        "FLOAT_LE",
        "-r",
        "44100",
        "-c",
        String(channels),
      ],
    },
  ].find(({ command, probe }) => {
    const result = spawnSync(command, [probe], { encoding: "utf8" });
    return (
      result.status === 0 &&
      (command !== "ffmpeg" || result.stdout?.includes("audiotoolbox"))
    );
  });
  if (!player) return undefined;
  const child = spawn(player.command, player.args, {
    stdio: ["pipe", "pipe", "ignore"],
  });
  const mixer = createAudioMixer(sampleRate, channels);
  let started = performance.now();
  let ready = player.command !== "ffmpeg";
  let progress = "";
  child.stdout?.on("data", (chunk) => {
    if (ready) return;
    progress += chunk.toString();
    if (progress.includes("out_time_us=")) {
      started = performance.now();
      ready = true;
      progress = "";
    }
  });
  let frames = 0;
  setAudioOutput({
    ...mixer,
    play: (...args) => {
      if (ready) mixer.play(...args);
    },
  });
  const timer = setInterval(() => {
    if (!ready) return;
    // Keep a small lead and catch up after a delayed game frame.
    const target =
      Math.floor(((performance.now() - started) * sampleRate) / 1000) + 512;
    while (
      frames < target &&
      child.stdin.writableLength <= 4096 * 4 * channels
    ) {
      const length = Math.min(256, target - frames);
      const samples = mixer.read(length);
      frames += length;
      if (!child.stdin.write(Buffer.from(samples.buffer))) break;
    }
  }, 5);
  const close = () => {
    clearInterval(timer);
    setAudioOutput();
    child.stdin.destroy();
    child.kill();
  };
  child.on("error", close);
  child.on("exit", () => {
    clearInterval(timer);
    setAudioOutput();
  });
  child.stdin.on("error", close);
  if (player.command !== "aplay") {
    // Streaming IEEE float WAV bounds input packets without changing PCM samples.
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(0xffffffff, 4);
    header.write("WAVEfmt ", 8);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(3, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 4 * channels, 28);
    header.writeUInt16LE(4 * channels, 32);
    header.writeUInt16LE(32, 34);
    header.write("data", 36);
    header.writeUInt32LE(0xffffffff, 40);
    child.stdin.write(header);
  }
  if (!ready) child.stdin.write(Buffer.alloc(blockFrames * 4 * channels));
  return close;
};
