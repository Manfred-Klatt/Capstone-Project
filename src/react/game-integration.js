// Compiled version of game-integration.tsx
(function() {
  // Import React components dynamically
  const { React, ReactDOM, ReactRouterDOM } = window;
  const { useState, useEffect, useCallback } = React;
  
  // Define React components and context providers as global variables
  let GameProvider, AuthProvider, LeaderboardProvider;
  let GameContainer, GameControls, GameImage, GameFeedback, GameTimer;
  let HighScoreModal, Header, Footer, Leaderboard;
  
  /**
   * Loads React components from the global scope
   */
  const loadReactComponents = () => {
    try {
      // Load context providers
      GameProvider = window.GameProvider;
      AuthProvider = window.AuthProvider;
      LeaderboardProvider = window.LeaderboardProvider;
      
      // Load game components
      GameContainer = window.GameContainer;
      GameControls = window.GameControls;
      GameImage = window.GameImage;
      GameFeedback = window.GameFeedback;
      GameTimer = window.GameTimer;
      HighScoreModal = window.HighScoreModal;
      
      // Load layout components
      Header = window.Header;
      Footer = window.Footer;
      Leaderboard = window.Leaderboard;
      
      return true;
    } catch (error) {
      console.error('Error loading React components:', error);
      return false;
    }
  };

  /**
   * Creates a bridge between vanilla JS and React components
   */
  const createGameBridge = () => {
    // Create a bridge component that connects vanilla JS with React
    const GameBridge = () => {
      const [isHighScoreModalOpen, setHighScoreModalOpen] = useState(false);
      const [currentScore, setCurrentScore] = useState(0);
      const [placement, setPlacement] = useState('');
      
      // Connect to vanilla JS game events
      useEffect(() => {
        // Listen for high score event
        const handleHighScore = (event) => {
          const { score, placement } = event.detail;
          setCurrentScore(score);
          setPlacement(placement);
          setHighScoreModalOpen(true);
        };
        
        // Add event listeners
        document.addEventListener('game:highscore', handleHighScore);
        
        // Clean up
        return () => {
          document.removeEventListener('game:highscore', handleHighScore);
        };
      }, []);
      
      // Handle high score submission
      const handleSubmitHighScore = useCallback((name) => {
        // Dispatch event for vanilla JS to handle
        const event = new CustomEvent('react:highscore-submit', {
          detail: { name, score: currentScore }
        });
        document.dispatchEvent(event);
        setHighScoreModalOpen(false);
      }, [currentScore]);
      
      // Handle skip high score
      const handleSkipHighScore = useCallback(() => {
        // Dispatch event for vanilla JS to handle
        const event = new CustomEvent('react:highscore-skip');
        document.dispatchEvent(event);
        setHighScoreModalOpen(false);
      }, []);
      
      // Render the high score modal
      return React.createElement(React.Fragment, null,
        HighScoreModal && React.createElement(HighScoreModal, {
          isOpen: isHighScoreModalOpen,
          score: currentScore,
          placement: placement,
          onSubmit: handleSubmitHighScore,
          onSkip: handleSkipHighScore
        })
      );
    };
    
    return GameBridge;
  };

  /**
   * Initializes the React components when the DOM is loaded
   */
  window.initReactComponents = function() {
    console.log('React components initialization started');
    
    // Check if React and ReactDOM are available
    if (!window.React || !window.ReactDOM) {
      console.error('React or ReactDOM not found. Make sure they are loaded before this script.');
      return;
    }

    try {
      // Load React components
      if (!loadReactComponents()) {
        console.error('Failed to load React components');
        return;
      }
      
      // Create game bridge component
      const GameBridge = createGameBridge();
      
      // Render Header component if container exists
      const headerContainer = document.getElementById('react-header');
      if (headerContainer && Header) {
        console.log('Rendering Header component');
        ReactDOM.render(<Header />, headerContainer);
      }
      
      // Render Game Bridge component if container exists
      const gameBridgeContainer = document.getElementById('react-game-bridge');
      if (gameBridgeContainer) {
        console.log('Rendering Game Bridge component');
        ReactDOM.render(<GameBridge />, gameBridgeContainer);
      }
      
      // Render Leaderboard component if container exists
      const leaderboardContainer = document.getElementById('react-leaderboard');
      if (leaderboardContainer && Leaderboard) {
        console.log('Rendering Leaderboard component');
        ReactDOM.render(<Leaderboard />, leaderboardContainer);
      }
      
      // Render Footer component if container exists
      const footerContainer = document.getElementById('react-footer');
      if (footerContainer && Footer) {
        console.log('Rendering Footer component');
        ReactDOM.render(<Footer />, footerContainer);
      }

      // Expose React components to vanilla JS
      window.ReactGameComponents = {
        showHighScoreModal: (score, placement) => {
          const event = new CustomEvent('game:highscore', {
            detail: { score, placement }
          });
          document.dispatchEvent(event);
        }
      };

      console.log('React components initialization completed');
    } catch (error) {
      console.error('Error initializing React components:', error);
    }
  };
})();
