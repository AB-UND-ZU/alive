import { Params } from "jsfxr";
import { createSoundWorker } from "./createWorker";
import { synthesizeBatch } from "./batch";

export const synthesizeSounds = async (
  pending: Params[],
  report?: (current: number) => void
) => {
  let worker: Worker | undefined;
  try {
    const instance = createSoundWorker();
    worker = instance;
    if (instance) {
      return await new Promise<Float32Array[]>((resolve, reject) => {
        instance.onmessage = ({ data }) => {
          if (typeof data === "number") report?.(data);
          else if (data) resolve(data);
          else reject();
        };
        instance.onerror = (event) => {
          event.preventDefault();
          reject();
        };
        instance.onmessageerror = reject;
        instance.postMessage(pending);
      });
    }
  } catch {
    // Unsupported or blocked workers use the same synthesis during loading.
  } finally {
    worker?.terminate();
  }
  return synthesizeBatch(pending, report, true);
};
