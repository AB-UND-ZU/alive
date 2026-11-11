import { Params } from "jsfxr";
import { createSoundWorker } from "./createWorker";
import { synthesizeSound } from "./synthesis";

export const synthesizeSounds = async (pending: Params[]) => {
  let worker: Worker | undefined;
  try {
    const instance = createSoundWorker();
    worker = instance;
    if (instance) {
      return await new Promise<Float32Array[]>((resolve, reject) => {
        instance.onmessage = ({ data }) => resolve(data);
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
  return pending.map(synthesizeSound);
};
