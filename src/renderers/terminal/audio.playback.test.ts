import { EventEmitter } from "events";
import { spawn, spawnSync } from "child_process";
import { startTerminalAudio } from "./audio";
import {
  createSoundBuffer,
  getAudioTime,
  isPlaying,
  setAudioActive,
  setAudioOutput,
  unmuteAudio,
} from "../../game/sound/resumable";

jest.mock("child_process", () => ({ spawn: jest.fn(), spawnSync: jest.fn() }));

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockProbe = spawnSync as jest.MockedFunction<typeof spawnSync>;
let child: EventEmitter & {
  stdin: EventEmitter & {
    writableLength: number;
    write: jest.Mock;
    destroy: jest.Mock;
  };
  stdout: EventEmitter;
  kill: jest.Mock;
};
let close: ReturnType<typeof startTerminalAudio>;
const platform = process.platform;
const pcm = () =>
  child.stdin.write.mock.calls.filter(
    ([chunk]) => chunk.toString("ascii", 0, 4) !== "RIFF"
  );
const samples = (index = 0) => {
  const chunk = pcm()[index][0] as Buffer;
  return new Float32Array(chunk.buffer, chunk.byteOffset, chunk.byteLength / 4);
};

beforeEach(() => {
  Object.defineProperty(process, "platform", { value: "linux" });
  jest.useFakeTimers();
  jest.clearAllMocks();
  setAudioOutput();
  setAudioActive(true);
  unmuteAudio();
  child = Object.assign(new EventEmitter(), {
    stdin: Object.assign(new EventEmitter(), {
      writableLength: 0,
      write: jest.fn().mockReturnValue(true),
      destroy: jest.fn(),
    }),
    stdout: new EventEmitter(),
    kill: jest.fn(),
  });
  mockProbe.mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);
  mockSpawn.mockReturnValue(child as unknown as ReturnType<typeof spawn>);
});

afterEach(() => {
  close?.();
  close = undefined;
  setAudioOutput();
  jest.useRealTimers();
  Object.defineProperty(process, "platform", { value: platform });
});

it("streams overlapping game sounds to one mono PCM player", () => {
  close = startTerminalAudio();
  const first = createSoundBuffer([0.2, 0.4], 44100);
  const second = createSoundBuffer([0.4, -0.2], 44100);
  first.play(getAudioTime());
  second.play(getAudioTime(), 0.5);
  jest.advanceTimersByTime(24);

  expect(mockSpawn).toHaveBeenCalledTimes(1);
  expect(mockSpawn).toHaveBeenCalledWith(
    "ffplay",
    expect.arrayContaining([
      "wav",
      "-max_size",
      "4096",
      "-blocksize",
      "-ignore_length",
      "pipe:0",
    ]),
    { stdio: ["pipe", "pipe", "ignore"] }
  );
  expect(pcm().length).toBeGreaterThan(1);
  const header = child.stdin.write.mock.calls[0][0] as Buffer;
  expect(header.toString("ascii", 0, 4)).toBe("RIFF");
  expect(header.toString("ascii", 8, 16)).toBe("WAVEfmt ");
  expect(header.readUInt16LE(20)).toBe(3);
  expect(header.readUInt16LE(22)).toBe(1);
  expect(header.readUInt32LE(24)).toBe(44100);
  expect(header.readUInt32LE(28)).toBe(44100 * 4);
  expect(header.readUInt16LE(32)).toBe(4);
  expect(header.readUInt16LE(34)).toBe(32);
  expect(header.toString("ascii", 36, 40)).toBe("data");
  expect(header.readUInt32LE(40)).toBe(0xffffffff);
  expect(samples()).toHaveLength(256);
  expect(samples()[0]).toBeCloseTo(0.4);
  expect(samples()[1]).toBeCloseTo(0.3);
  expect(samples()[2]).toBe(0);
});

it("clears playing and scheduled sounds on pause without starting another player", () => {
  close = startTerminalAudio();
  const sound = createSoundBuffer(new Float32Array(4096).fill(0.5), 44100);
  sound.play(getAudioTime());
  sound.play(getAudioTime(1000));
  setAudioActive(false);
  jest.advanceTimersByTime(48);
  expect(pcm().length).toBeGreaterThan(1);
  for (let index = 0; index < pcm().length; index++)
    expect([...samples(index)].every((value) => value === 0)).toBe(true);
  const written = pcm().length;

  setAudioActive(true);
  createSoundBuffer([0.25], 44100).play(getAudioTime());
  jest.advanceTimersByTime(24);
  expect(samples(written)[0]).toBe(0.25);
  expect(mockSpawn).toHaveBeenCalledTimes(1);
});

it("closing audio stops its player, clock and queued output", () => {
  close = startTerminalAudio();
  expect(isPlaying()).toBe(true);
  expect(jest.getTimerCount()).toBe(1);
  close?.();
  close = undefined;
  jest.advanceTimersByTime(1000);

  expect(child.stdin.destroy).toHaveBeenCalledTimes(1);
  expect(child.kill).toHaveBeenCalledTimes(1);
  expect(pcm()).toHaveLength(0);
  expect(jest.getTimerCount()).toBe(0);
  expect(isPlaying()).toBe(false);
});

it("stops writing and detaches audio if the player exits or its pipe fails", () => {
  close = startTerminalAudio();
  child.stdin.emit("error", new Error("closed pipe"));
  child.emit("exit", 1);
  close = undefined;
  jest.advanceTimersByTime(1000);

  expect(child.kill).toHaveBeenCalledTimes(1);
  expect(child.stdin.destroy).toHaveBeenCalledTimes(1);
  expect(pcm()).toHaveLength(0);
  expect(jest.getTimerCount()).toBe(0);
  expect(isPlaying()).toBe(false);
});

it("falls back to an available ALSA player", () => {
  mockProbe
    .mockReturnValueOnce({ status: null } as ReturnType<typeof spawnSync>)
    .mockReturnValueOnce({ status: 0 } as ReturnType<typeof spawnSync>);
  close = startTerminalAudio();
  expect(mockSpawn).toHaveBeenCalledWith(
    "aplay",
    expect.arrayContaining(["FLOAT_LE", "44100"]),
    { stdio: ["pipe", "pipe", "ignore"] }
  );
});

it("runs silently without starting a timer when no system player is installed", () => {
  mockProbe.mockReturnValue({
    status: null,
    error: new Error("ENOENT"),
  } as ReturnType<typeof spawnSync>);
  close = startTerminalAudio();
  expect(close).toBeUndefined();
  expect(mockProbe).toHaveBeenCalledTimes(2);
  expect(mockSpawn).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
  expect(isPlaying()).toBe(false);
});

it("catches up after delayed callbacks instead of slowing its PCM clock", () => {
  close = startTerminalAudio();
  const now = jest.spyOn(performance, "now").mockReturnValue(1000);
  try {
    jest.advanceTimersByTime(24);
    const frames = pcm().reduce((sum, [chunk]) => sum + chunk.length / 4, 0);
    expect(frames).toBe(44100 + 512);
    expect(getAudioTime()).toBe(frames / 44100);
    const written = pcm().length;
    createSoundBuffer([0.75], 44100).play(getAudioTime());
    now.mockReturnValue(1024);
    jest.advanceTimersByTime(24);
    expect(samples(written)[0]).toBe(0.75);
    expect(pcm().reduce((sum, [chunk]) => sum + chunk.length / 4, 0)).toBe(
      Math.floor(1.024 * 44100) + 512
    );
  } finally {
    now.mockRestore();
  }
});

it("respects pipe backpressure and resumes without losing subsequent sounds", () => {
  close = startTerminalAudio();
  child.stdin.writableLength = 4096 * 4 + 1;
  jest.advanceTimersByTime(1000);
  expect(pcm()).toHaveLength(0);
  child.stdin.writableLength = 0;
  child.stdin.write.mockReturnValueOnce(false);
  createSoundBuffer([0.5], 44100).play(getAudioTime());
  jest.advanceTimersByTime(5);
  expect(pcm()).toHaveLength(1);
  expect(samples()[0]).toBe(0.5);
  jest.advanceTimersByTime(23);
  expect(pcm().length).toBeGreaterThan(1);
});

it("streams stereo PCM with separate left and right channels", () => {
  close = startTerminalAudio(2);
  createSoundBuffer([0.25, 0.75, 0.5, -0.5], 44100, 2).play(getAudioTime());
  jest.advanceTimersByTime(24);
  expect(mockSpawn).toHaveBeenCalledWith(
    "ffplay",
    expect.arrayContaining(["wav", "-max_size", "8192"]),
    expect.anything()
  );
  const header = child.stdin.write.mock.calls[0][0] as Buffer;
  expect(header.readUInt16LE(22)).toBe(2);
  expect(header.readUInt32LE(28)).toBe(44100 * 8);
  expect(header.readUInt16LE(32)).toBe(8);
  expect([...samples().slice(0, 4)]).toEqual([0.25, 0.75, 0.5, -0.5]);
});

it("uses direct macOS audio output when FFmpeg supports AudioToolbox", () => {
  Object.defineProperty(process, "platform", { value: "darwin" });
  mockProbe.mockReturnValueOnce({
    status: 0,
    stdout: " E audiotoolbox AudioToolbox output device",
  } as ReturnType<typeof spawnSync>);
  close = startTerminalAudio();
  expect(mockProbe).toHaveBeenCalledWith("ffmpeg", ["-devices"], {
    encoding: "utf8",
  });
  expect(mockSpawn).toHaveBeenCalledWith(
    "ffmpeg",
    expect.arrayContaining([
      "wav",
      "-max_size",
      "4096",
      "-c:a",
      "pcm_f32le",
      "audiotoolbox",
    ]),
    expect.anything()
  );
});

it("keeps FFplay available on macOS without the native FFmpeg output", () => {
  Object.defineProperty(process, "platform", { value: "darwin" });
  mockProbe.mockReturnValueOnce({
    status: 0,
    stdout: "Devices without AudioToolbox",
  } as ReturnType<typeof spawnSync>);
  close = startTerminalAudio();
  expect(mockSpawn).toHaveBeenCalledWith(
    "ffplay",
    expect.anything(),
    expect.anything()
  );
});

it("bounds the queued PCM lead to keep new sounds close to the current frame", () => {
  close = startTerminalAudio();
  jest.advanceTimersByTime(1000);
  expect(getAudioTime() - 1).toBeCloseTo(512 / 44100, 4);
  const written = pcm().length;
  createSoundBuffer([0.5], 44100).play(getAudioTime());
  jest.advanceTimersByTime(5);
  expect(samples(written)[0]).toBe(0.5);
});

it("starts the audio clock only after the native device is ready", () => {
  Object.defineProperty(process, "platform", { value: "darwin" });
  mockProbe.mockReturnValueOnce({
    status: 0,
    stdout: " E audiotoolbox",
  } as ReturnType<typeof spawnSync>);
  close = startTerminalAudio();
  const sound = createSoundBuffer([0.25], 44100);
  sound.play(getAudioTime());
  jest.advanceTimersByTime(5000);
  expect(pcm()).toHaveLength(1);
  expect([...samples()].every((value) => value === 0)).toBe(true);
  expect(getAudioTime()).toBe(0);
  child.stdout.emit("data", Buffer.from("out_ti"));
  child.stdout.emit("data", Buffer.from("me_us=23220\n"));
  sound.play(getAudioTime());
  jest.advanceTimersByTime(5);
  expect(samples(1)[0]).toBe(0.25);
  expect(getAudioTime()).toBe((Math.floor(5 * 44.1) + 512) / 44100);
});
