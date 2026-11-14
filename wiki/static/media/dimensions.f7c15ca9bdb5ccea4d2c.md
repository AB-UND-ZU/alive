# Cell dimensions

`calculateDimensions` retains the game's 9:16 cell proportions and derives viewport, terminal and HUD dimensions. It has no React dependency. Browser calls use the window size; imports without a browser use a screen of 80 by 24 font cells.

The browser provider in `components/Dimensions/sizing.tsx` publishes these values and updates them when the window is resized. Renderers receive the resulting cell and viewport dimensions.
<!-- source-types -->

## Dimensions

```ts src/renderers/interface/dimensions.ts
export type Dimensions = {
  screenWidth: number;
  screenHeight: number;
  cellWidth: number;
  cellHeight: number;
  pixelSize: number;
  columns: number;
  visibleColumns: number;
  rows: number;
  padding: number;
  leftOffset: number;
  rightOffset: number;
  topOffset: number;
  bottomOffset: number;
  terminalHeight: number;
  terminalWidth: number;
  aspectRatio: number;
  renderedColumns: number;
  renderedRows: number;
  renderedDiagonal: number;
  hudRows: number;
};
```

## DimensionOptions

```ts src/renderers/interface/dimensions.ts
export type DimensionOptions = {
  visibleColumns?: number;
  visibleRows?: number;
  topHudRows?: number;
};
```
