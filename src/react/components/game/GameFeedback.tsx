import React from 'react';
import { useGame } from '../../context/GameContext';
import './Game.css';

const GameFeedback: React.FC = () => {
  const { gameState } = useGame();
  
  return (
    <div 
      id="feedback" 
      className={gameState.feedbackType || ''}
    >
      {gameState.feedback}
    </div>
  );
};

export default GameFeedback;
