import { Params } from "jsfxr";
import { loadSoundCatalog } from "./catalog";

globalThis.onmessage = async ({ data }: MessageEvent<Params[]>) => {
  try {
    const samples = await loadSoundCatalog(data);
    globalThis.postMessage(samples, {
      transfer: Array.from(new Set(samples.map((sound) => sound.buffer))),
    });
  } catch {
    globalThis.postMessage(null);
  }
};
