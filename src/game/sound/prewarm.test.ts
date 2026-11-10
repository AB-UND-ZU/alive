import { Params } from "jsfxr";
import { prewarmSounds } from "./prewarm";
import { createSoundWorker } from "./createWorker";

jest.mock("./createWorker", () => ({ createSoundWorker: jest.fn() }));

const createWorker = createSoundWorker as jest.Mock;

const setup = () => {
  const pending = [new Params(), new Params(), new Params()];
  const cached = new Map<Params, Float32Array>();
  const store = jest.fn((params: Params, samples: Float32Array) =>
    cached.set(params, samples)
  );
  return { pending, cached, store };
};

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

beforeEach(() => {
  jest.useFakeTimers();
  createWorker.mockReset();
});
afterEach(() => jest.useRealTimers());

it("warms one sound at a time, retains an urgently played sound, and releases the worker", () => {
  const worker = mockWorker();
  const { pending, cached, store } = setup();
  prewarmSounds(pending, (params) => cached.has(params), store);
  jest.runOnlyPendingTimers();
  expect(worker.postMessage).toHaveBeenCalledTimes(1);
  expect(worker.postMessage).toHaveBeenLastCalledWith(pending[0]);

  const urgent = new Float32Array([0.25]);
  cached.set(pending[0], urgent);
  worker.onmessage!.call(
    worker as unknown as Worker,
    new MessageEvent("message", { data: new Float32Array([0.5]) })
  );
  expect(cached.get(pending[0])).toBe(urgent);
  expect(worker.postMessage).toHaveBeenLastCalledWith(pending[1]);
  for (let i = 1; i < pending.length; i++) {
    const samples = new Float32Array([i / 4]);
    worker.onmessage!.call(
      worker as unknown as Worker,
      new MessageEvent("message", { data: samples })
    );
    expect(cached.get(pending[i])).toBe(samples);
  }
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(worker.onmessage).toBeNull();
  expect(store).toHaveBeenCalledTimes(2);
});

it.each(["unavailable", "blocked", "error", "messageerror", "clone"])(
  "warms every sound through the main-thread fallback when the worker is %s",
  (failure) => {
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
    const { pending, cached, store } = setup();
    prewarmSounds(pending, (params) => cached.has(params), store);
    jest.runOnlyPendingTimers();
    const event = { preventDefault: jest.fn() };
    if (failure === "error") {
      worker.onerror!.call(
        worker as unknown as Worker,
        event as unknown as ErrorEvent
      );
    }
    if (failure === "messageerror")
      worker.onmessageerror!.call(
        worker as unknown as Worker,
        new MessageEvent("messageerror")
      );
    expect(event.preventDefault).toHaveBeenCalledTimes(
      failure === "error" ? 1 : 0
    );
    jest.runAllTimers();
    expect([...cached.keys()]).toEqual(pending);
    expect(store).toHaveBeenCalledTimes(pending.length);
    for (const samples of cached.values())
      expect(samples.length).toBeGreaterThan(0);
    expect(worker.terminate).toHaveBeenCalledTimes(
      ["unavailable", "blocked"].includes(failure) ? 0 : 1
    );
  }
);
