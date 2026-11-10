import { Params, SoundEffect } from "jsfxr";
import { seedRandom } from "../../testing/env";
import { synthesizeSound } from "./synthesis";

it.each([0, 1, 2, 3])(
  "preserves every stored PCM sample and tail boundary for waveform %s",
  (wave) => {
    const params = new Params();
    params.wave_type = wave;
    params.sample_rate = 22050;
    params.p_env_sustain = 0.2;
    params.p_env_decay = 0.3;
    seedRandom(73);
    const original = new SoundEffect(params).getRawBuffer().normalized;
    const peak = original.reduce(
      (max, sample) => Math.max(max, Math.abs(sample)),
      0
    );
    let length = original.length;
    while (length > 0 && Math.abs(original[length - 1]) <= peak / 1000)
      length--;
    seedRandom(73);
    expect(synthesizeSound(params)).toEqual(
      new Float32Array(original.slice(0, length))
    );
  }
);
