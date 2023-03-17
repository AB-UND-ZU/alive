import { useEffect, useReducer, useState } from "react";

const getDeterministicRandomInt = (minimum, maximum) => {
  return Math.floor(
    window.Rune.deterministicRandom() * (maximum - minimum) + minimum
  );
};

function Air() {
  return null;
}

function Player() {
  return (
    <>
      <span className="Entity Body">{'\u010b'}</span>
      <span className="Entity Hair">~</span>
    </>
  )
}

function Equipment({ type }) {
  const types = {
    Shield: '\u00ac',
    Weapon: '/',
  };
  return <span className={`Entity Equipment ${type}`}>{types[type]}</span>
}

function Item({ size, type }) {
  const sizes = {
    small: '·',
    medium: '∙',
    large: '\u0106',
    single: "'",
    double: '"',
    triple: '°',
  };
  return <span className={`Entity Item ${type}`}>{sizes[size]}</span>
}

function Chest() {
  return (
    <>
      <span className="Entity Coin">{'\u011d'}</span>
      <span className="Entity Chest">{'\u0115'}</span>
      <span className="Entity Chest">{'\u011f'}</span>
    </>
  );
}

function Monster({ value }) {
  const sizes = ['\u011d', '\u010f', '\u011e', '\u0110'];
  return (
    <>
      <span className="Entity Monster">{sizes[value]}</span>
      <span className="Entity Bar">{'\u0126'}</span>
    </>
  );
}

function Path() {
  return <span className="Entity Path">{'░'}</span>
}

function Water() {
  return <span className="Entity Water">{'▓'}</span>
}

function Sand() {
  return <span className="Entity Sand">{'▒'}</span>
}

function Wall() {
  return <span className="Entity Wall">{'█'}</span>
}

function Plant({ value }) {
  const sizes = ['\u03c4', '\u0104'];
  return <span className="Entity Plant">{sizes[value]}</span>
}

function Lock() {
  return <span className={`Entity Lock`}>{'\u011c'}</span>
}

function Door() {
  return (
    <>
      <span className="Entity Door">{'\u0107'}</span>
    </>
  );
}

const cellTypes = [
  () => <Air />,
  () => <Air />,
  () => <Air />,
  () => <Air />,

  () => <Item size="tiny" type="Coin" />,
  () => <Item size="small" type="Coin" />,
  () => <Item size="medium" type="Coin" />,
  () => <Item size="large" type="Coin" />,

  () => <Door />,
  () => [<Door />, <Lock />],

  () => [<Plant value={0} />],
  () => [<Item size="single" type="Drink" />, <Plant value={0} />],
  () => [<Item size="double" type="Drink" />, <Plant value={0} />],
  () => [<Item size="triple" type="Drink" />, <Plant value={0} />],

  () => [<Plant value={1} />],
  () => [<Item size="small" type="Food" />, <Plant value={1} />],
  () => [<Item size="medium" type="Food" />, <Plant value={1} />],
  () => [<Item size="large" type="Food" />, <Plant value={1} />],

  () => <Wall />,

  () => <Water />,
  () => <Sand />,
  () => <Path />,

  () => [<Equipment type="Shield" />, <Player />, <Equipment type="Weapon" />],

  () => [<Chest />],
  () => [<Chest />, <Lock />],
  () => [<Chest />, <Equipment type="Weapon" />],

  () => <Monster value={0} />,
  () => <Monster value={1} />,
  () => <Monster value={2} />,
  () => <Monster value={3} />,
]

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
  }, state => {
    const rows = Array.from({ length: state.height }).map((_, rowIndex) => {
      const row = Array.from({ length: state.width }).map((_, columnIndex) => {
        return cellTypes[getDeterministicRandomInt(1, cellTypes.length)]();
      });
      return row;
    });
    return { ...state, board: rows };
  });

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