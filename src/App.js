import { useEffect, useRef, useState } from 'react';

import './App.css';

function App() {
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  // load Rune once on mount
  useEffect(() => {
    window.Rune.init({
      resumeGame: () => setRunning(true),
      pauseGame: () => setRunning(false),
      restartGame: () => {
        setScore(0);
        setRunning(true);
      },
      getScore: () => scoreRef.current,
    });
  }, []);

  // since Rune expects a function at creation, we sadly need to keep a ref in sync manually
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const handleIncrease = () => {
    if (!running) return;

    setScore(prevScore => prevScore + 1);
  };

  const handleFinish = () => {
    if (!running) return;

    setRunning(false);
    window.Rune.gameOver();
  };

  return (
    <div className="App">
      <div className="Score">{score}</div>
      <button className="Increase" onClick={handleIncrease}>Increase</button>
      <button className="Finish" onClick={handleFinish}>Finish</button>
    </div>
  );
}

export default App;
