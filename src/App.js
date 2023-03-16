import { useEffect, useState } from 'react';

import './App.css';

function App() {
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    window.Rune.init({
      resumeGame: () => setRunning(true),
      pauseGame: () => setRunning(false),
      restartGame: () => {
        setScore(0);
        setRunning(true);
      },
      getScore: () => score,
    });
  }, []);

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
