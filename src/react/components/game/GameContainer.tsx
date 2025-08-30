import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import GameControls from './GameControls';
import GameImage from './GameImage';
import GameFeedback from './GameFeedback';
import GameTimer from './GameTimer';
import './Game.css';

const GameContainer: React.FC = () => {
  const { 
    gameState, 
    startNewRound, 
    resetGame 
  } = useGame();

  // Initialize game when component mounts
  useEffect(() => {
    resetGame();
  }, []);

  return (
    <div className="game-container">
      <div className="score-container">
        <div className="score" id="score">Score: {gameState.score}</div>
        <div className="high-score" id="high-score">High Score: {gameState.highScore}</div>
      </div>

      <GameTimer />
      
      <GameImage />
      
      <GameFeedback />
      
      <GameControls />

      {gameState.isGameOver && (
        <div className="game-over-container">
          <button 
            className="game-button play-again-btn"
            onClick={() => {
              resetGame();
              startNewRound();
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default GameContainer;
