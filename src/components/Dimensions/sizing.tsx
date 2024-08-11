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
  columns: number;
  rows: number;
  leftOffset: number;
  topOffset: number;
  bottomOffset: number;
  terminalHeight: number;
  aspectRatio: number;
  renderedColumns: number;
  renderedRows: number;
  renderedDiagonal: number;
  mapSize: number;
};

const visibleColumns = 21;
const visibleRows = 19;
const aspectRatio = 18 / 32; // of DOS font
const extraOffset = 3; // to allow common mobile width of 375px to display 378px (18px * 21)
const hudRows = 6;
const overscanColumns = 4;
const overscanRows = 6;
const mapSize = 160;

const calculateDimensions: () => Dimensions = () => {
  const screenWidth = window.innerWidth + extraOffset;
  const screenHeight = window.innerHeight;
  const horizontalMinimum = Math.floor(
    screenWidth / visibleColumns / aspectRatio
  );
  const verticalMinimum = Math.floor(screenHeight / visibleRows);
  const cellHeight = Math.min(horizontalMinimum, verticalMinimum);
  const cellWidth = cellHeight * aspectRatio;
  const columns = Math.ceil(screenWidth / cellWidth);
  const rows = Math.ceil(screenHeight / cellHeight);
  const leftOffset = Math.ceil((screenWidth - columns * cellWidth) / 2);
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
    columns,
    rows,
    leftOffset,
    topOffset,
    bottomOffset,
    terminalHeight,
    aspectRatio,
    renderedColumns,
    renderedRows,
    renderedDiagonal,
    mapSize,
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
