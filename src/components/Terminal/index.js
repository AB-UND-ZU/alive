import { useEffect, useReducer, useState } from "react";
import { Air, Plant, Wall } from "./entities";
import { generateLevel, generateDungeon } from "./generate";

const sliceCenter = (array, index, width) => [...array, ...array, ...array].slice(array.length + index - (width - 1) / 2, array.length + index + (width + 1) / 2);

const updateBoard = (board, x, y, value) => {
  const newBoard = [
    ...board.slice(0, y),
    [
      ...board[y].slice(0, x),
      value,
      ...board[y].slice(x + 1),
    ],
    ...board.slice(y + 1),
  ];
  return newBoard;
}

function reducer(state, action) {
  switch (action.type) {
    case 'move': {
      const { deltaX = 0, deltaY = 0 } = action;
      const newX = (state.x + deltaX + state.width) % state.width;
      const newY = (state.y + deltaY + state.height) % state.height;


      if ([Plant, Wall].includes(state.board[newY][newX].type)) return state;
      let newBoard = updateBoard(state.board, newX, newY, state.board[state.y][state.x]);
      newBoard = updateBoard(newBoard, state.x, state.y, <Air />);

      return {
        ...state,
        board: newBoard,
        x: newX,
        y: newY,
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
    const handleMove = event => {
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