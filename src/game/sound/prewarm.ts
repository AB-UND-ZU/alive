import { Params } from "jsfxr";
import { createSoundWorker } from "./createWorker";
import { synthesizeSound } from "./synthesis";

// Only speculative cache warming runs in the worker. A first-use sound can
// still be synthesized immediately by the playback path.
export const prewarmSounds = (
  pending: Params[],
  hasSound: (params: Params) => boolean,
  storeSound: (params: Params, samples: Float32Array) => void
) => {
  let worker: Worker | undefined;
  let index = 0;
  let current: Params | undefined;

  const stopWorker = () => {
    if (!worker) return;
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    worker.terminate();
    worker = undefined;
  };

  const fallback = () => {
    stopWorker();
    // Retry the in-flight entry too: a failed worker has not cached it.
    if (current) {
      index -= 1;
      current = undefined;
    }
    setTimeout(next);
  };

  const next = () => {
    while (index < pending.length && hasSound(pending[index])) index += 1;
    current = pending[index++];
    if (!current) {
      stopWorker();
      return;
    }

    if (worker) {
      try {
        worker.postMessage(current);
      } catch {
        fallback();
      }
    } else {
      storeSound(current, synthesizeSound(current));
      current = undefined;
      setTimeout(next);
    }
  };

  try {
    worker = createSoundWorker();
  } catch {
    // Workers can be unavailable or blocked by the hosting policy.
  }

  if (worker) {
    worker.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      if (current && !hasSound(current)) storeSound(current, data);
      current = undefined;
      next();
    };
    worker.onerror = (event) => {
      event.preventDefault();
      fallback();
    };
    worker.onmessageerror = fallback;
  }
  setTimeout(next);
};
