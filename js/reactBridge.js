/**
 * React Bridge - Two-way communication between React and vanilla JS
 */

// Event types
export const GAME_EVENTS = {
  // From React to Game
  SCORE_SUBMIT: 'game:score-submit',
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESET: 'game:reset',
  
  // From Game to React
  STATE_UPDATE: 'game:state-update',
  SCORE_UPDATE: 'game:score-update',
  GAME_OVER: 'game:over',
  ERROR: 'game:error'
};

/**
 * Dispatches a custom event to the document
 * @param {string} eventType - The type of event from GAME_EVENTS
 * @param {Object} detail - The data to send with the event
 */
export function dispatchGameEvent(eventType, detail = {}) {
  if (!GAME_EVENTS[eventType]) {
    console.warn(`Unknown event type: ${eventType}`);
    return;
  }
  
  const event = new CustomEvent(eventType, { 
    detail,
    bubbles: true,
    cancelable: true
  });
  
  document.dispatchEvent(event);
  return event;
}

/**
 * Sets up an event listener for game events
 * @param {string} eventType - The type of event to listen for
 * @param {Function} callback - The function to call when the event occurs
 * @param {Object} options - Additional options for the event listener
 * @returns {Function} - A function to remove the event listener
 */
export function onGameEvent(eventType, callback, options = {}) {
  // Check if eventType is a valid event (either a key or value in GAME_EVENTS)
  const isValidEvent = Object.keys(GAME_EVENTS).includes(eventType) || 
                      Object.values(GAME_EVENTS).includes(eventType);
  
  if (!isValidEvent) {
    console.warn(`Unknown event type: ${eventType}`);
    return () => {};
  }
  
  const handler = (event) => {
    try {
      callback(event.detail, event);
    } catch (error) {
      console.error(`Error in ${eventType} handler:`, error);
      // Dispatch error event
      dispatchGameEvent(GAME_EVENTS.ERROR, {
        type: 'handler_error',
        message: error.message,
        eventType,
        error: error.stack || error.toString()
      });
    }
  };
  
  document.addEventListener(eventType, handler, options);
  
  // Return cleanup function
  return () => {
    document.removeEventListener(eventType, handler, options);
  };
}

// Game state management
let gameState = {
  isPlaying: false,
  score: 0,
  highScore: 0,
  timeLeft: 0,
  category: 'fish',
  difficulty: 'medium'
};

/**
 * Updates the game state and notifies React components
 * @param {Object} newState - Partial state to merge with current state
 */
export function updateGameState(newState) {
  gameState = { ...gameState, ...newState };
  dispatchGameEvent(GAME_EVENTS.STATE_UPDATE, { ...gameState });
}

/**
 * Gets the current game state
 * @returns {Object} The current game state
 */
export function getGameState() {
  return { ...gameState };
}

// Initialize the bridge when this module loads
(function init() {
  // Listen for score updates from the game
  onGameEvent(GAME_EVENTS.SCORE_UPDATE, (detail) => {
    if (typeof detail.score !== 'undefined') {
      updateGameState({ score: detail.score });
    }
    if (typeof detail.highScore !== 'undefined') {
      updateGameState({ highScore: detail.highScore });
    }
  });

  // Listen for game over events
  onGameEvent(GAME_EVENTS.GAME_OVER, (detail) => {
    updateGameState({ 
      isPlaying: false,
      score: detail.score || 0,
      highScore: detail.highScore || gameState.highScore
    });
  });

  // Listen for errors
  onGameEvent(GAME_EVENTS.ERROR, (error) => {
    console.error('Game Error:', error);
  });
})();
