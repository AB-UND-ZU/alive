/**
 * Process wide test environment state. Kept free of game imports so it can be
 * loaded from jest setup and module mocks without creating import cycles.
 */
import { createRng } from "../game/math/rng";

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
