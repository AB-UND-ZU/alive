import {
  CSSProperties,
  Fragment,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { codePage437 } from "../../game/assets/characters";
import { colors } from "../../game/assets/colors";
import { createFrameClock } from "../interface/clock";
import { useWorld } from "../interface/hooks";
import { RendererProps } from "../interface/types";
import { createTerminalInput } from "./input";
import { getPauseActions, getTerminalFrame, getTerminalLayout } from "./screen";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { ensureAudio } from "../../game/sound/resumable";
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
  interactiveSession = false,
}: RendererProps & { interactiveSession?: boolean }) {
  const context = useWorld();
  const { suspended, flipped } = context;
  const contextRef = useRef(context);
  contextRef.current = context;
  const [pauseSelection, setPauseSelection] = useState(0);
  const selectionRef = useRef(pauseSelection);
  selectionRef.current = pauseSelection;
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
        const elapsed = world.metadata.elapsed;
        clock.advance(time - previous);
        if (world.metadata.elapsed !== elapsed) render();
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
      if (
        event.isComposing ||
        event.metaKey ||
        event.altKey ||
        (event.ctrlKey && event.key.toLowerCase() !== "s")
      )
        return;
      if (event.key in keyNames || event.key.length === 1)
        event.preventDefault();
      const session = contextRef.current;
      if (interactiveSession) {
        if (session.suspended) return;
        void ensureAudio();
        if (session.initial) {
          session.setInitial(false);
          session.setPaused(false);
          return;
        }
        if (session.paused) {
          const actions = getPauseActions(world);
          if (["Escape", " ", "r", "R"].includes(event.key)) {
            session.setPaused(false);
          } else if (["ArrowUp", "w", "W"].includes(event.key)) {
            setPauseSelection(
              (selection) => (selection + actions.length - 1) % actions.length
            );
          } else if (
            ["ArrowDown", "s", "S"].includes(event.key) &&
            !event.ctrlKey
          ) {
            setPauseSelection((selection) => (selection + 1) % actions.length);
          } else if (event.ctrlKey && event.key.toLowerCase() === "s") {
            session.saveGame();
          } else if (event.key === "Enter") {
            const action = actions[selectionRef.current];
            if (!action.disabled) {
              if (action.name === "RESUME") session.setPaused(false);
              else if (action.name === "SAVE") session.saveGame();
              else session.openMenu();
            }
          }
          return;
        }
        const hero = world.getEntities([PLAYER])[0];
        const popup =
          hero && world.getEntityByIdAndComponents(hero[PLAYER].popup, [POPUP]);
        if (event.key === "Escape" && !popup?.[POPUP].active) {
          input.stop();
          setPauseSelection(0);
          session.setPaused(true);
          return;
        }
      }
      if (pausedRef.current) return;
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
      if (interactiveSession) contextRef.current.setPaused(true);
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("keydown", press);
    window.addEventListener("blur", stop);
    window.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", focus);
    return () => {
      input.stop();
      window.removeEventListener("keydown", press);
      window.removeEventListener("blur", stop);
      window.removeEventListener("pagehide", stop);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", focus);
    };
  }, [world, input, interactiveSession]);

  const frame = getTerminalFrame(world, columns, rows, state, {
    suspended,
    flipped,
    ...(interactiveSession
      ? {
          paused: context.paused,
          selection: pauseSelection,
          saveName: context.saveStatus?.name,
          failed: context.saveStatus?.failed,
        }
      : {}),
  });
  return (
    <pre
      className="TerminalBrowserPreview"
      role="group"
      aria-label="Terminal renderer"
      data-renderer="terminal"
      style={
        {
          "--cell-width": `${cellWidth}px`,
          "--cell-height": `${cellHeight}px`,
        } as CSSProperties
      }
    >
      {frame.map((row, y) => {
        const runs: { text: string; color: string; background: string }[] = [];
        for (let x = 0; x < row.length; x++) {
          const cell = row[x];
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
          const color =
            !interactiveSession && focused && edge
              ? colors.lime
              : cell.foreground;
          const background = cell.background || colors.black;
          const char = fontCharacters.get(cell.char) || cell.char;
          const previous = runs[runs.length - 1];
          if (previous?.color === color && previous.background === background)
            previous.text += char;
          else runs.push({ text: char, color, background });
        }
        return (
          <Fragment key={y}>
            {runs.map((run, index) => (
              <span
                key={index}
                style={{ color: run.color, backgroundColor: run.background }}
              >
                {run.text}
              </span>
            ))}
            {y < frame.length - 1 ? "\n" : null}
          </Fragment>
        );
      })}
    </pre>
  );
}
