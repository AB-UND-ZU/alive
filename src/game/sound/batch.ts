import { Params } from "jsfxr";
import { synthesizeSound } from "./synthesis";

// Synthesis runs in a worker when available. Only the main-thread fallback
// needs to yield between batches so the browser can paint progress.
export const synthesizeBatch = async (
  params: Params[],
  report?: (current: number) => void,
  yieldToUI = false
) => {
  const samples: Float32Array[] = [];
  let nextUpdate = performance.now() + 32;
  for (const sound of params) {
    samples.push(synthesizeSound(sound));
    if (report && performance.now() >= nextUpdate) {
      report(samples.length);
      if (yieldToUI) await new Promise((resolve) => setTimeout(resolve, 0));
      nextUpdate = performance.now() + 32;
    }
  }
  return samples;
};
