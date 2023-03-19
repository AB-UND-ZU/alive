import { useEffect, useReducer, useState } from "react";
import { generateLevel, generateDungeon } from "./generate";

const sliceCenter = (array, index, width) => [...array, ...array, ...array].slice(array.length + index - (width - 1) / 2, array.length + index + (width + 1) / 2);

function reducer(state, action) {
  switch (action.type) {
    case 'move': {
      const { deltaX = 0, deltaY = 0 } = action;
      return {
        ...state,
        x: (state.x + deltaX + state.width) % state.width,
        y: (state.y + deltaY + state.height) % state.height,
      };
    }
  }
}

function Terminal({ score, setScore, gameOver }) {
  const [state, dispatch] = useReducer(reducer, {
    width: 300,
    height: 250,
    screenWidth: 19,
    screenHeight: 15,
    x: 150,
    y: 100,
  }, generateLevel);

  useEffect(() => {
    window.addEventListener('keydown', event => {
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
    });

    console.log(generateDungeon({ width: 250, height: 250 }));
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
              {sliceCenter(row, state.x, state.screenWidth).map(cells => (
                <span className="Cell">{cells}</span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export default Terminal;