import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLeaderboard } from '../../context/LeaderboardContext';
import LeaderboardCategory from './LeaderboardCategory';
import UserHistory from './UserHistory';
import './Leaderboard.css';

// Using interfaces from LeaderboardContext

const Leaderboard: React.FC = () => {
  const { 
    leaderboardData, 
    isLoading, 
    error, 
    activeCategory, 
    setActiveCategory, 
    fetchLeaderboardData 
  } = useLeaderboard();
  
  const { isAuthenticated } = useAuth();
  const [showUserHistory, setShowUserHistory] = useState<boolean>(false);
  
  const categories = ['fish', 'bugs', 'sea', 'villagers'];

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handleRefresh = () => {
    fetchLeaderboardData();
  };
  
  const toggleUserHistory = () => {
    setShowUserHistory(!showUserHistory);
  };

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Leaderboards</h2>
      
      {error && <div className="leaderboard-error">{error}</div>}
      
      {!showUserHistory ? (
        <>
          <div className="leaderboard-tabs">
            {categories.map(category => (
              <button
                key={category}
                className={`leaderboard-tab ${activeCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="leaderboard-content">
            {isLoading ? (
              <div className="leaderboard-loading">Loading leaderboard data...</div>
            ) : (
              <LeaderboardCategory 
                entries={leaderboardData[activeCategory] || []} 
                category={activeCategory} 
              />
            )}
          </div>
        </>
      ) : (
        <UserHistory category={activeCategory} onBack={toggleUserHistory} />
      )}
      
      <div className="leaderboard-actions">
        <button className="refresh-btn" onClick={handleRefresh}>
          Refresh Data
        </button>
        {isAuthenticated && (
          <button 
            className={`view-history-btn ${showUserHistory ? 'active' : ''}`}
            onClick={toggleUserHistory}
          >
            {showUserHistory ? 'Back to Leaderboard' : 'View My History'}
          </button>
        )}
      </div>
    </div>
  );
};

// Add the LeaderboardAPI to the Window interface
declare global {
  interface Window {
    LeaderboardAPI: any;
  }
}

export default Leaderboard;
