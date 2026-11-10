export const createSoundWorker = () =>
  typeof Worker === "undefined"
    ? undefined
    : new Worker(new URL("./synthesis.worker.ts", import.meta.url));
