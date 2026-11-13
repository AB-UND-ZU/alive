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

const maxColumns = 32;
export const pixels = 16;
export const aspectRatio = 9 / 16; // of DOS font
const hudHeight = 8;
// const cutsceneHud = 14;
const overscanColumns = 1;
export const overscanRows = 1;

export type DimensionOptions = {
  visibleColumns?: number;
  visibleRows?: number;
  topHudRows?: number;
};

export const calculateDimensions = ({
  visibleColumns = 21,
  visibleRows = 20,
  topHudRows = hudHeight / 2,
}: DimensionOptions = {}): Dimensions => {
  const screenWidth =
    typeof window === "undefined" ? 80 * 9 : window.innerWidth;
  const screenHeight =
    typeof window === "undefined" ? 24 * 16 : window.innerHeight;
  const horizontalMinimum = Math.floor(
    screenWidth / visibleColumns / aspectRatio
  );
  const verticalMinimum = Math.floor(screenHeight / visibleRows);
  const cellHeight = Math.min(horizontalMinimum, verticalMinimum);
  const cellWidth = cellHeight * aspectRatio;
  const pixelSize = cellHeight / pixels;
  const columns = Math.ceil(screenWidth / cellWidth);
  const rows = Math.ceil(screenHeight / cellHeight);
  const padding = Math.max(
    0,
    Math.ceil(columns / 2) - (visibleColumns - 1) / 2 - (columns % 2)
  );
  const gap = screenWidth - columns * cellWidth;
  const leftOffset = gap / 2;
  const rightOffset = gap - leftOffset;
  const topOffset = cellHeight / -2;
  const bottomOffset = (cellHeight * -6.5) / 12;
  const terminalHeight =
    screenHeight -
    cellHeight * (topHudRows + hudHeight / 2) -
    topOffset -
    bottomOffset;
  const terminalWidth = Math.min(screenWidth, maxColumns * cellWidth);
  const renderedColumns = Math.min(columns, maxColumns) + overscanColumns;
  const renderedRows = rows - topHudRows - hudHeight / 2 + overscanRows;
  const renderedDiagonal = Math.sqrt(
    renderedColumns ** 2 * aspectRatio + renderedRows ** 2
  );
  const hudRows = hudHeight / 2;

  return {
    screenWidth,
    screenHeight,
    cellWidth,
    cellHeight,
    pixelSize,
    columns,
    visibleColumns,
    rows,
    padding,
    leftOffset,
    rightOffset,
    topOffset,
    bottomOffset,
    terminalHeight,
    terminalWidth,
    aspectRatio,
    renderedColumns,
    renderedRows,
    renderedDiagonal,
    hudRows,
  };
};

export const initialDimensions: Dimensions = calculateDimensions();
