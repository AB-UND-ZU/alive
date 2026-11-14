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
  const player = [
    {
      command: "ffplay",
      probe: "-version",
      args: [
        "-nodisp",
        "-autoexit",
        "-loglevel",
        "quiet",
        "-f",
        "f32le",
        "-ar",
        "44100",
        "-ch_layout",
        channels === 2 ? "stereo" : "mono",
        "-i",
        "pipe:0",
      ],
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
  ].find(
    ({ command, probe }) =>
      spawnSync(command, [probe], { stdio: "ignore" }).status === 0
  );
  if (!player) return undefined;
  const child = spawn(player.command, player.args, {
    stdio: ["pipe", "ignore", "ignore"],
  });
  const sampleRate = 44100;
  const mixer = createAudioMixer(sampleRate, channels);
  const started = performance.now();
  let frames = 0;
  setAudioOutput(mixer);
  const timer = setInterval(() => {
    // Keep a small lead and catch up after a delayed game frame.
    const target =
      Math.floor(((performance.now() - started) * sampleRate) / 1000) + 2048;
    while (
      frames < target &&
      child.stdin.writableLength <= 4096 * 4 * channels
    ) {
      const length = Math.min(1024, target - frames);
      const samples = mixer.read(length);
      frames += length;
      if (!child.stdin.write(Buffer.from(samples.buffer))) break;
    }
  }, 1024 / 44.1);
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
  return close;
};
