import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Define the leaderboard entry interface
export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gameData?: {
    correctAnswers: number;
    totalQuestions: number;
    timeTaken: number;
    difficulty: string;
  };
  timestamp: string;
}

// Define the leaderboard data interface
export interface LeaderboardData {
  [category: string]: LeaderboardEntry[];
}

// Define the leaderboard context interface
interface LeaderboardContextType {
  leaderboardData: LeaderboardData;
  isLoading: boolean;
  error: string | null;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  fetchLeaderboardData: () => Promise<void>;
  submitScore: (category: string, score: number, gameData?: any) => Promise<boolean>;
  getUserHistory: (category: string) => Promise<LeaderboardEntry[]>;
}

// Create the context with a default undefined value
const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

// Provider props interface
interface LeaderboardProviderProps {
  children: ReactNode;
}

// Categories available in the game
const CATEGORIES = ['fish', 'bugs', 'sea', 'villagers'];

// Create a provider component
export const LeaderboardProvider: React.FC<LeaderboardProviderProps> = ({ children }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('fish');
  const { isAuthenticated, user } = useAuth();

  // Initialize leaderboard data on mount
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Fetch leaderboard data from API or fallback to localStorage
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to use the LeaderboardAPI if it exists in the window object
      if (window.LeaderboardAPI) {
        const response = await window.LeaderboardAPI.getAllLeaderboards(10);
        if (response && response.data && response.data.leaderboards) {
          setLeaderboardData(response.data.leaderboards);
        } else {
          throw new Error('Invalid leaderboard data format');
        }
      } else {
        // Fallback to local storage if API is not available
        const localData = getFallbackLeaderboardData();
        setLeaderboardData(localData);
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Using local data instead.');
      
      // Use fallback data from localStorage
      const localData = getFallbackLeaderboardData();
      setLeaderboardData(localData);
    } finally {
      setIsLoading(false);
    }
  };

  // Get fallback leaderboard data from localStorage
  const getFallbackLeaderboardData = (): LeaderboardData => {
    try {
      // Try to get from localStorage first
      const localData = localStorage.getItem('acnh_leaderboard');
      if (localData) {
        const parsedData = JSON.parse(localData);
        
        // Transform to match the expected format if needed
        const formattedData: LeaderboardData = {};
        
        CATEGORIES.forEach(category => {
          formattedData[category] = (parsedData[category] || []).map((entry: any, index: number) => ({
            rank: index + 1,
            username: entry.name || 'Guest',
            score: entry.score || 0,
            gameData: {
              correctAnswers: Math.floor((entry.score || 0) / 10),
              totalQuestions: 20,
              timeTaken: 120,
              difficulty: 'medium'
            },
            timestamp: entry.timestamp || new Date().toISOString()
          }));
        });
        
        return formattedData;
      }
      
      // If nothing in localStorage, return empty structure
      return CATEGORIES.reduce((acc, category) => {
        acc[category] = [];
        return acc;
      }, {} as LeaderboardData);
      
    } catch (error) {
      console.error('Error getting fallback leaderboard data:', error);
      
      // Return empty structure on error
      return CATEGORIES.reduce((acc, category) => {
        acc[category] = [];
        return acc;
      }, {} as LeaderboardData);
    }
  };

  // Submit a score to the leaderboard
  const submitScore = async (category: string, score: number, gameData?: any): Promise<boolean> => {
    try {
      const username = user?.username || localStorage.getItem('acnh_username') || 'Guest';
      
      // Try to use the LeaderboardAPI if it exists
      if (window.LeaderboardAPI && isAuthenticated) {
        const scoreData = {
          category,
          score,
          gameData: gameData || {
            correctAnswers: Math.floor(score / 10),
            totalQuestions: Math.floor(score / 10) + (score % 10 > 0 ? 1 : 0),
            timeTaken: 120,
            difficulty: 'medium'
          }
        };
        
        await window.LeaderboardAPI.submitScore(scoreData);
        await fetchLeaderboardData(); // Refresh leaderboard data
        return true;
      } else {
        // Fallback to localStorage
        saveScoreToLocalStorage(category, username, score, gameData);
        await fetchLeaderboardData(); // Refresh leaderboard data
        return true;
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      
      // Try fallback to localStorage on API error
      if (error) {
        const username = user?.username || localStorage.getItem('acnh_username') || 'Guest';
        saveScoreToLocalStorage(category, username, score, gameData);
        await fetchLeaderboardData(); // Refresh leaderboard data
        return true;
      }
      
      return false;
    }
  };

  // Save score to localStorage
  const saveScoreToLocalStorage = (category: string, username: string, score: number, gameData?: any) => {
    try {
      const key = 'acnh_leaderboard';
      let leaderboard = JSON.parse(localStorage.getItem(key) || '{}');
      
      // Initialize category if it doesn't exist
      if (!leaderboard[category]) {
        leaderboard[category] = [];
      }
      
      // Add new score
      leaderboard[category].push({
        name: username,
        score,
        gameData: gameData || {
          correctAnswers: Math.floor(score / 10),
          totalQuestions: Math.floor(score / 10) + (score % 10 > 0 ? 1 : 0),
          timeTaken: 120,
          difficulty: 'medium'
        },
        timestamp: new Date().toISOString()
      });
      
      // Sort by score (descending)
      leaderboard[category].sort((a: any, b: any) => b.score - a.score);
      
      // Keep only top 10
      leaderboard[category] = leaderboard[category].slice(0, 10);
      
      // Save back to localStorage
      localStorage.setItem(key, JSON.stringify(leaderboard));
    } catch (error) {
      console.error('Error saving score to localStorage:', error);
    }
  };

  // Get user's score history for a category
  const getUserHistory = async (category: string): Promise<LeaderboardEntry[]> => {
    try {
      if (window.LeaderboardAPI && isAuthenticated) {
        const response = await window.LeaderboardAPI.getUserHistory(category, 20);
        if (response && response.data && response.data.history) {
          return response.data.history;
        }
      }
      
      // Fallback to localStorage
      return getUserHistoryFromLocalStorage(category);
    } catch (error) {
      console.error('Error getting user history:', error);
      return getUserHistoryFromLocalStorage(category);
    }
  };

  // Get user's score history from localStorage
  const getUserHistoryFromLocalStorage = (category: string): LeaderboardEntry[] => {
    try {
      const username = user?.username || localStorage.getItem('acnh_username') || 'Guest';
      const key = 'acnh_leaderboard';
      const leaderboard = JSON.parse(localStorage.getItem(key) || '{}');
      
      if (!leaderboard[category]) {
        return [];
      }
      
      // Filter by username and transform to match the expected format
      return leaderboard[category]
        .filter((entry: any) => entry.name === username)
        .map((entry: any, index: number) => ({
          rank: index + 1,
          username: entry.name,
          score: entry.score,
          gameData: entry.gameData || {
            correctAnswers: Math.floor(entry.score / 10),
            totalQuestions: Math.floor(entry.score / 10) + (entry.score % 10 > 0 ? 1 : 0),
            timeTaken: 120,
            difficulty: 'medium'
          },
          timestamp: entry.timestamp || new Date().toISOString()
        }));
    } catch (error) {
      console.error('Error getting user history from localStorage:', error);
      return [];
    }
  };

  // Create the context value
  const contextValue: LeaderboardContextType = {
    leaderboardData,
    isLoading,
    error,
    activeCategory,
    setActiveCategory,
    fetchLeaderboardData,
    submitScore,
    getUserHistory
  };

  return (
    <LeaderboardContext.Provider value={contextValue}>
      {children}
    </LeaderboardContext.Provider>
  );
};

// Custom hook to use the leaderboard context
export const useLeaderboard = (): LeaderboardContextType => {
  const context = useContext(LeaderboardContext);
  if (context === undefined) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
};

// Add the LeaderboardAPI to the Window interface
declare global {
  interface Window {
    LeaderboardAPI: any;
  }
}
