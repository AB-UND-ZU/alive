import { Params } from "jsfxr";
import { synthesizeSound } from "./synthesis";

globalThis.onmessage = ({ data }: MessageEvent<Params[]>) => {
  const samples = data.map(synthesizeSound);
  globalThis.postMessage(samples, {
    transfer: samples.map((sound) => sound.buffer),
  });
};
