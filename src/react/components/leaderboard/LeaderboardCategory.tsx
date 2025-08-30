import React from 'react';
import './Leaderboard.css';

interface LeaderboardEntry {
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

interface LeaderboardCategoryProps {
  entries: LeaderboardEntry[];
  category: string;
}

const LeaderboardCategory: React.FC<LeaderboardCategoryProps> = ({ entries, category }) => {
  // Format the date to a more readable format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Get medal emoji based on rank
  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  return (
    <div className="category-leaderboard">
      <h3 className="category-title">
        {category.charAt(0).toUpperCase() + category.slice(1)} Leaderboard
      </h3>
      
      {entries.length === 0 ? (
        <div className="no-entries">No scores recorded yet!</div>
      ) : (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={`${entry.username}-${index}`} className={`rank-${entry.rank}`}>
                  <td className="rank-cell">
                    {getMedalEmoji(entry.rank)} {entry.rank}
                  </td>
                  <td className="username-cell">{entry.username}</td>
                  <td className="score-cell">{entry.score}</td>
                  <td className="date-cell">{formatDate(entry.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderboardCategory;
