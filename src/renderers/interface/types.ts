import type { World } from "../../engine";

export type RendererProps = {
  world: World;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  paused: boolean;
  shadows?: boolean;
};

export type RendererCapabilities = {
  lighting: boolean;
  shadows: boolean;
  healthBars: boolean;
  stackDots: boolean;
  smoothMovement: boolean;
};
