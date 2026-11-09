import { act, renderHook } from "@testing-library/react";
import { calculateDimensions, useResizeListener } from "./sizing";

describe("terminal cell sizing", () => {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  afterAll(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalHeight,
    });
  });
  const viewport = (width: number, height: number) => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: height,
    });
  };
  it("preserves the normal game grid without preview options", () => {
    viewport(378, 640);
    const dimensions = calculateDimensions();
    expect(dimensions.visibleColumns).toBe(21);
    expect(dimensions.cellHeight).toBe(32);
    expect(dimensions.cellWidth).toBe(18);
    expect(dimensions.renderedRows).toBe(13);
    expect(dimensions.terminalHeight).toBeCloseTo(417.333333);
  });
  it("fits the preview grid in two-pixel font cells", () => {
    viewport(414, 704);
    const dimensions = calculateDimensions({
      visibleColumns: 23,
      visibleRows: 22,
    });
    expect(dimensions.visibleColumns).toBe(23);
    expect(dimensions.cellHeight).toBe(32);
    expect(dimensions.cellWidth).toBe(18);
    expect(dimensions.renderedRows).toBe(15);
    expect(dimensions.terminalHeight).toBeCloseTo(481.333333);
    expect(dimensions.terminalWidth).toBe(414);
  });
  it.each([
    [1214, 774, 2],
    [390, 670, 2],
    [1440, 1000, 3],
    [800, 600, 1],
  ])(
    "fits whole font pixels in a %i by %i viewport",
    (width, height, pixelSize) => {
      viewport(width, height);
      const dimensions = calculateDimensions();

      expect(dimensions.pixelSize).toBe(pixelSize);
      expect(dimensions.cellWidth).toBe(9 * pixelSize);
      expect(dimensions.cellHeight).toBe(16 * pixelSize);
      expect(dimensions.cellWidth * 21).toBeLessThanOrEqual(width);
      expect(dimensions.cellHeight * 20).toBeLessThanOrEqual(height);
    }
  );
  it.each([0, 1])(
    "retains a %i-row stat HUD on layout and browser resize",
    (topHudRows) => {
      viewport(414, (18 + topHudRows) * 32);
      const listener = jest.fn();
      const { unmount } = renderHook(() =>
        useResizeListener(listener, {
          visibleColumns: 23,
          visibleRows: 18 + topHudRows,
          topHudRows,
        })
      );
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ renderedRows: 15 })
      );
      act(() => window.dispatchEvent(new Event("resize")));
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ renderedRows: 15 })
      );
      expect(
        listener.mock.calls[listener.mock.calls.length - 1][0].terminalHeight
      ).toBeCloseTo(481.333333);
      unmount();
    }
  );
});

test("compact preview HUDs preserve the terminal grid when unused stat rows are removed", () => {
  const width = window.innerWidth,
    height = window.innerHeight;
  try {
    for (const topHudRows of [0, 1]) {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 414,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: (18 + topHudRows) * 32,
      });
      const dimensions = calculateDimensions({
        visibleColumns: 23,
        visibleRows: 18 + topHudRows,
        topHudRows,
      });
      expect(dimensions.cellWidth).toBe(18);
      expect(dimensions.cellHeight).toBe(32);
      expect(dimensions.renderedRows).toBe(15);
      expect(dimensions.terminalHeight).toBeCloseTo(481.333333);
    }
  } finally {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: height,
    });
  }
});
