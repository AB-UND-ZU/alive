import { createLevelWorker } from "./createWorker";
import { loadLevel } from "./worker";

jest.mock("./createWorker", () => ({ createLevelWorker: jest.fn() }));

const start = () => {
  const worker = {
    postMessage: jest.fn(),
    terminate: jest.fn(),
    onerror: (_event: ErrorEvent) => {},
  };
  (createLevelWorker as jest.Mock).mockReturnValue(worker);
  const controller = new AbortController();
  const loading = loadLevel({ level: "LEVEL_MENU" }, jest.fn(), controller.signal);
  return { worker, controller, loading };
};

it("stops generation when the requesting session closes", async () => {
  const { worker, controller, loading } = start();
  controller.abort();
  await expect(loading).rejects.toBe(controller.signal.reason);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
});

it("releases a failed generator and reports its error to the session", async () => {
  const { worker, loading } = start();
  worker.onerror(new ErrorEvent("error", { message: "Generation failed" }));
  await expect(loading).rejects.toThrow("Generation failed");
  expect(worker.terminate).toHaveBeenCalledTimes(1);
});
