# sizing

Calculates cell size, visible columns, overscan, terminal bounds, and HUD dimensions; provides the dimensions context.

```tsx
DimensionsProvider(props: React.PropsWithChildren)
```
<!-- source-types -->

## Dimensions

```ts src/components/Dimensions/sizing.tsx
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
