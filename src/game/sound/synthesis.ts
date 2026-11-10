import { Params, SoundEffect } from "jsfxr";

const silence = 1 / 1000;

export const synthesizeSound = (params: Params) => {
  const samples = new SoundEffect(params).getRawBuffer().normalized;
  const peak = samples.reduce(
    (max, sample) => Math.max(max, Math.abs(sample)),
    0
  );
  let length = samples.length;
  while (length > 0 && Math.abs(samples[length - 1]) <= peak * silence) {
    length -= 1;
  }
  return new Float32Array(samples.slice(0, length));
};
