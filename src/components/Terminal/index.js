import { useState } from "react";

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
  )
}

function Monster({ value }) {
  const sizes = ['\u011d', '\u010f', '\u011e', '\u0110'];
  return <span className="Entity Monster">{sizes[value]}</span>
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

  () => [<Item size="single" type="Drink" />, <Plant value={0} />],
  () => [<Item size="double" type="Drink" />, <Plant value={0} />],
  () => [<Item size="triple" type="Drink" />, <Plant value={0} />],

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

function Terminal({ score, setScore, gameOver }) {
  const [board] = useState(() => {
    const width = 19;
    const height = 15;
    const rows = Array.from({ length: height }).map((_, rowIndex) => {
      const row = Array.from({ length: width }).map((_, columnIndex) => {
        return cellTypes[getDeterministicRandomInt(1, cellTypes.length)]();
      });
      return row;
    });
    return rows;
  });

  return (
    <div class="window">
      <div class="title-bar">
        <div class="title-bar-text">Alive.exe</div>
        <div class="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      <div class="window-body">
        <pre>
          {board.map(row => (
            <div className="Row">
              {row.map(cells => (
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