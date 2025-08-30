import React from 'react';
import { useGame } from '../../context/GameContext';
import './Game.css';

const GameTimer: React.FC = () => {
  const { gameState } = useGame();
  
  // Determine timer class based on time left
  const getTimerClass = () => {
    if (!gameState.isGameActive) return '';
    if (gameState.timeLeft <= 3) return 'timer expired';
    if (gameState.timeLeft <= 7) return 'timer warning';
    return 'timer running';
  };

  return (
    <div className="timer-container">
      <div id="timer" className={getTimerClass()}>
        Time: {gameState.timeLeft}s
      </div>
    </div>
  );
};

export default GameTimer;
