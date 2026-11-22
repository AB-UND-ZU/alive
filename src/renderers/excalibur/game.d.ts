import type { RendererProps } from "../interface/types";

export function startGame(
  canvas: HTMLCanvasElement,
  read: () => RendererProps & { suspended: boolean }
): () => void;
