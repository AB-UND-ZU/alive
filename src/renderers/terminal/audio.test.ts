import { AudioContext } from "node-web-audio-api";
import { setAudioContext } from "../../game/sound/resumable";
import { startTerminalAudio } from "./audio";

jest.mock("node-web-audio-api", () => ({ AudioContext: jest.fn() }));
jest.mock("../../game/sound/resumable", () => ({ setAudioContext: jest.fn() }));

const NativeAudioContext = AudioContext as jest.MockedClass<
  typeof AudioContext
>;
let close: ReturnType<typeof startTerminalAudio>;
let context: { close: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  context = { close: jest.fn().mockResolvedValue(undefined) };
  NativeAudioContext.mockImplementation(
    () => context as unknown as AudioContext
  );
});

afterEach(() => close?.());

it("connects terminal sounds to an interactive native Web Audio context", () => {
  close = startTerminalAudio();
  expect(NativeAudioContext).toHaveBeenCalledWith({
    sampleRate: 44100,
    latencyHint: "interactive",
  });
  expect(setAudioContext).toHaveBeenCalledWith(context);
});

it("releases the audio device once when the terminal closes", () => {
  close = startTerminalAudio();
  close?.();
  close?.();
  expect(context.close).toHaveBeenCalledTimes(1);
  expect(setAudioContext).toHaveBeenLastCalledWith();
});

it("reports an unavailable sound device and leaves the game usable", () => {
  NativeAudioContext.mockImplementation(() => {
    throw new Error("No output device");
  });
  const stderr = jest
    .spyOn(process.stderr, "write")
    .mockImplementation(() => true);
  try {
    close = startTerminalAudio();
    expect(close).toBeUndefined();
    expect(setAudioContext).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledWith(
      "Sound unavailable: No output device\n"
    );
  } finally {
    stderr.mockRestore();
  }
});
