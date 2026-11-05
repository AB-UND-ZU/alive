/**
 * Process wide test environment state. Kept free of game imports so it can be
 * loaded from jest setup and module mocks without creating import cycles.
 */

// mulberry32: tiny, fast and good enough for reproducible game randomness
export const createRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const nativeRandom = Math.random;

/** Replace Math.random with a seeded generator for the current test. */
export const seedRandom = (seed: number) => {
  Math.random = createRng(seed);
};

export const restoreRandom = () => {
  Math.random = nativeRandom;
};

/** Names of sounds passed to `play()` since the start of the current test. */
export const playedSounds: unknown[] = [];

export const resetPlayedSounds = () => {
  playedSounds.length = 0;
};
