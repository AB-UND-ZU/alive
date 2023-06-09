import { useEffect, useMemo, useReducer, useRef } from "react";
import { disableBodyScroll } from 'body-scroll-lock';

import Board from "../Board";
import Controls from "../Controls";
import Stats from "../Stats";
import { reducer } from "./state";
import { computeUnits } from "../../engine/units";
import { defaultState, degreesToOrientation, keyToOrientation, Orientation, pointToDegree, TerminalState } from "../../engine/utils";

export const WORLD_INTERVAL = 350;
export const PLAYER_INTERVAL = 250;

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

  const units = useMemo(() => computeUnits(state), [state]);
  const lastTick = useRef<[number, NodeJS.Timeout]>();
  const lastMove = useRef<[number, NodeJS.Timeout]>();
  const queuedMove = useRef<Orientation | undefined>(undefined);
  const touchOrigin = useRef<[number, number] | undefined>(undefined);
  const pressedOrientations = useRef<Orientation[]>([]);
  const spellRef = useRef<HTMLDivElement>(null);
  const gameOverRef = useRef<boolean>(false);

  useEffect(() => {
    gameOverRef.current = state.hp <= 0;
  }, [state.hp]);

  const handleTick = () => {
    if (gameOverRef.current) return;

    if (lastTick.current) {
      clearTimeout(lastTick.current[1]);
    }

    dispatch({ type: 'tick' });
    lastTick.current = [
      Date.now(),
      setTimeout(handleTick, WORLD_INTERVAL),
    ];
  };

  const handleMove = (orientation: Orientation) => {
    if (gameOverRef.current) return;

    const now = Date.now();
    if (lastMove.current) {
      clearTimeout(lastMove.current[1]);
      queuedMove.current = orientation;
      const remaining = lastMove.current[0] + PLAYER_INTERVAL - now;

      lastMove.current = [
        now,
        setTimeout(() => {
          lastMove.current = undefined;
          queuedMove.current = undefined;
          handleMove(orientation);
        }, remaining),
      ];
      return;
    }

    dispatch({ type: 'queue', orientation });
    dispatch({ type: 'move', orientation });

    lastMove.current = [
      now,
      setTimeout(() => {
        lastMove.current = undefined;
        queuedMove.current = undefined;

        const nextOrientation = pressedOrientations.current[0];
        if (nextOrientation) {
          handleMove(nextOrientation);
        } else {
          dispatch({ type: 'queue', orientation: undefined });
        }
      }, PLAYER_INTERVAL)
    ];
  };

  const handleKeyMove = (event: KeyboardEvent) => {
    // since macOS doesn't fire keyup when meta key is pressed, prevent it from moving.
    // still not working: arrow keydown -> meta keydown -> arrow keyup -> meta keyup
    if (event.type === 'keydown' && (event.altKey || event.shiftKey || event.metaKey)) return;
    const orientation = keyToOrientation[event.key];
    const orientations = pressedOrientations.current;
    const lastOrientation = orientations[0];
    if (event.type === 'keyup') {
      if (orientation) orientations.splice(orientations.indexOf(orientation), 1);
      return;
    }
    if (event.repeat) return;

    if (orientation) {
      orientations.unshift(orientation);
      const nextOrientation = pressedOrientations.current[0];
      if (nextOrientation && nextOrientation !== lastOrientation) {
        handleMove(nextOrientation);
      }
    } else if (event.key === ' ') {
      dispatch({ type: 'spell' });
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      touchOrigin.current = undefined;
      pressedOrientations.current = [];
      return;
    }

    event.preventDefault();

    const [x, y] = [event.touches[0].clientX, event.touches[0].clientY];

    if (!touchOrigin.current) {
      touchOrigin.current = [x, y];
    }

    const [deltaX, deltaY] = [(x - touchOrigin.current[0]) , y - touchOrigin.current[1]];
    const degrees = pointToDegree([deltaX, deltaY]);
    let nextOrientation: Orientation | undefined = undefined;

    if (Math.sqrt(deltaX ** 2 + deltaY ** 2) <= 5) {
      if (event.touches[0].target === spellRef.current) {
        dispatch({ type: 'spell' });
        return;
      }
    } else {
      nextOrientation = degreesToOrientation(degrees);
    }

    const lastOrientation = pressedOrientations.current[0];

    if (nextOrientation) {
      pressedOrientations.current = [nextOrientation];
      if (nextOrientation!== lastOrientation) {
        handleMove(nextOrientation);
      }
    } else {
      pressedOrientations.current = [];
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyMove);
    window.addEventListener('keyup', handleKeyMove);

    window.addEventListener('touchstart', handleTouchMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchMove);
    window.addEventListener('touchcancel', handleTouchMove);

    disableBodyScroll(document.querySelector('.MoveOverlay')!);

    handleTick();
    dispatch({ type: 'move' });

    return () => {
      clearTimeout(lastTick.current?.[1]);
      clearTimeout(lastMove.current?.[1]);

      window.removeEventListener('keydown', handleKeyMove);
      window.removeEventListener('keyup', handleKeyMove);

      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchMove);
      window.removeEventListener('touchcancel', handleTouchMove);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="MoveOverlay" />
      <div className="SpellOverlay" ref={spellRef} />
      <pre className={`Terminal ${animation ? 'Animation' : ''}`}>
        {stats && <Stats state={state} />}
        <Board animation={animation} state={state} units={units} />
        {controls && <Controls state={state} />}
      </pre>
    </>
  );
}

export default Terminal;