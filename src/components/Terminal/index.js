import { useState } from "react";

const getDeterministicRandomInt = (minimum, maximum) => {
  return Math.floor(
    window.Rune.deterministicRandom() * (maximum - minimum) + minimum
  );
};

function Air() {
  return <span className="Cell">&nbsp;</span>
}

function Player() {
  return <span className="Cell Player">{'\u010b'}</span>
}

function Object({ value }) {
  const sizes = ['·', '∙', '\u0106', '\u0103'];
  return <span className="Cell Object">{sizes[value]}</span>
}

function Monster({ value }) {
  const sizes = ['\u011d', '\u010f', '\u011e', '\u0110'];
  return <span className="Cell Monster">{sizes[value]}</span>
}

function Wall({ value }) {
  const sizes = ['░', '▒', '▓', '█'];
  return <span className="Cell Wall">{sizes[value]}</span>
}

function Door({ value }) {
  const sizes = ['\u0109', '\u0107', '█'];
  return <span className="Cell Door">{sizes[value]}</span>
}

const cellTypes = [
  () => <Air />,
  () => <Air />,
  () => <Air />,
  () => <Air />,

  () => <Object value={0} />,
  () => <Object value={1} />,
  () => <Object value={2} />,
  () => <Object value={3} />,

  () => <Door value={0} />,
  () => <Door value={1} />,
  () => <Door value={2} />,

  () => <Wall value={0} />,
  () => <Wall value={1} />,
  () => <Wall value={2} />,
  () => <Wall value={3} />,

  () => <Player />,

  () => <Monster value={0} />,
  () => <Monster value={1} />,
  () => <Monster value={2} />,
  () => <Monster value={3} />,
]

function Terminal({ score, setScore, gameOver }) {
  const [board] = useState(() => {
    const width = 33;
    const height = 29;
    const rows = Array.from({ length: height }).map((_, rowIndex) => {
      const row = Array.from({ length: width }).map((_, columnIndex) => {
        return cellTypes[getDeterministicRandomInt(0, cellTypes.length)]();
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
              {row}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export default Terminal;