import { useEffect, useMemo, useReducer, useRef } from "react";
import Board from "../Board";
import Controls from "../Controls";
import Stats from "../Stats";
import { reducer } from "./state";
import { computeUnits } from "../../engine/units";
import { defaultState, TerminalState } from "../../engine/utils";
import { useImmerReducer } from "use-immer";

const TICK_INTERVAL = 200;
const SKIP_INTERVAL = 50;

const Terminal = ({
  score,
  setScore,
  gameOver,
  generateLevel,
  stats = true,
  controls = true,
}: {
  score: number,
  setScore: React.Dispatch<React.SetStateAction<number>>,
  gameOver: () => void,
  generateLevel: (state: TerminalState) => TerminalState,
  stats?: boolean,
  controls?: boolean,
}) => {
  const [state, dispatch] = useImmerReducer(reducer, defaultState, generateLevel);

  const units = useMemo(() => computeUnits(state), [state]);
  const lastTick = useRef(0);
  const tickTimeout = useRef<NodeJS.Timeout>();
  const moved = useRef(false);

  const nextTick = () => {
    const remaining = lastTick.current + SKIP_INTERVAL - Date.now();
    
    if (remaining > 0) return remaining;

    dispatch({ type: 'tick' });
    moved.current = false;
    lastTick.current = Date.now();
    clearTimeout(tickTimeout.current);
    tickTimeout.current = setTimeout(nextTick, TICK_INTERVAL);
    return 0;
  };

  useEffect(() => {
    const handleMove = (event: KeyboardEvent) => {
      const processKey = (key: string) => {
        if (event.key === 'ArrowUp') {
          dispatch({ type: 'move', orientation: 'up' });
        } else if (event.key === 'ArrowRight') {
          dispatch({ type: 'move', orientation: 'right' });
        } else if (event.key === 'ArrowDown') {
          dispatch({ type: 'move', orientation: 'down' });
        } else if (event.key === 'ArrowLeft') {
          dispatch({ type: 'move', orientation: 'left' });
        } else if (event.key === ' ') {
          dispatch({ type: 'spell' });
        }
      };

      if (!moved.current || nextTick() === 0) {
        moved.current = true;
        processKey(event.key);
      }
    };

    window.addEventListener('keydown', handleMove);

    nextTick();
    dispatch({ type: 'move' });

    return () => {
      window.removeEventListener('keydown', handleMove);
    }
  }, []);

  return (
    <pre className="Terminal">
      {stats && <Stats state={state} />}
      <Board state={state} units={units} />
      {controls && <Controls state={state} />}
    </pre>
  );
}

export default Terminal;