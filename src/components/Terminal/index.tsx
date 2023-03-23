import { useEffect, useReducer, useRef, useState } from "react";
import { Bush, Flower, Food, Mana } from "./entities";
import { generateLevel } from "./generate";
import { reducer } from "./state";
import { getCell, getFog, pointRange } from "./utils";

const TICK_INTERVAL = 500;
const SKIP_INTERVAL = TICK_INTERVAL / 5;

const Terminal = ({ score, setScore, gameOver }: { score: number, setScore: React.Dispatch<React.SetStateAction<number>>, gameOver: () => void}) => {
  const [state, dispatch] = useReducer(reducer, {
    width: 160,
    height: 160,
    screenWidth: 21,
    screenHeight: 13,
    x: 0,
    y: 0,
    hp: 10,
    mp: 0,
    xp: 0,
    gold: 0,
    food: 0,
    mana: 0,
    wood: 0,
    iron: 0,
    board: [[{}]],
    fog: [[]],
    creatures: [],
  }, generateLevel);

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
          dispatch({ type: 'move', deltaY: -1 });
        } else if (event.key === 'ArrowRight') {
          dispatch({ type: 'move', deltaX: 1 });
        } else if (event.key === 'ArrowDown') {
          dispatch({ type: 'move', deltaY: 1 });
        } else if (event.key === 'ArrowLeft') {
          dispatch({ type: 'move', deltaX: -1 });
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

  const renderText = (text: string, color: string = 'HUD') => text.split('').map((character, index) => (
    <span className="Cell" key={index}>
      <span className={`Entity ${color}`}>{character}</span>
    </span>
  ));

  return (
    <pre className="Terminal">
      <div className="Row">
        {renderText('║ ')}
        {renderText(`${state.hp.toString().padStart(2)}\u0102 `, 'Food')}
        {renderText(`${state.gold.toString().padStart(2)}\u0108 `, 'Gold')}
        {renderText('│ ')}
        {renderText(`${state.wood.toString().padStart(2)}\u2261 `, 'Wood')}
        {renderText(`${state.food.toString().padStart(2)}`, 'Food')}
        <span className="Cell">
          <Food amount={3} />
          <Bush />
        </span>
        {renderText(' ║')}
      </div>

      <div className="Row">
        {renderText('║ ')}
        {renderText(`${state.mp.toString().padStart(2)}\u0103 `, 'Mana')}
        {renderText(`${state.xp.toString().padStart(2)}+ `, 'Score')}
        {renderText('│ ')}
        {renderText(`${state.iron.toString().padStart(2)}\u00f7 `, 'Iron')}
        {renderText(`${state.mana.toString().padStart(2)}`, 'Mana')}
        <span className="Cell">
          <Mana amount={3} />
          <Flower />
        </span>
        {renderText(' ║')}
      </div>

      <div className="Row">
        {renderText('╚')}
        {Array.from({ length: (state.screenWidth - 3) / 2 }).map(() => renderText('═'))}
        {renderText('╧')}
        {Array.from({ length: (state.screenWidth - 3) / 2 }).map(() => renderText('═'))}
        {renderText('╝')}
      </div>

      {pointRange(state.screenHeight, offsetY => [state.x, state.y + offsetY - (state.screenHeight - 1) / 2]).map(([_, rowY]) => (
        <div className="Row" key={rowY}>
          {pointRange(state.screenWidth, offsetX => [state.x + offsetX - (state.screenWidth - 1) / 2, rowY]).map(([cellX, cellY]) => {
            const cell = getCell(state, cellX, cellY);
            const fog = getFog(state, cellX, cellY);

            return (
              <span className={`Cell ${fog === 'fog' ? 'Fog' : ''}`} key={`${cellX}-${cellY}`}>
                {fog === 'dark' ? (
                  <span className="Entity Dark">{'\u2248'}</span>
                ) : (
                  <>
                    {cell.grounds}
                    {cell.terrain}
                    {cell.item}
                    {cell.sprite}
                    {fog === 'visible' && (
                      <>
                        {cell.creature}
                        {cell.equipments}
                        {cell.particles}
                      </>
                    )}
                  </>
                )}
              </span>
            );
          })}
        </div>
      ))}
    </pre>
  );
}

export default Terminal;