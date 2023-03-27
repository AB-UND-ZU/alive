import { useEffect, useMemo, useReducer, useRef } from "react";
import Board from "../Board";
import Controls from "../Controls";
import Stats from "../Stats";
import { reducer } from "./state";
import { computeUnits } from "../../engine/units";
import { Center, center, defaultState, keyToOrientation, Orientation, TerminalState } from "../../engine/utils";

const TICK_INTERVAL = 500;
const SKIP_INTERVAL = 200;

const Terminal = ({
  score,
  setScore,
  gameOver,
  generateLevel,
  stats = true,
  controls = true,
  animation = true,
}: {
  score: number,
  setScore: React.Dispatch<React.SetStateAction<number>>,
  gameOver: () => void,
  generateLevel: (state: TerminalState) => TerminalState,
  stats?: boolean,
  controls?: boolean,
  animation?: boolean,
}) => {
  const [state, dispatch] = useReducer(reducer, defaultState, generateLevel);

  const [unitMap, unitList] = useMemo(() => computeUnits(state), [state]);
  const lastTick = useRef(0);
  const tickTimeout = useRef<NodeJS.Timeout>();
  const moved = useRef<[Orientation | Center, number]>([center, 0]);

  const nextTick = () => {
    const remaining = lastTick.current + SKIP_INTERVAL - Date.now();
    
    if (remaining > 0) return remaining;

    dispatch({ type: 'tick' });
    moved.current = [center, 0];
    lastTick.current = Date.now();
    clearTimeout(tickTimeout.current);
    tickTimeout.current = setTimeout(nextTick, TICK_INTERVAL);
    return 0;
  };

  useEffect(() => {
    const handleMove = (event: KeyboardEvent) => {
      const orientation = keyToOrientation[event.key];
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

      if (moved.current[0] === center || nextTick() === 0) {
        const remaining = lastTick.current + TICK_INTERVAL - Date.now();
        moved.current = [orientation, remaining];
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
    <pre className={`Terminal ${animation ? 'Animation' : ''} ${moved.current[0]}`}>
      {stats && <Stats state={state} />}
      <Board animation={animation} state={state} unitMap={unitMap} unitList={unitList} remaining={moved.current[1]} />
      {controls && <Controls state={state} />}
    </pre>
  );
}

export default Terminal;