import { createLevelWorker } from "./createWorker";
import type { Sprite } from "../../engine/components/sprite";
import type { WorldSnapshot } from "../../engine/snapshot";
import { TEST_MODE } from "../../engine/utils";
import { getSaveSummaries } from "../saves";
import type { GenerationMessage, GenerationRequest } from "./generation";

export const loadLevel = (
  request: GenerationRequest,
  report: (line: Sprite[]) => void,
  signal: AbortSignal
) =>
  new Promise<WorldSnapshot>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const worker = createLevelWorker();
    const close = () => {
      worker.terminate();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      close();
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort);
    worker.onmessage = ({ data }: MessageEvent<GenerationMessage>) => {
      if ("line" in data) report(data.line);
      else {
        close();
        resolve(data.snapshot);
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      close();
      reject(new Error(event.message));
    };
    worker.onmessageerror = () => {
      close();
      reject(new Error("Invalid level snapshot"));
    };
    try {
      worker.postMessage({
        request,
        testMode: TEST_MODE,
        saves: request.level === "LEVEL_MENU" ? getSaveSummaries() : [],
      });
    } catch (error) {
      close();
      reject(error);
    }
  });
