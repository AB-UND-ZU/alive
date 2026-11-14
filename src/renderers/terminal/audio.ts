import { spawn, spawnSync } from "child_process";
import { AudioOutput, setAudioOutput } from "../../game/sound/resumable";

export const createAudioMixer = (sampleRate = 44100) => {
  let cursor = 0;
  let voices: {
    samples: ArrayLike<number>;
    start: number;
    volume: number;
  }[] = [];
  return {
    now: () => cursor / sampleRate,
    play: (
      samples: ArrayLike<number>,
      rate: number,
      time: number,
      volume: number
    ) => {
      if (rate !== sampleRate) return;
      voices.push({
        samples,
        start: Math.max(cursor, Math.round(time * rate)),
        volume,
      });
    },
    stop: () => {
      voices = [];
    },
    read: (length: number) => {
      const samples = new Float32Array(length);
      for (const voice of voices) {
        const start = Math.max(cursor, voice.start);
        const end = Math.min(
          cursor + length,
          voice.start + voice.samples.length
        );
        for (let i = start; i < end; i++)
          samples[i - cursor] += voice.samples[i - voice.start] * voice.volume;
      }
      cursor += length;
      voices = voices.filter(
        (voice) => voice.start + voice.samples.length > cursor
      );
      for (let i = 0; i < length; i++)
        samples[i] = Math.max(-1, Math.min(1, samples[i]));
      return samples;
    },
  } satisfies AudioOutput & { read: (length: number) => Float32Array };
};

export const startTerminalAudio = () => {
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
        "mono",
        "-i",
        "pipe:0",
      ],
    },
    {
      command: "aplay",
      probe: "--version",
      args: ["-q", "-t", "raw", "-f", "FLOAT_LE", "-r", "44100", "-c", "1"],
    },
  ].find(
    ({ command, probe }) =>
      spawnSync(command, [probe], { stdio: "ignore" }).status === 0
  );
  if (!player) return undefined;
  const child = spawn(player.command, player.args, {
    stdio: ["pipe", "ignore", "ignore"],
  });
  const mixer = createAudioMixer();
  setAudioOutput(mixer);
  const timer = setInterval(() => {
    if (child.stdin.writableLength > 4096 * 4) return;
    const samples = mixer.read(1024);
    child.stdin.write(Buffer.from(samples.buffer));
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
