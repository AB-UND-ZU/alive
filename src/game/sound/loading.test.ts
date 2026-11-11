import { Params } from "jsfxr";
import { synthesizeSounds } from "./loading";
import { createSoundWorker } from "./createWorker";

jest.mock("./createWorker", () => ({ createSoundWorker: jest.fn() }));
const createWorker = createSoundWorker as jest.Mock;

const mockWorker = () => {
  const worker = {
    onmessage: null as Worker["onmessage"],
    onerror: null as Worker["onerror"],
    onmessageerror: null as Worker["onmessageerror"],
    postMessage: jest.fn(),
    terminate: jest.fn(),
  };
  createWorker.mockReturnValue(worker);
  return worker;
};

beforeEach(() => createWorker.mockReset());

it("loads the complete catalog in one batch and releases the worker before completing", async () => {
  const worker = mockWorker();
  const pending = [new Params(), new Params()];
  const result = synthesizeSounds(pending);
  expect(worker.postMessage).toHaveBeenCalledTimes(1);
  expect(worker.postMessage).toHaveBeenCalledWith(pending);
  const samples = [new Float32Array([0.25]), new Float32Array([0.5])];
  worker.onmessage!.call(
    worker as unknown as Worker,
    new MessageEvent("message", { data: samples })
  );
  await expect(result).resolves.toBe(samples);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
});

it.each(["unavailable", "blocked", "error", "messageerror", "clone"])(
  "finishes loading every sound when the worker is %s",
  async (failure) => {
    const worker = mockWorker();
    if (failure === "unavailable") createWorker.mockReturnValue(undefined);
    if (failure === "blocked")
      createWorker.mockImplementation(() => {
        throw new Error("Blocked");
      });
    if (failure === "clone")
      worker.postMessage.mockImplementationOnce(() => {
        throw new Error("Clone failed");
      });
    const pending = [new Params(), new Params(), new Params()];
    const result = synthesizeSounds(pending);
    const event = { preventDefault: jest.fn() };
    if (failure === "error")
      worker.onerror!.call(
        worker as unknown as Worker,
        event as unknown as ErrorEvent
      );
    if (failure === "messageerror")
      worker.onmessageerror!.call(
        worker as unknown as Worker,
        new MessageEvent("messageerror")
      );
    const samples = await result;
    expect(samples).toHaveLength(pending.length);
    samples.forEach((sound) => expect(sound.length).toBeGreaterThan(0));
    expect(worker.terminate).toHaveBeenCalledTimes(
      ["unavailable", "blocked"].includes(failure) ? 0 : 1
    );
    expect(event.preventDefault).toHaveBeenCalledTimes(
      failure === "error" ? 1 : 0
    );
  }
);
