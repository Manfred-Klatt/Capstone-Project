import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import './Game.css';

const GameControls: React.FC = () => {
  const { 
    gameState, 
    submitGuess, 
    startNewRound, 
    setCategory 
  } = useGame();
  
  const [guess, setGuess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when game becomes active
  useEffect(() => {
    if (gameState.isGameActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState.isGameActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim() && gameState.isGameActive) {
      submitGuess(guess);
      setGuess('');
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  const handleStartGame = () => {
    startNewRound();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="game-controls">
      <div className="category-container">
        <label htmlFor="category">Category:</label>
        <select 
          id="category" 
          value={gameState.category}
          onChange={handleCategoryChange}
          disabled={gameState.isGameActive}
        >
          <option value="fish">Fish</option>
          <option value="bugs">Bugs</option>
          <option value="sea">Sea Creatures</option>
          <option value="villagers">Villagers</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="guess-form">
        <input
          ref={inputRef}
          type="text"
          id="guess-input"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter your guess..."
          disabled={!gameState.isGameActive || gameState.isGameOver}
          autoComplete="off"
          maxLength={30}
        />
        <button
          type="submit"
          id="submit-guess"
          disabled={!gameState.isGameActive || gameState.isGameOver || !guess.trim()}
        >
          Submit
        </button>
      </form>

      {!gameState.isGameActive && !gameState.isGameOver && (
        <button
          id="start-round"
          className="game-button"
          onClick={handleStartGame}
        >
          Start Round
        </button>
      )}

      {gameState.isGameOver && (
        <div className="standalone-mode-info">
          <p>Your score has been saved to the leaderboard.</p>
          <p>
            <small>
              Note: In standalone mode, scores are saved locally and not shared with the server.
            </small>
          </p>
        </div>
      )}
    </div>
  );
};

export default GameControls;
