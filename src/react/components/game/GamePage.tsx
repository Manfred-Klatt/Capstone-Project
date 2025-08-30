import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './GamePage.css';

const GamePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is playing as guest
    const urlParams = new URLSearchParams(location.search);
    const guestParam = urlParams.get('guest');
    const localStorageGuest = localStorage.getItem('acnh_guest');
    
    setIsGuest(guestParam === 'true' || localStorageGuest === 'true');
    
    // Load game data
    loadGameData();
  }, [location]);

  // Function to load game data
  const loadGameData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch game data from the API
      // For now, we'll just simulate loading game data
      setTimeout(() => {
        setGameData({
          categories: ['fish', 'bugs', 'sea', 'villagers'],
          currentCategory: 'fish',
          score: 0,
          highScore: isAuthenticated ? 120 : 80,
        });
        setIsLoading(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to load game data');
      setIsLoading(false);
    }
  };

  // Function to go back to home
  const goToHome = () => {
    navigate('/');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading game data...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="game-container">
        <div className="game-card">
          <h2>Error</h2>
          <p className="error-message">{error}</p>
          <button onClick={loadGameData} className="primary-button">
            Try Again
          </button>
          <button onClick={goToHome} className="secondary-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-card">
        <h1>Animal Crossing Quiz Game</h1>
        
        <div className="user-info">
          {isAuthenticated ? (
            <p>Playing as: <strong>{user?.username}</strong></p>
          ) : (
            <p>Playing as: <strong>Guest</strong></p>
          )}
        </div>
        
        <div className="game-stats">
          <p>High Score: {gameData?.highScore}</p>
          <p>Current Score: {gameData?.score}</p>
        </div>
        
        <div className="game-categories">
          <h3>Select a Category</h3>
          <div className="category-buttons">
            {gameData?.categories.map((category: string) => (
              <button 
                key={category}
                className={`category-button ${gameData.currentCategory === category ? 'active' : ''}`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="game-actions">
          <button className="primary-button">Start Game</button>
          <button onClick={goToHome} className="secondary-button">
            Back to Home
          </button>
        </div>
        
        <div className="standalone-notice">
          {isGuest && (
            <p className="notice">
              Playing in guest mode. Your scores will be saved locally.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
