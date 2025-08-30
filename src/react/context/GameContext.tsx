import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLeaderboard } from './LeaderboardContext';

// Define the game item interface based on the API response structure
interface GameItem {
  id: string;
  name: {
    'name-USen': string;
    [key: string]: string;
  };
  image_uri: string;
  [key: string]: any; // Allow for additional properties from the API
}

// Define the game state interface
interface GameState {
  score: number;
  highScore: number;
  timeLeft: number;
  currentItem: GameItem | null;
  category: string;
  isGameActive: boolean;
  isGameOver: boolean;
  feedback: string;
  feedbackType: 'correct' | 'error' | 'info' | '';
  cachedData: Record<string, GameItem[]>;
}

// Define the context interface
interface GameContextType {
  gameState: GameState;
  setScore: (score: number) => void;
  setHighScore: (score: number) => void;
  setTimeLeft: (time: number) => void;
  setCurrentItem: (item: GameItem | null) => void;
  setCategory: (category: string) => void;
  setIsGameActive: (active: boolean) => void;
  setIsGameOver: (over: boolean) => void;
  setFeedback: (feedback: string, type: 'correct' | 'error' | 'info' | '') => void;
  setCachedData: (category: string, data: GameItem[]) => void;
  startNewRound: () => void;
  submitGuess: (guess: string) => void;
  endGame: () => void;
  resetGame: () => void;
}

// Create the context with a default undefined value
const GameContext = createContext<GameContextType | undefined>(undefined);

// API constants
const API_BASE = 'https://api.nookipedia.com';
const TIMEOUT = 5000;
const MAX_SCORE = 10;

// Provider props interface
interface GameProviderProps {
  children: ReactNode;
}

// Create a provider component
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Get leaderboard functions
  const leaderboard = useLeaderboard();
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: parseInt(localStorage.getItem('acnh_high_score') || '0', 10),
    timeLeft: 15,
    currentItem: null,
    category: 'fish',
    isGameActive: false,
    isGameOver: false,
    feedback: '',
    feedbackType: '',
    cachedData: {}
  });

  // Timer reference
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('acnh_high_score');
    if (savedHighScore) {
      setGameState(prev => ({ ...prev, highScore: parseInt(savedHighScore, 10) }));
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState.isGameActive && gameState.timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (gameState.timeLeft <= 0 && gameState.isGameActive) {
      endGame();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState.timeLeft, gameState.isGameActive]);

  // State updater functions
  const setScore = (score: number) => {
    setGameState(prev => ({ ...prev, score }));
  };

  const setHighScore = (score: number) => {
    localStorage.setItem('acnh_high_score', score.toString());
    setGameState(prev => ({ ...prev, highScore: score }));
  };

  const setTimeLeft = (time: number) => {
    setGameState(prev => ({ ...prev, timeLeft: time }));
  };

  const setCurrentItem = (item: GameItem | null) => {
    setGameState(prev => ({ ...prev, currentItem: item }));
  };

  const setCategory = (category: string) => {
    setGameState(prev => ({ ...prev, category }));
  };

  const setIsGameActive = (active: boolean) => {
    setGameState(prev => ({ ...prev, isGameActive: active }));
  };

  const setIsGameOver = (over: boolean) => {
    setGameState(prev => ({ ...prev, isGameOver: over }));
  };

  const setFeedback = (feedback: string, type: 'correct' | 'error' | 'info' | '') => {
    setGameState(prev => ({ ...prev, feedback, feedbackType: type }));
  };

  const setCachedData = (category: string, data: GameItem[]) => {
    setGameState(prev => ({
      ...prev,
      cachedData: { ...prev.cachedData, [category]: data }
    }));
  };

  // Helper function to get a random item
  const getRandomItem = (data: GameItem[]) => {
    return data[Math.floor(Math.random() * data.length)];
  };

  // Game logic functions
  const startNewRound = async () => {
    try {
      // Reset feedback
      setFeedback('', '');
      
      const category = gameState.category;
      
      // Check if we have cached data for this category
      if (!gameState.cachedData[category] || gameState.cachedData[category].length === 0) {
        setFeedback('Loading...', 'info');
        
        try {
          // In a real implementation, you would fetch from the API
          // For now, we'll use a placeholder for the fetch logic
          const data = await fetchWithTimeout(`${API_BASE}/${category}/`);
          setCachedData(category, data);
        } catch (error) {
          setFeedback(`Failed to load ${category}`, 'error');
          return;
        }
      }
      
      // Get a random item
      const item = getRandomItem(gameState.cachedData[category]);
      setCurrentItem(item);
      
      // Reset timer
      setTimeLeft(15);
      
      // Start the game
      setIsGameActive(true);
      setIsGameOver(false);
      
      // Update feedback
      setFeedback(`Current Score: ${gameState.score}`, 'info');
      
      // Play sound effect
      const newRoundSound = document.getElementById('new-round-sound') as HTMLAudioElement;
      if (newRoundSound) {
        newRoundSound.play().catch(e => console.error('Error playing sound:', e));
      }
    } catch (error) {
      console.error('Error setting up new round:', error);
      setFeedback('Error starting new round', 'error');
    }
  };

  // Placeholder for the fetch function
  const fetchWithTimeout = async (resource: string, options = {}, timeout = TIMEOUT) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    } finally {
      clearTimeout(id);
    }
  };

  const submitGuess = (userGuess: string) => {
    if (!userGuess.trim() || !gameState.currentItem) return;
    
    // Stop the timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    const correctName = gameState.currentItem.name["name-USen"];
    
    if (userGuess.toLowerCase() === correctName.toLowerCase()) {
      // Correct guess
      const newScore = gameState.score + 1;
      setScore(newScore);
      setFeedback("Correct!", 'correct');
      
      // Play correct sound
      const correctSound = document.getElementById('correct-sound') as HTMLAudioElement;
      if (correctSound) {
        correctSound.play().catch(e => console.error('Error playing sound:', e));
      }
      
      // Check if this is a new high score
      if (newScore > gameState.highScore) {
        setHighScore(newScore);
        
        // Play high score sound
        const highScoreSound = document.getElementById('high-score-sound') as HTMLAudioElement;
        if (highScoreSound) {
          highScoreSound.play().catch(e => console.error('Error playing sound:', e));
        }
      }
      
      // Start new round after brief delay
      setTimeout(() => {
        startNewRound();
      }, 1000);
    } else {
      // Incorrect guess
      setFeedback(`Incorrect! The correct answer was: ${correctName}`, 'error');
      
      // Play game over sound
      const gameOverSound = document.getElementById('game-over-sound') as HTMLAudioElement;
      if (gameOverSound) {
        gameOverSound.play().catch(e => console.error('Error playing sound:', e));
      }
      
      endGame();
    }
  };

  const endGame = () => {
    // Stop the timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Update game state
    setIsGameActive(false);
    setIsGameOver(true);
    
    // If there's a current item and no feedback (timer ran out)
    if (gameState.currentItem && gameState.feedbackType !== 'error') {
      setFeedback(`Time's up! The correct answer was: ${gameState.currentItem.name["name-USen"]}`, 'error');
    }
    
    // Save score to leaderboard
    const username = localStorage.getItem('acnh_username') || 'Guest';
    saveScoreToLeaderboard(username, gameState.score);
  };

  const resetGame = () => {
    setScore(0);
    setTimeLeft(15);
    setIsGameActive(false);
    setIsGameOver(false);
    setFeedback('', '');
    setCurrentItem(null);
  };

  // Helper function to save score to leaderboard
  const saveScoreToLeaderboard = async (name: string, score: number) => {
    try {
      // Use the leaderboard context to submit the score
      await leaderboard.submitScore(gameState.category, score, {
        correctAnswers: score,
        totalQuestions: score + 1, // One more than score since they got the last one wrong
        timeTaken: 15 - gameState.timeLeft,
        difficulty: 'medium'
      });
    } catch (error) {
      console.error('Error saving score to leaderboard:', error);
      
      // Fallback to localStorage if the leaderboard context fails
      const key = "acnh_leaderboard";
      let localLeaderboard = JSON.parse(localStorage.getItem(key) || '{}');
      
      // Initialize category if it doesn't exist
      if (!localLeaderboard[gameState.category]) {
        localLeaderboard[gameState.category] = [];
      }
      
      // Add new score
      localLeaderboard[gameState.category].push({
        name,
        score,
        timestamp: new Date().toISOString()
      });
      
      // Sort by score (descending)
      localLeaderboard[gameState.category].sort((a: any, b: any) => b.score - a.score);
      
      // Keep only top 10
      localLeaderboard[gameState.category] = localLeaderboard[gameState.category].slice(0, 10);
      
      // Save back to localStorage
      localStorage.setItem(key, JSON.stringify(localLeaderboard));
    }
  };

  // Create the context value
  const contextValue: GameContextType = {
    gameState,
    setScore,
    setHighScore,
    setTimeLeft,
    setCurrentItem,
    setCategory,
    setIsGameActive,
    setIsGameOver,
    setFeedback,
    setCachedData,
    startNewRound,
    submitGuess,
    endGame,
    resetGame
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
