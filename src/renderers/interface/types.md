# Renderer contract

`RendererProps` supplies a world, viewport dimensions, cell dimensions and paused state. The browser keeps the same controls and surrounding terminal UI when switching the world renderer.

`RendererCapabilities` records support for lighting, shadows, health bars, stack dots and smooth movement. Fog visibility belongs to the engine and applies to every renderer.
<!-- source-types -->

## RendererProps

```ts src/renderers/interface/types.ts
export type RendererProps = {
  world: World;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  paused: boolean;
  shadows?: boolean;
};
```

## RendererCapabilities

```ts src/renderers/interface/types.ts
export type RendererCapabilities = {
  lighting: boolean;
  shadows: boolean;
  healthBars: boolean;
  stackDots: boolean;
  smoothMovement: boolean;
};
```
