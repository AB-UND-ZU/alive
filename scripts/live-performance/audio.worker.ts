import { SoundEffect } from "jsfxr";
self.onmessage = ({ data: params }) => {
  const samples = new SoundEffect(params).getRawBuffer().normalized;
  const peak = samples.reduce(
    (max: number, sample: number) => Math.max(max, Math.abs(sample)),
    0
  );
  let length = samples.length;
  while (length > 0 && Math.abs(samples[length - 1]) <= peak / 1000) length--;
  const buffer = new Float32Array(samples.slice(0, length));
  (self as unknown as Worker).postMessage(
    {
      samples: buffer,
      sampleRate: params.sample_rate,
      gain: Math.exp(params.sound_vol) - 1,
      key: JSON.stringify({ ...params, sound_vol: 0 }),
    },
    [buffer.buffer]
  );
};
