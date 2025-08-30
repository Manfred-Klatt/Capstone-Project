import React, { useState, useEffect } from 'react';
import './Game.css';

interface HighScoreModalProps {
  isOpen: boolean;
  score: number;
  placement?: string;
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

const HighScoreModal: React.FC<HighScoreModalProps> = ({
  isOpen,
  score,
  placement,
  onSubmit,
  onSkip
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPlayerName('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    setIsSubmitting(true);
    onSubmit(playerName.trim());
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>New High Score!</h2>
        <p>Congratulations! You scored <span className="final-score">{score}</span> points!</p>
        
        {placement && (
          <div className="placement-message">{placement}</div>
        )}
        
        <p>Enter your name for the leaderboard:</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name"
            maxLength={10}
            className="player-name-input"
            disabled={isSubmitting}
            autoFocus
          />
          
          <div className="modal-buttons">
            <button 
              type="submit" 
              className="modal-btn submit-btn"
              disabled={isSubmitting || !playerName.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            
            <button 
              type="button" 
              className="modal-btn skip-btn"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HighScoreModal;
