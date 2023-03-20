import { useEffect, useReducer, useState } from "react";
import { generateLevel, generateDungeon } from "./generate";
import { reducer } from "./state";

const sliceCenter = <T,>(array: T[], index: number, width: number) => [...array, ...array, ...array].slice(array.length + index - (width - 1) / 2, array.length + index + (width + 1) / 2);

const Terminal = ({ score, setScore, gameOver }: { score: number, setScore: React.Dispatch<React.SetStateAction<number>>, gameOver: () => void}) => {
  const [state, dispatch] = useReducer(reducer, {
    width: 300,
    height: 250,
    screenWidth: 19,
    screenHeight: 15,
    x: 150,
    y: 100,
    gold: 0,
    food: 0,
    mana: 0,
    wood: 0,
    iron: 0,
    board: [[{}]],
  }, generateLevel);

  useEffect(() => {
    const handleMove = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        dispatch({ type: 'move', deltaY: -1 });
      } else if (event.key === 'ArrowRight') {
        dispatch({ type: 'move', deltaX: 1 });
      } else if (event.key === 'ArrowDown') {
        dispatch({ type: 'move', deltaY: 1 });
      } else if (event.key === 'ArrowLeft') {
        dispatch({ type: 'move', deltaX: -1 });
      } else {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener('keydown', handleMove);

    return () => {
      window.removeEventListener('keydown', handleMove);
    }
  }, []);

  return (
    <div className="window">
      <div className="title-bar">
        <div className="title-bar-text">Alive.exe</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      <div className="window-body">
        <pre>
          {sliceCenter(state.board, state.y, state.screenHeight).map(row => (
            <div className="Row">
              {sliceCenter(row, state.x, state.screenWidth).map(cell => (
                <span className="Cell">
                  {cell.ground}
                  {cell.terrain}
                  {cell.item}
                  {cell.sprites}
                  {cell.creature}
                  {cell.equipments}
                  {cell.particles}
                </span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export default Terminal;