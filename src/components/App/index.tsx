import { useEffect, useRef, useState } from 'react';

import Terminal from '../Terminal';
import { generateLevel } from "../../engine/generate";
import './index.css';

declare global {
  interface Window {
    Rune: any;
  }
}

const App = () => {
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  // load Rune once on mount
  useEffect(() => {
    if (window.Rune) {
      window.Rune.init({
        resumeGame: () => setRunning(true),
        pauseGame: () => setRunning(false),
        restartGame: () => {
          setScore(0);
          setRunning(true);
        },
        getScore: () => scoreRef.current,
      });
    }
  }, []);

  // since Rune expects a function at creation, we sadly need to keep a ref in sync manually
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const handleGameOver = () => {
    if (!running) return;

    setRunning(false);
    window.Rune.gameOver();
  };

  return (
    <div className="App">
      <Terminal score={score} setScore={setScore} gameOver={handleGameOver} generateLevel={generateLevel} />
    </div>
  );
}

export default App;
