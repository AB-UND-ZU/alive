export {};

declare global {
  interface Array<T> {
    findLastIndex(
      predicate: (value: T, index: number, obj: T[]) => unknown,
      thisArg?: any
    ): number;

    findLast(
      predicate: (value: T, index: number, obj: T[]) => unknown,
      thisArg?: any
    ): T | undefined;
  }

  interface Window {
    soundStub?: { played: string[]; loadCatalog?: boolean };
    webkitAudioContext?: typeof AudioContext;
  }
}
