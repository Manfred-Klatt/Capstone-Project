import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import './Game.css';

const GameImage: React.FC = () => {
  const { gameState } = useGame();
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset loading state when current item changes
  useEffect(() => {
    setIsLoaded(false);
    setImageError(false);
  }, [gameState.currentItem]);

  // Handle image loading
  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    // Try to use proxy if direct image fails
    if (!imageError && gameState.currentItem?.image_uri) {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const img = document.createElement('img');
      img.src = `${proxyUrl}${encodeURIComponent(gameState.currentItem.image_uri)}`;
      img.onload = handleImageLoad;
    }
  };

  return (
    <div className="image-container">
      {!gameState.currentItem && !gameState.isGameActive && (
        <div className="image-placeholder">
          <span>Select a category and start the game</span>
        </div>
      )}
      
      {!isLoaded && gameState.currentItem && (
        <div className="loading-leaf" style={{ display: 'block' }}></div>
      )}
      
      {gameState.currentItem && (
        <img
          id="imageDisplay"
          src={gameState.currentItem.image_uri}
          alt="Animal Crossing item"
          className={isLoaded ? 'loaded' : ''}
          style={{ display: isLoaded ? 'block' : 'none' }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default GameImage;
