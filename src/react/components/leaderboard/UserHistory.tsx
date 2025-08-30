import React, { useState, useEffect } from 'react';
import { useLeaderboard } from '../../context/LeaderboardContext';
import { useAuth } from '../../context/AuthContext';
import './Leaderboard.css';

interface UserHistoryProps {
  category: string;
  onBack: () => void;
}

const UserHistory: React.FC<UserHistoryProps> = ({ category, onBack }) => {
  const { getUserHistory } = useLeaderboard();
  const { user } = useAuth();
  const [userScores, setUserScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserHistory();
  }, [category]);

  const fetchUserHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await getUserHistory(category);
      setUserScores(history);
    } catch (err) {
      console.error('Error fetching user history:', err);
      setError('Failed to load your game history');
    } finally {
      setIsLoading(false);
    }
  };

  // Format the date to a more readable format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Calculate average score
  const calculateAverage = (): number => {
    if (userScores.length === 0) return 0;
    const sum = userScores.reduce((acc, score) => acc + score.score, 0);
    return Math.round((sum / userScores.length) * 10) / 10;
  };

  // Get highest score
  const getHighestScore = (): number => {
    if (userScores.length === 0) return 0;
    return Math.max(...userScores.map(score => score.score));
  };

  return (
    <div className="user-history">
      <div className="user-history-header">
        <h3>Your {category.charAt(0).toUpperCase() + category.slice(1)} Game History</h3>
        <div className="username">{user?.username || localStorage.getItem('acnh_username') || 'Guest'}</div>
      </div>

      {error && <div className="leaderboard-error">{error}</div>}

      {isLoading ? (
        <div className="leaderboard-loading">Loading your game history...</div>
      ) : userScores.length === 0 ? (
        <div className="no-entries">You haven't played any {category} games yet!</div>
      ) : (
        <>
          <div className="stats-summary">
            <div className="stat-item">
              <div className="stat-label">Games Played</div>
              <div className="stat-value">{userScores.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Average Score</div>
              <div className="stat-value">{calculateAverage()}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Highest Score</div>
              <div className="stat-value">{getHighestScore()}</div>
            </div>
          </div>

          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {userScores.map((score, index) => (
                  <tr key={`${score.timestamp}-${index}`}>
                    <td className="rank-cell">{index + 1}</td>
                    <td className="score-cell">{score.score}</td>
                    <td className="date-cell">{formatDate(score.timestamp)}</td>
                    <td className="details-cell">
                      {score.gameData && (
                        <span>
                          {score.gameData.correctAnswers}/{score.gameData.totalQuestions} correct
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default UserHistory;
