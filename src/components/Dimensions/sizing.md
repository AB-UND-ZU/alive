# Cell Sizing

Calculates one dimensions object for React and CSS. A glyph is 9 by 16 source pixels. Each source pixel uses a whole number of CSS pixels. Choose the largest step that fits the target 21 columns and 20 rows, with a minimum scale of one. Cell width and height keep the font's 9 by 16 ratio.

| Values | Meaning |
| --- | --- |
| `cellWidth`, `cellHeight`, `pixelSize` | Glyph and source-pixel sizes in CSS pixels |
| `columns`, `rows`, `padding` | Viewport cells and centered HUD padding |
| `terminalWidth`, `terminalHeight` | Space left for the world after the HUD |
| `renderedColumns`, `renderedRows` | Visible cells plus overscan |

`calculateDimensions` and `DimensionsProvider` accept optional `visibleColumns`, `visibleRows` and `topHudRows` targets. Defaults remain 21 columns, 20 rows and four stat rows for the game. Wiki frames use 23 columns and remove unused stat rows while retaining fifteen world rows. `Dimensions` forwards the same options to its context and CSS-variable writer, including after browser resize.

`DimensionsProvider` updates the context after resize. `useResizeListener` also serves the CSS-variable writer.
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

## DimensionOptions

```ts src/components/Dimensions/sizing.tsx
export type DimensionOptions = {
  visibleColumns?: number;
  visibleRows?: number;
  topHudRows?: number;
};
```
