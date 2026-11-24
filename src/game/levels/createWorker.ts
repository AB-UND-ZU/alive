export const createLevelWorker = () =>
  new Worker(new URL("./generation.worker.ts", import.meta.url));
