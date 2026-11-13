import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

import {
  calculateDimensions,
  Dimensions,
  DimensionOptions,
  initialDimensions,
} from "../../renderers/interface/dimensions";
export * from "../../renderers/interface/dimensions";

export const DimensionsContext = createContext<Dimensions>(initialDimensions);

export const useDimensions = () => useContext(DimensionsContext);

export function DimensionsProvider({
  options,
  children,
}: React.PropsWithChildren<{ options?: DimensionOptions }>) {
  const [dimensions, setDimensions] = useState(() =>
    calculateDimensions(options)
  );

  useResizeListener(setDimensions, options);

  return (
    <DimensionsContext.Provider value={dimensions}>
      {children}
    </DimensionsContext.Provider>
  );
}

export const useResizeListener = (
  listener: (dimensions: Dimensions) => void,
  options?: DimensionOptions
) => {
  const visibleColumns = options?.visibleColumns;
  const visibleRows = options?.visibleRows;
  const topHudRows = options?.topHudRows;
  const callback = useCallback(() => {
    const dimensions = calculateDimensions({
      visibleColumns,
      visibleRows,
      topHudRows,
    });

    listener(dimensions);
  }, [listener, visibleColumns, visibleRows, topHudRows]);

  // provide dimensions before first render and call listener initially
  useLayoutEffect(callback, [callback]);

  useEffect(() => {
    window.addEventListener("resize", callback);

    return () => window.removeEventListener("resize", callback);
  }, [callback]);
};
