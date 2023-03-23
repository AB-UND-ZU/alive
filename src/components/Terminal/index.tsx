import { useEffect, useReducer } from "react";
import { generateLevel } from "./generate";
import { reducer } from "./state";
import { getCell, getFog, pointRange } from "./utils";

const Terminal = ({ score, setScore, gameOver }: { score: number, setScore: React.Dispatch<React.SetStateAction<number>>, gameOver: () => void}) => {
  const [state, dispatch] = useReducer(reducer, {
    width: 160,
    height: 160,
    screenWidth: 21,
    screenHeight: 13,
    x: 0,
    y: 0,
    gold: 0,
    food: 0,
    mana: 0,
    wood: 0,
    iron: 0,
    board: [[]],
    fog: [[]],
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
    
    dispatch({ type: 'move' });

    window.addEventListener('keydown', handleMove);

    return () => {
      window.removeEventListener('keydown', handleMove);
    }
  }, []);

  return (
    <pre className="Terminal">
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
                    {cell.creature}
                    {cell.equipments}
                    {cell.particles}
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