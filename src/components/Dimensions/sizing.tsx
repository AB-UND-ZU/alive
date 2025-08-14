import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

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
  aspectRatio: number;
  renderedColumns: number;
  renderedRows: number;
  renderedDiagonal: number;
};

const visibleColumns = 21;
const visibleRows = 19;
export const pixels = 16;
export const aspectRatio = 9 / 16; // of DOS font
const extraOffset = 3; // to allow common mobile width of 375px to display 378px (18px * 21)
const hudRows = 8;
const overscanColumns = 4;
const overscanRows = 6;

const calculateDimensions: () => Dimensions = () => {
  const screenWidth = window.innerWidth + extraOffset;
  const screenHeight = window.innerHeight;
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
  const bottomOffset = cellHeight / -3;
  const terminalHeight =
    screenHeight - cellHeight * hudRows - topOffset - bottomOffset;
  const renderedColumns = columns + overscanColumns;
  const renderedRows = rows - hudRows + overscanRows;
  const renderedDiagonal = Math.sqrt(
    renderedColumns ** 2 * aspectRatio + renderedRows ** 2
  );

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
    aspectRatio,
    renderedColumns,
    renderedRows,
    renderedDiagonal,
  };
};

const initialDimensions: Dimensions = calculateDimensions();

export const DimensionsContext = createContext<Dimensions>(initialDimensions);

export const useDimensions = () => useContext(DimensionsContext);

export function DimensionsProvider(props: React.PropsWithChildren) {
  const [dimensions, setDimensions] = useState(initialDimensions);

  useResizeListener(setDimensions);

  return <DimensionsContext.Provider {...props} value={dimensions} />;
}

export const useResizeListener = (
  listener: (dimensions: Dimensions) => void
) => {
  const callback = useCallback(() => {
    const dimensions = calculateDimensions();
    listener(dimensions);
  }, [listener]);

  // provide dimensions before first render and call listener initially
  useLayoutEffect(callback, [callback]);

  useEffect(() => {
    window.addEventListener("resize", callback);

    return () => window.removeEventListener("resize", callback);
  }, [callback]);
};
