import { Params } from "jsfxr";
import { synthesizeSound } from "./synthesis";

globalThis.onmessage = ({ data }: MessageEvent<Params>) => {
  const samples = synthesizeSound(data);
  globalThis.postMessage(samples, { transfer: [samples.buffer] });
};
