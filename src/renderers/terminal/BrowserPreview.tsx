import {
  CSSProperties,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import Row from "../../components/Row";
import { codePage437 } from "../../game/assets/characters";
import { colors } from "../../game/assets/colors";
import { createText } from "../../game/assets/ui";
import { createFrameClock } from "../interface/clock";
import { useWorld } from "../interface/hooks";
import { RendererProps } from "../interface/types";
import { createTerminalInput } from "./input";
import { getTerminalFrame, getTerminalLayout } from "./screen";
import { terminalCharacter } from "./sprites";
import "./BrowserPreview.css";

const fontCharacters = new Map(
  codePage437.map((char) => [terminalCharacter(char), char])
);
const keyNames: Record<string, string> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  " ": "space",
  Enter: "return",
  Escape: "escape",
  Backspace: "backspace",
  Tab: "tab",
};

export default function BrowserPreview({
  world,
  columns,
  rows,
  cellWidth,
  cellHeight,
  paused,
}: RendererProps) {
  const { suspended, flipped } = useWorld();
  const [focused, setFocused] = useState(false);
  const [, render] = useReducer((value) => value + 1, 0);
  const clock = useMemo(() => createFrameClock(world), [world]);
  const input = useMemo(
    () =>
      createTerminalInput(world, (url) => {
        window.open(url, "_blank");
      }),
    [world]
  );
  const state = useMemo(() => ({ world, stickyCastables: {} }), [world]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const layout = getTerminalLayout(columns, rows);
  const dimensions = {
    ...world.metadata.dimensions,
    columns: layout.width,
    visibleColumns: layout.width,
    renderedColumns: layout.width,
    rows,
    renderedRows: layout.height,
    hudRows: 4,
    padding: 0,
    screenWidth: columns * cellWidth,
    screenHeight: rows * cellHeight,
    cellWidth,
    cellHeight,
    pixelSize: cellHeight / 16,
    terminalWidth: layout.width * cellWidth,
    terminalHeight: layout.height * cellHeight,
    renderedDiagonal: Math.sqrt(
      layout.width ** 2 * (cellWidth / cellHeight) + layout.height ** 2
    ),
  };
  const dimensionsRef = useRef(dimensions);
  dimensionsRef.current = dimensions;
  world.metadata.dimensions = dimensions;

  useEffect(() => {
    if (paused) {
      input.stop();
      clock.reset();
    }
  }, [paused, input, clock]);
  useEffect(() => {
    let frame: number;
    let previous = performance.now();
    const update = (time: number) => {
      world.metadata.dimensions = dimensionsRef.current;
      if (!pausedRef.current) {
        clock.advance(time - previous);
        render();
      } else clock.reset();
      previous = time;
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      input.stop();
    };
  }, [world, clock, input]);
  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      if (pausedRef.current || event.isComposing) return;
      world.metadata.dimensions = dimensionsRef.current;
      input.press({
        name: keyNames[event.key] || event.key.toLowerCase(),
        sequence: event.key.length === 1 ? event.key : undefined,
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
      });
    };
    const focus = () => setFocused(true);
    const stop = () => {
      input.stop();
      setFocused(false);
    };
    window.addEventListener("keydown", press);
    window.addEventListener("blur", stop);
    window.addEventListener("focus", focus);
    return () => {
      input.stop();
      window.removeEventListener("keydown", press);
      window.removeEventListener("blur", stop);
      window.removeEventListener("focus", focus);
    };
  }, [world, input]);

  const frame = getTerminalFrame(world, columns, rows, state, {
    suspended,
    flipped,
  });
  return (
    <div
      className="TerminalBrowserPreview"
      role="group"
      aria-label="Terminal renderer"
      data-renderer="terminal"
      style={
        {
          "--cell-width": `${cellWidth}px`,
          "--cell-height": `${cellHeight}px`,
          "--pixel-size": `${cellHeight / 16}px`,
        } as CSSProperties
      }
    >
      {frame.map((row, y) => (
        <Row
          key={y}
          cells={row.flatMap((cell, x) => {
            const edge =
              y === 3 ||
              y === rows - 4 ||
              ((x === layout.left || x === layout.left + layout.width - 1) &&
                y >= layout.top &&
                y < layout.top + layout.height) ||
              (layout.top > 4 &&
                (y === layout.top - 1 || y === layout.top + layout.height) &&
                x >= layout.left &&
                x < layout.left + layout.width);
            return createText(
              fontCharacters.get(cell.char) || cell.char,
              focused && edge ? colors.lime : cell.foreground,
              cell.background === colors.black ? undefined : cell.background
            );
          })}
        />
      ))}
    </div>
  );
}
