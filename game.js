// === Imports ===
import { 
  GAME_EVENTS, 
  onGameEvent, 
  updateGameState,
  getGameState 
} from './js/reactBridge.js';

// === Constants ===
const API_BASE = 'https://api.nookipedia.com';
const TIMEOUT = 5000;
const MAX_SCORE = 10;

// Backend API configuration
const BACKEND_API = (() => {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api/v1';
  }
  
  // Production environment - use Railway backend
  return 'https://capstone-project-production-3cce.up.railway.app/api/v1';
})();

// === Leaderboard API Integration ===
class LeaderboardManager {
  constructor() {
    this.baseURL = `${BACKEND_API}/leaderboard`;
    this.token = localStorage.getItem('authToken');
    this.useLocalFallback = false;
    this.initialized = false;
    this.healthCheckTimeout = 5000; // 5 second timeout for health checks
    this.healthCheckInterval = 60000; // Check every minute if backend is back online
    this.healthCheckIntervalId = null;
    this.standaloneConfirmed = localStorage.getItem('standalone_confirmed_this_session') === 'true';
    
    // Initialize with a small delay to avoid blocking the main thread
    setTimeout(() => {
      this.initialize().catch(error => {
        console.warn('LeaderboardManager initialization warning:', error);
        this.useLocalFallback = true;
        this.enableStandaloneMode('Backend server unavailable. Using standalone mode with local storage.');
        
        // Start periodic health checks to detect when backend comes back online
        this.startPeriodicHealthCheck();
      });
    }, 100);
  }
  
  async initialize() {
    try {
      // Test the connection to the backend using the correct health endpoint
      console.log('Checking backend health...');
      
      // Set up timeout for health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      try {
        // Use simpler headers for health check to avoid CORS preflight issues
        const response = await fetch(`${BACKEND_API}/health`, { 
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'same-origin',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          this.initialized = true;
          console.log('LeaderboardManager initialized successfully', data);
          
          // If we were previously in standalone mode, show a message that we're back online
          if (this.useLocalFallback) {
            this.useLocalFallback = false;
            showMessage('Backend connection restored. Your scores will now be saved online.', 'success');
          }
          
          return true;
        } else {
          throw new Error(`Health check failed with status: ${response.status}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.warn('Backend unavailable, falling back to local storage:', error.message);
      this.useLocalFallback = true;
      this.initialized = false;
      
      // Only show the standalone mode message if not already confirmed
      if (!this.standaloneConfirmed) {
        this.enableStandaloneMode('Backend server unavailable. Using standalone mode with local storage.');
      }
      
      return false;
    }
  }
  
  enableStandaloneMode(message) {
    // Show a message to the user about standalone mode
    showMessage(message, 'warning', 10000);
    this.standaloneConfirmed = true;
    localStorage.setItem('standalone_confirmed_this_session', 'true');
  }
  
  /**
   * Start periodic health checks to detect when backend comes back online
   */
  startPeriodicHealthCheck() {
    // Clear any existing interval
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }
    
    console.log(`Starting periodic health checks every ${this.healthCheckInterval/1000} seconds`);
    
    // Set up new interval
    this.healthCheckIntervalId = setInterval(async () => {
      if (this.useLocalFallback) {
        console.log('Performing periodic health check...');
        try {
          const isBackOnline = await this.initialize();
          if (isBackOnline) {
            // Backend is back online, stop checking
            this.stopPeriodicHealthCheck();
          }
        } catch (error) {
          console.log('Backend still unavailable:', error.message);
        }
      } else {
        // We're already online, no need to keep checking
        this.stopPeriodicHealthCheck();
      }
    }, this.healthCheckInterval);
  }
  
  /**
   * Stop periodic health checks
   */
  stopPeriodicHealthCheck() {
    if (this.healthCheckIntervalId) {
      console.log('Stopping periodic health checks');
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Use auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      // Add guest token for public endpoints that still require authentication
      // This token should match the GUEST_LEADERBOARD_TOKEN in backend .env
      headers['X-Guest-Token'] = 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9';
    }
    
    // Add CSRF token if available
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    return headers;
  }

  async submitScore(name, score, category = 'fish') {
    try {
      const scoreData = {
        category: category,
        score: score,
        gameData: {
          correctAnswers: score,
          totalQuestions: MAX_SCORE,
          timeTaken: 120,
          difficulty: 'medium'
        }
      };

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(scoreData),
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to submit score to backend');
      }

      const result = await response.json();
      console.log('Score submitted to backend successfully:', result);
      return result;
    } catch (error) {
      console.log('Backend submission failed, using local storage:', error);
      this.useLocalFallback = true;
      return this.saveScoreToLocalStorage(name, score);
    }
  }

  async getLeaderboard(category = 'fish', limit = 10) {
    try {
      // If we're already using local fallback, just return local data
      if (this.useLocalFallback) {
        console.log('Using local leaderboard fallback (already set)');
        return this.getLocalLeaderboard();
      }

      // If not initialized yet, try to initialize first
      if (!this.initialized) {
        await this.initialize();
      }
      if (this.useLocalFallback) {
        return this.getLocalLeaderboard();
      }
      const response = await fetch(`${this.baseURL}/${encodeURIComponent(category)}?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(),
        mode: 'cors',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Leaderboard API error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Validate and extract the leaderboard data with proper error handling
      if (!responseData) {
        throw new Error('Empty response from leaderboard API');
      }
      
      // Handle different response formats
      let leaderboardData;
      if (Array.isArray(responseData)) {
        leaderboardData = responseData;
      } else if (responseData.data && responseData.data.leaderboard) {
        leaderboardData = responseData.data.leaderboard;
      } else if (responseData.data) {
        leaderboardData = Array.isArray(responseData.data) ? responseData.data : [];
      } else {
        throw new Error('Invalid leaderboard data format');
      }
      
      console.log(`Successfully fetched ${leaderboardData.length} leaderboard entries`);
      return leaderboardData;
    } catch (error) {
      console.warn('Leaderboard API error, using local storage fallback:', error.message);
      this.useLocalFallback = true;
      return this.getLocalLeaderboard();
    }
  }

  saveScoreToLocalStorage(name, score) {
    const key = "acnh_leaderboard";
    let leaderboard = JSON.parse(localStorage.getItem(key)) || [];
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(leaderboard));
    return { success: true, local: true };
  }

  getLocalLeaderboard() {
    try {
      const leaderboardData = localStorage.getItem("acnh_leaderboard");
      if (!leaderboardData) return [];
      
      const parsedData = JSON.parse(leaderboardData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('Error parsing leaderboard data:', error);
      return [];
    }
  }
}

// Initialize leaderboard manager early to avoid reference errors
const leaderboardManager = new LeaderboardManager();

// Legacy functions for compatibility
async function saveScoreToLeaderboard(name, score) {
  return leaderboardManager.submitScore(name, score);
}

async function getLeaderboard() {
  return leaderboardManager.getLeaderboard();
}

// === Cached Elements ===
const ELEMENTS = {};

// Function to cache DOM elements
function cacheDOMElements() {
  // Get elements using their correct IDs from the HTML
  ELEMENTS.category = document.getElementById('category');
  ELEMENTS.guessInput = document.getElementById('guess-input');
  ELEMENTS.gameActionButton = document.getElementById('game-action-btn');
  ELEMENTS.feedback = document.getElementById('feedback');
  ELEMENTS.imageDisplay = document.getElementById('image-display');
  ELEMENTS.leaderboardElement = document.getElementById('leaderboard');
  ELEMENTS.gameContainer = document.querySelector('.game-container');
  
  // Get score and high score elements with their value spans
  ELEMENTS.scoreElement = document.getElementById('score-value');
  ELEMENTS.highScoreElement = document.getElementById('high-score-value');
  
  // Get timer elements
  ELEMENTS.timerElement = document.getElementById('game-timer');
  ELEMENTS.timeSpan = document.getElementById('time');
  ELEMENTS.timerContainer = document.querySelector('.timer-container');
  
  // Set up button references - use the same button for both start and submit
  ELEMENTS.startButton = ELEMENTS.gameActionButton;
  ELEMENTS.submitButton = ELEMENTS.gameActionButton;
  
  // Game state
  ELEMENTS.gameState = 'idle'; // 'idle', 'playing', 'gameOver'
  
  // Log which elements were not found
  Object.entries(ELEMENTS).forEach(([key, element]) => {
    if (!element && key !== 'gameState') {
      console.warn(`DOM element not found: ${key}`);
    }
  });
}

// === Cached Data ===
let cachedData = {};
let score = 0;
let currentItem = null;
let timeLeft = 10; // Default to medium difficulty (10s)
let timerInterval;
let maxTime = 10000; // Default to medium difficulty (10s in ms)

// === Timer Functions ===
function startTimer() {
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  // Decrease time based on the actual time passed for better accuracy
  const now = Date.now();
  if (!this.lastUpdateTime) {
    this.lastUpdateTime = now;
  }
  
  const deltaTime = now - this.lastUpdateTime;
  this.lastUpdateTime = now;
  
  timeLeft = Math.max(0, timeLeft - (deltaTime / 1000)); // Convert ms to seconds
  
  // Update timer display using cached element
  updateTimerDisplay();
  
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    endGame();
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}



// === DOM Ready ===
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM fully loaded, initializing game...');
    
    // Set up React event listeners
    setupReactEventListeners();
    
    // Set up simulate high score button
    const simulateHighScoreBtn = document.getElementById('simulate-high-score-btn');
    if (simulateHighScoreBtn) {
      simulateHighScoreBtn.addEventListener('click', () => {
        const simulatedScore = Math.floor(Math.random() * 10) + 1;
        console.log(`Simulating high score: ${simulatedScore}`);
        
        // Update the score variable
        score = simulatedScore;
        
        // Update high score
        updateHighScore();
      });
    }
    
    // Cache all DOM elements first
    cacheDOMElements();
    
    // Function to update input placeholder based on selected category
    function updatePlaceholder() {
      if (ELEMENTS.category && ELEMENTS.guessInput) {
        let category = ELEMENTS.category.value;
        let displayText;
        
        // Handle special case for 'sea' category
        if (category === 'sea') {
          displayText = 'sea creature';
        } else {
          // Make other categories singular and lowercase
          displayText = category.endsWith('s') ? category.slice(0, -1) : category;
          displayText = displayText.toLowerCase();
        }
        
        ELEMENTS.guessInput.placeholder = `Name that ${displayText}!`;
      }
    }
    
    // Set initial placeholder
    updatePlaceholder();
    
    // Update placeholder when category changes
    if (ELEMENTS.category) {
      ELEMENTS.category.addEventListener('change', updatePlaceholder);
    }
    
    // Check for critical elements and create them if missing
    const criticalElements = ['guessInput', 'submitButton', 'startButton', 'feedback'];
    const missingCritical = [];
    
    criticalElements.forEach(el => {
      if (!ELEMENTS[el]) {
        missingCritical.push(el);
        
        // Try to find elements by alternative selectors
        if (el === 'startButton') {
          ELEMENTS.startButton = document.querySelector('button[id*="start"]');
        } else if (el === 'submitButton') {
          ELEMENTS.submitButton = document.querySelector('button[id*="submit"]');
        } else if (el === 'nextButton') {
          ELEMENTS.nextButton = document.querySelector('button[id*="next"]');
        }
      }
    });
    
    // Log any elements that are still missing after recovery attempts
    const stillMissing = criticalElements.filter(el => !ELEMENTS[el]);
    if (stillMissing.length > 0) {
      console.warn('Some critical elements could not be found:', stillMissing.join(', '));
      console.warn('Game functionality may be limited');
    }

    // Set up event listeners with null checks
    if (ELEMENTS.submitButton) {
      console.log('Setting up submit button listener');
      ELEMENTS.submitButton.addEventListener('click', submitGuess);
    }
    
    if (ELEMENTS.nextButton) {
      console.log('Setting up next button listener');
      ELEMENTS.nextButton.addEventListener('click', setupNewRound);
    }
    
    if (ELEMENTS.startButton) {
      console.log('Setting up start button listener');
      ELEMENTS.startButton.addEventListener('click', initGame);
    }

    // Allow Enter key to submit guess
    if (ELEMENTS.guessInput) {
      ELEMENTS.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitGuess();
        }
      });
    }

    // Initialize auth handlers
    initAuthHandlers();
    
    // Initialize game state
    score = 0;
    const difficultySelect = document.getElementById('difficulty');
    if (difficultySelect) {
      maxTime = parseInt(difficultySelect.value);
      timeLeft = maxTime / 1000; // Convert ms to seconds
    } else {
      maxTime = 10000; // Default to 10s if not found
      timeLeft = 10;
    }
    
    // Update UI elements
    updateScoreDisplay();
    updateTimerDisplay();
    
    // Disable input until game starts
    if (ELEMENTS.guessInput) {
      ELEMENTS.guessInput.disabled = true;
    }
    
    // Initialize leaderboard with error handling
    try {
      renderLeaderboard();
    } catch (error) {
      console.error('Error initializing leaderboard:', error);
    }
    
    if (ELEMENTS.submitButton) {
      ELEMENTS.submitButton.disabled = true;
    }
    
    if (ELEMENTS.startButton) {
      ELEMENTS.startButton.disabled = false;
    }

  } catch (error) {
    console.error('Error initializing game:', error);
  }
});

// === Game Utilities ===
function clearErrors() {
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

function displayError(elementId, message) {
  const errorElement = document.getElementById(`${elementId}Error`);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

/**
 * Shows a message notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of message: 'success', 'error', 'warning', 'info'
 * @param {number} duration - How long to show the message in milliseconds (default: 5000)
 */
function showMessage(message, type = 'info', duration = 5000) {
  // Check if notification container exists, create if not
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    padding: 12px 20px;
    margin-bottom: 10px;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    max-width: 350px;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    color: white;
    background-color: ${type === 'success' ? '#4caf50' : 
                      type === 'error' ? '#f44336' : 
                      type === 'warning' ? '#ff9800' : 
                      '#2196f3'};
  `;
  
  // Add message content
  notification.textContent = message;
  
  // Add close button
  const closeButton = document.createElement('span');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = 'margin-left: 10px; float: right; cursor: pointer; font-weight: bold;';
  closeButton.onclick = () => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  };
  notification.prepend(closeButton);
  
  // Add to container and animate in
  notificationContainer.appendChild(notification);
  setTimeout(() => notification.style.opacity = '1', 10);
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
  
  return notification;
}

// === Auth Logic ===
function initAuthHandlers() {
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const container = document.getElementById('container');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  
  // Only add event listeners if elements exist
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (signUpButton && container) {
    signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
  }
  
  if (signInButton && container) {
    signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
  }
}

// Get CSRF token from cookie
function getCSRFToken() {
  const tokenCookieName = 'XSRF-TOKEN';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === tokenCookieName) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// API data fetching function - uses backend proxy with local fallback
async function fetchDataFromAPI(category) {
  try {
    console.log(`Fetching ${category} data from backend proxy...`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Use the same guest token as defined in the backend .env
      'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
    };
    
    // Add CSRF token if available
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Set a timeout for the fetch request
    const timeoutId = setTimeout(() => {
      throw new Error('Request timeout');
    }, 10000);
    
    try {
      const response = await fetch(`${BACKEND_API}/game/data/${category}`, {
        method: 'GET',
        headers: headers,
        mode: 'cors',
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId); // Clear timeout if request completes
      
      if (!response.ok) {
        throw new Error(`Backend proxy error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        const data = result.data;
        if (data.length > 0) {
          console.log(`Successfully fetched ${data.length} ${category} items from backend proxy`);
          // Cache the data with timestamp
          localStorage.setItem(`${category}_data`, JSON.stringify(data));
          localStorage.setItem(`${category}_data_timestamp`, Date.now());
          return data;
        } else {
          throw new Error('No data returned from backend proxy');
        }
      } else {
        throw new Error(`Invalid response format: ${JSON.stringify(result)}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId); // Ensure timeout is cleared if fetch fails
      throw fetchError;
    }
  } catch (error) {
    console.error(`Backend proxy fetch failed for ${category}:`, error);
    
    // Fallback to local data files as last resort
    try {
      console.log(`Attempting to load local ${category} data as fallback...`);
      const response = await fetch(`data/${category}.json`);
      if (!response.ok) {
        throw new Error(`Local data file not found: ${response.status}`);
      }
      const localData = await response.json();
      
      // Convert object format to array format if needed
      let processedData;
      if (Array.isArray(localData)) {
        processedData = localData;
      } else if (typeof localData === 'object' && localData !== null) {
        // Convert object with keys to array of values
        processedData = Object.values(localData);
      } else {
        throw new Error('Invalid local data format');
      }
      
      if (processedData.length > 0) {
        console.log(`Successfully loaded ${processedData.length} ${category} items from local data`);
        // Cache the fallback data
        localStorage.setItem(`${category}_data`, JSON.stringify(processedData));
        localStorage.setItem(`${category}_data_timestamp`, Date.now());
        return processedData;
      } else {
        throw new Error('No data found in local file');
      }
    } catch (fallbackError) {
      console.error(`Local data fallback failed for ${category}:`, fallbackError);
      throw new Error(`Failed to load ${category} data from both backend and local sources`);
    }
  }
}

function handleSignup(e) {
  e.preventDefault();
  clearErrors();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;

  if (isValid) {
    console.log('Signup data:', {
      name,
      email,
      password
    });
    alert('Signup successful! You can now login.');
    document.getElementById('container').classList.remove("right-panel-active");
    document.getElementById('signupForm').reset();

    // Store the user's name in localStorage
    localStorage.setItem('acnh_username', name);
  }

  if (isValid) {
    console.log('Login data:', {
      email,
      password
    });
    alert('Login successful! Redirecting...');
    document.getElementById('loginForm').reset();

    // Retrieve the stored username or fallback to email prefix
    const savedName = localStorage.getItem('acnh_username') || email.split('@')[0];
    document.getElementById('greeting').textContent = `Hello, ${savedName}!`;
  }

  let isValid = true;
  if (!name) showError('signupName', 'Name is required'), isValid = false;
  if (!email) showError('signupEmail', 'Email is required'), isValid = false;
  else if (!isValidEmail(email)) showError('signupEmail', 'Invalid email'), isValid = false;
  if (!password) showError('signupPassword', 'Password is required'), isValid = false;
  else if (password.length < 6) showError('signupPassword', 'Min 6 characters'), isValid = false;
  if (!confirmPassword) showError('signupConfirmPassword', 'Please confirm password'), isValid = false;
  else if (password !== confirmPassword) showError('signupConfirmPassword', 'Passwords do not match'), isValid = false;

  if (isValid) {
    alert('Signup successful! You can now login.');
    document.getElementById('container').classList.remove("right-panel-active");
    document.getElementById('signupForm').reset();
  }
}

function handleLogin(e) {
  e.preventDefault();
  clearErrors();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  let isValid = true;
  if (!email) showError('loginEmail', 'Email is required'), isValid = false;
  else if (!isValidEmail(email)) showError('loginEmail', 'Invalid email'), isValid = false;
  if (!password) showError('loginPassword', 'Password is required'), isValid = false;

  if (isValid) {
    // Handle successful login
    console.log('Login successful for:', email);
    // Add your login success logic here
  }
}

if (ELEMENTS.timerElement) {
  ELEMENTS.timerElement.textContent = `Time: ${timeLeft}s`;
}

// Disable input until game starts
if (ELEMENTS.guessInput) {
  ELEMENTS.guessInput.disabled = true;
}

if (ELEMENTS.gameActionButton) {
  ELEMENTS.gameActionButton.textContent = 'Start Game';
  ELEMENTS.gameActionButton.className = 'btn btn-primary';
}

// Initialize leaderboard
renderLeaderboard();

// Game state management is handled by reactBridge.js

function handleGameAction() {
  const currentState = getGameState();
  
  if (!currentState.isPlaying && !currentState.gameOver) {
    // Start a new game
    initGame();
    updateGameState({ 
      isPlaying: true,
      gameOver: false,
      score: 0
    });
  } else if (currentState.isPlaying) {
    // Submit current guess
    submitGuess();
  } else if (currentState.gameOver) {
    // Restart the game
    initGame();
    updateGameState({ 
      isPlaying: true,
      gameOver: false,
      score: 0
    });
  }
}

function submitGuess() {
  try {
    // Check if we have the required elements
    if (!ELEMENTS.guessInput) {
      console.error('Guess input element not found');
      return;
    }

    const userGuess = ELEMENTS.guessInput.value.trim();
    
    if (!userGuess) {
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = 'Please enter a guess';
        ELEMENTS.feedback.className = 'error';
      }
      return;
    }

    handleGuess(userGuess);
    
    // Clear the input and refocus
    if (ELEMENTS.guessInput) {
      ELEMENTS.guessInput.value = '';
      ELEMENTS.guessInput.focus();
    }
  } catch (error) {
    console.error('Error in submitGuess:', error);
    if (ELEMENTS.feedback) {
      ELEMENTS.feedback.textContent = 'An error occurred. Please try again.';
      ELEMENTS.feedback.className = 'error';
    }
  }
}

function handleGuess(userGuess) {
  try {
    if (!currentItem) {
      console.error('No current item to check against');
      return false;
    }

    // Get the correct answer (handle both string and object with name-USen)
    const correctAnswer = typeof currentItem.name === 'string' 
      ? currentItem.name.toLowerCase().trim() 
      : (currentItem.name?.['name-USen'] || '').toLowerCase().trim();

    const normalizedGuess = userGuess.toLowerCase().trim();
    const isCorrect = normalizedGuess === correctAnswer;

    // Update score and UI based on the result
    if (isCorrect) {
      score++;
      
      // Notify React of score update
      document.dispatchEvent(new CustomEvent(GAME_EVENTS.SCORE_UPDATE, {
        detail: {
          score: score,
          isCorrect: true,
          correctAnswer: correctAnswer
        }
      }));
      
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = ' Correct!';
        ELEMENTS.feedback.className = 'correct';
      }
      
      // Update score display if element exists
      if (ELEMENTS.scoreElement) {
        ELEMENTS.scoreElement.textContent = `Score: ${score}`;
      }
      
      // Play correct sound if available
      const correctSound = document.getElementById('correct-sound');
      if (correctSound) {
        correctSound.currentTime = 0;
        correctSound.play().catch(e => console.warn('Could not play sound:', e));
      }
      
      // Setup next round after a short delay
      setTimeout(() => {
        setupNewRound();
      }, 1000);
      
      return true;
    } else {
      // Notify React of incorrect guess
      document.dispatchEvent(new CustomEvent(GAME_EVENTS.SCORE_UPDATE, {
        detail: {
          score: score,
          isCorrect: false,
          correctAnswer: correctAnswer
        }
      }));
      
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = ` Incorrect! The correct answer was: ${correctAnswer}`;
        ELEMENTS.feedback.className = 'incorrect';
      }
      
      // Play incorrect sound if available
      const incorrectSound = document.getElementById('incorrect-sound');
      if (incorrectSound) {
        incorrectSound.currentTime = 0;
        incorrectSound.play().catch(e => console.warn('Could not play sound:', e));
      }
      
      // End the game on wrong answer
      endGame();
      return false;
    }
  } catch (error) {
    console.error('Error in handleGuess:', error);
    // Notify React of error
    document.dispatchEvent(new CustomEvent(GAME_EVENTS.ERROR, {
      detail: {
        type: 'guess_error',
        message: 'Error processing guess',
        details: error.message
      }
    }));
    return false;
  }
}

function setupNewRound() {
  try {
    console.log('Setting up new round');
    
    // Reset feedback if element exists
    if (ELEMENTS.feedback) {
      ELEMENTS.feedback.className = '';
      ELEMENTS.feedback.textContent = `Current Score: ${score}`;
    }
    
    // Get a new item from the selected category
    if (!ELEMENTS.category) {
      console.error('Category selector not found');
      return;
    }
    
    const category = ELEMENTS.category.value || 'fish'; // Default to fish if no category selected
    
    // Check if we have data for this category
    if (!cachedData[category] || !Array.isArray(cachedData[category]) || cachedData[category].length === 0) {
      console.error('No data available for category:', category);
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = `No data available for ${category}. Please try another category.`;
      }
      return;
    }
    
    // Get a random item
    currentItem = getRandomItem(cachedData[category]);
    if (!currentItem) {
      console.error('Failed to get random item');
      return;
    }
    
    // Display the item
    displayImageFromData(currentItem);
    
    // Enable input fields if they exist
    if (ELEMENTS.guessInput) {
      ELEMENTS.guessInput.disabled = false;
      ELEMENTS.guessInput.value = ''; // Clear previous input
      ELEMENTS.guessInput.focus(); // Focus on input field
    }
    
    if (ELEMENTS.submitButton) {
      ELEMENTS.submitButton.disabled = false;
    }
    
    if (ELEMENTS.startButton) {
      ELEMENTS.startButton.disabled = true;
    }
    
    // Reset timer state based on difficulty
    const difficultySelect = document.getElementById('difficulty');
    if (difficultySelect) {
      maxTime = parseInt(difficultySelect.value);
      timeLeft = maxTime / 1000; // Convert ms to seconds
    } else {
      timeLeft = 10; // Default to 10 seconds
    }
    
    updateTimerDisplay(); // Update timer display
    stopTimer(); // Clear any existing timer
    
    // Start the timer
    startTimer();
    
    // Show next button if it exists
    if (ELEMENTS.nextButton) {
      ELEMENTS.nextButton.style.display = 'none'; // Hide next button until needed
    }
    
  } catch (error) {
    console.error('Error setting up new round:', error);
    if (ELEMENTS.feedback) {
      ELEMENTS.feedback.textContent = 'Error setting up game. Please try again.';
    }
  }
}





// === API & Data ===

async function initGame() {
  const category = ELEMENTS.category ? ELEMENTS.category.value : 'fish';

  if (ELEMENTS.feedback) {
    ELEMENTS.feedback.textContent = "Loading from API...";
  }

  try {
    console.log(`Fetching fresh ${category} data from API...`);
    
    // Force API fetch - no fallbacks
    const apiData = await fetchDataFromAPI(category);
    
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      console.log(`Successfully loaded ${apiData.length} ${category} items from API`);
      cachedData[category] = apiData;
      
      // Start the game with API data
      currentItem = getRandomItem(cachedData[category]);
      displayImageFromData(currentItem);

      // Enable input fields
      if (ELEMENTS.guessInput) ELEMENTS.guessInput.disabled = false;
      if (ELEMENTS.submitButton) ELEMENTS.submitButton.disabled = false;
      if (ELEMENTS.scoreElement) ELEMENTS.scoreElement.textContent = `Score: ${score}`;

      // Start a new round
      setupNewRound();
    } else {
      throw new Error('No data returned from API');
    }
  } catch (error) {
    console.error(`Failed to load ${category} data from API:`, error);
    
    if (ELEMENTS.feedback) {
      ELEMENTS.feedback.textContent = `Failed to load ${category} data from API. Please check your connection and try again.`;
      ELEMENTS.feedback.className = 'error';
    }
    
    // Reset game state
    if (ELEMENTS.guessInput) ELEMENTS.guessInput.disabled = true;
    if (ELEMENTS.submitButton) ELEMENTS.submitButton.disabled = true;
    if (ELEMENTS.startButton) ELEMENTS.startButton.disabled = false;
  }
}

function getRandomItem(data) {
  return data[Math.floor(Math.random() * data.length)];
}

async function fetchWithTimeout(resource, options = {}, timeout = TIMEOUT) {
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
}

// === UI Display ===
function updateHighScore() {
  const currentHighScore = localStorage.getItem('acnh_high_score') || 0;
  if (score > currentHighScore) {
    localStorage.setItem('acnh_high_score', score);
    if (ELEMENTS.highScoreElement) {
      ELEMENTS.highScoreElement.textContent = score;
    }
    
    // Check if React high score modal is available
    if (window.ReactGameComponents && window.ReactGameComponents.showHighScoreModal) {
      // Get placement (e.g., "1st", "2nd", etc.)
      const placement = getScorePlacement(score);
      
      // Show the React high score modal
      window.ReactGameComponents.showHighScoreModal(score, placement);
    }
  } else if (ELEMENTS.highScoreElement && !ELEMENTS.highScoreElement.textContent) {
    // If no high score is set yet, show the current high score
    ELEMENTS.highScoreElement.textContent = currentHighScore;
  }
}

// Update score display
function updateScoreDisplay() {
  if (ELEMENTS.scoreElement) {
    ELEMENTS.scoreElement.textContent = score;
  }
  
  // Also update the high score display
  updateHighScore();
}

// Get the placement of a score in the leaderboard
function getScorePlacement(newScore) {
  const leaderboard = getLeaderboard();
  
  // If leaderboard is empty, it's the first place
  if (leaderboard.length === 0) {
    return '1st';
  }
  
  // Count how many scores are higher than the new score
  const position = leaderboard.filter(entry => entry.score >= newScore).length;
  
  // Return the placement with the appropriate suffix
  const positionNumber = position + 1;
  if (positionNumber === 1) return '1st';
  if (positionNumber === 2) return '2nd';
  if (positionNumber === 3) return '3rd';
  return `${positionNumber}th`;
}

function displayImageFromData(data) {
  if (!data) {
    console.error('No data available for image display');
    return;
  }
  
  if (!ELEMENTS.imageDisplay) {
    console.error('Image display element not found');
    return;
  }
  
  // Reset display
  ELEMENTS.imageDisplay.style.display = 'block';
  ELEMENTS.imageDisplay.alt = data.name?.['name-USen'] || data.name || 'Animal Crossing character or item';
  
  // Force use of API images only - prioritize high quality images
  const originalImageUrl = data.image_uri || data.icon_uri || data.image || data.photo;
  
  if (!originalImageUrl) {
    console.error('No API image URL available for:', data.name?.['name-USen'] || data.name);
    ELEMENTS.imageDisplay.style.display = 'none';
    return;
  }
  
  // Helper function to get current category
  function getCurrentCategory() {
    if (ELEMENTS.category && ELEMENTS.category.value) {
      return ELEMENTS.category.value;
    }
    return 'fish'; // Default fallback
  }
  
  // Use Nookipedia image URL directly
  console.log(`Loading Nookipedia image: ${originalImageUrl}`);
  ELEMENTS.imageDisplay.src = originalImageUrl;
  ELEMENTS.imageDisplay.style.display = 'block';
  
  // Handle image load errors
  ELEMENTS.imageDisplay.onerror = () => {
    console.error(`Failed to load Nookipedia image: ${originalImageUrl}`);
    ELEMENTS.imageDisplay.style.display = 'none';
  };
  
  ELEMENTS.imageDisplay.onload = () => {
    console.log(`Successfully loaded image for: ${data.name?.['name-USen'] || data.name}`);
  };
}

function updateTimerDisplay() {
  // Update the time display if elements exist, using Math.floor to get whole numbers
  if (ELEMENTS.timeSpan) {
    ELEMENTS.timeSpan.textContent = Math.floor(timeLeft);
  }
  
  // Update timer container classes for styling
  if (ELEMENTS.timerContainer) {
    // Show the timer
    ELEMENTS.timerContainer.style.display = 'block';
    ELEMENTS.timerContainer.style.visibility = 'visible';
    
    // Update warning and danger states
    const secondsLeft = Math.floor(timeLeft);
    if (secondsLeft <= 10) {
      ELEMENTS.timerContainer.classList.add('warning');
      if (secondsLeft <= 5) {
        ELEMENTS.timerContainer.classList.add('danger');
      } else {
        ELEMENTS.timerContainer.classList.remove('danger');
      }
    } else {
      ELEMENTS.timerContainer.classList.remove('warning', 'danger');
    }
  }
}

// Leaderboard API Integration (using the class defined at the top of the file)

// Legacy functions for compatibility (already defined at the top of the file)

async function renderLeaderboard() {
  // Helper function to get leaderboard from local storage
  function getLocalLeaderboard() {
    try {
      const localData = localStorage.getItem('acnh_leaderboard');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Error reading from local storage:', error);
      return [];
    }
  }

  try {
    // Try to find the leaderboard element if not already cached
    if (!ELEMENTS.leaderboardElement) {
      ELEMENTS.leaderboardElement = document.getElementById('leaderboard');
      if (!ELEMENTS.leaderboardElement) {
        console.warn('Leaderboard element not found in the DOM');
        return;
      }
    }
    
    // Show loading state with animation
    ELEMENTS.leaderboardElement.innerHTML = '<li class="loading">Loading leaderboard<span class="loading-dots">...</span></li>';

    const category = ELEMENTS.category ? ELEMENTS.category.value : 'fish';
    let leaderboard = [];
    let dataSource = 'api';
    
    // Check if we can use the leaderboard manager
    const canUseManager = leaderboardManager && typeof leaderboardManager.getLeaderboard === 'function';
    
    if (canUseManager) {
      try {
        console.log(`Attempting to fetch leaderboard for category: ${category}`);
        const startTime = performance.now();
        leaderboard = await Promise.race([
          leaderboardManager.getLeaderboard(category),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Leaderboard fetch timeout')), 10000))
        ]);
        const fetchTime = Math.round(performance.now() - startTime);
        console.log(`Leaderboard fetch completed in ${fetchTime}ms`);
      } catch (error) {
        console.warn('Error fetching leaderboard from backend:', error.message);
        // Fall back to local storage
        dataSource = 'local';
        leaderboard = getLocalLeaderboard();
      }
    } else {
      // Fallback to local storage if leaderboardManager is not available
      console.warn('Leaderboard manager not available, using local storage');
      dataSource = 'local';
      leaderboard = getLocalLeaderboard();
    }

    // Validate leaderboard data
    if (!Array.isArray(leaderboard)) {
      console.error('Invalid leaderboard data format:', leaderboard);
      leaderboard = [];
    }

    // Sort by score in descending order and limit to top 10
    const sortedLeaderboard = leaderboard
      .filter(entry => entry && (typeof entry.score === 'number' || !isNaN(parseInt(entry.score))))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Clear and update the leaderboard
    ELEMENTS.leaderboardElement.innerHTML = '';

    // Add header with data source indicator
    const header = document.createElement('li');
    header.className = 'leaderboard-header';
    header.innerHTML = `<strong>Top Scores</strong>${dataSource === 'local' ? ' <span class="local-data">(Local Data)</span>' : ''}`;
    ELEMENTS.leaderboardElement.appendChild(header);

    if (sortedLeaderboard.length === 0) {
      const li = document.createElement('li');
      li.className = 'no-scores';
      li.textContent = 'No scores yet. Be the first!';
      ELEMENTS.leaderboardElement.appendChild(li);
      return;
    }

    // Add entries to the leaderboard
    sortedLeaderboard.forEach((entry, index) => {
      const li = document.createElement('li');
      // Handle both backend format (username) and local format (name)
      const name = entry.username || entry.name || 'Anonymous';
      const score = typeof entry.score === 'number' ? entry.score : parseInt(entry.score) || 0;
      
      li.className = index < 3 ? `top-${index + 1}` : '';
      li.innerHTML = `<span class="rank">${index + 1}.</span> <span class="name">${name}</span>: <span class="score">${score}</span>`;
      ELEMENTS.leaderboardElement.appendChild(li);
    });

  } catch (error) {
    console.error('Error in renderLeaderboard:', error);
    if (ELEMENTS.leaderboardElement) {
      ELEMENTS.leaderboardElement.innerHTML = 
        '<li class="error">Error loading leaderboard</li>' +
        '<li class="error-details">Using local data instead</li>';
      
      // Try to show local data as fallback
      try {
        const localData = getLocalLeaderboard();
        if (localData && localData.length > 0) {
          const header = document.createElement('li');
          header.className = 'local-header';
          header.innerHTML = '<strong>Local Scores</strong>';
          ELEMENTS.leaderboardElement.appendChild(header);
          
          localData
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .forEach((entry, index) => {
              const li = document.createElement('li');
              li.textContent = `${index + 1}. ${entry.name || 'Anonymous'}: ${entry.score}`;
              ELEMENTS.leaderboardElement.appendChild(li);
            });
        }
      } catch (localError) {
        console.error('Failed to show local leaderboard fallback:', localError);
      }
    }
  }
}

function endGame() {
  try {
    console.log('Game ended');
    
    // Dispatch game over event to React
    document.dispatchEvent(new CustomEvent(GAME_EVENTS.GAME_OVER, {
      detail: {
        score: score,
        maxScore: MAX_SCORE,
        correctAnswer: currentItem?.name?.['name-USen'] || 'Unknown'
      }
    }));
    
    // Update score display if element exists
    if (ELEMENTS.scoreElement) {
      ELEMENTS.scoreElement.textContent = `Score: ${score}`;
      if (ELEMENTS.feedback && currentItem && currentItem.name && currentItem.name["name-USen"]) {
        ELEMENTS.feedback.textContent = `❌ Incorrect! The correct answer was: ${currentItem.name["name-USen"]}`;
        ELEMENTS.feedback.className = 'incorrect';
      }
    }
    
    // Disable all buttons and input if they exist
    if (ELEMENTS.guessInput) {
      ELEMENTS.guessInput.disabled = true;
      ELEMENTS.guessInput.style.display = 'none';
    }
    
    if (ELEMENTS.submitButton) {
      ELEMENTS.submitButton.disabled = true;
      ELEMENTS.submitButton.style.display = 'none';
    }
    
    if (ELEMENTS.nextButton) {
      ELEMENTS.nextButton.style.display = 'none';
    }
    
    if (ELEMENTS.startButton) {
      ELEMENTS.startButton.disabled = false;
      ELEMENTS.startButton.style.display = 'block';
    }
    
    // Get the game container from cached elements if possible
    const gameContainer = ELEMENTS.gameContainer || document.getElementById('game-container');
    if (!gameContainer) {
      console.error('Game container not found');
      return;
    }
    
    // Check if a restart button already exists and remove it
    const existingRestartButton = document.querySelector('.restart-button');
    if (existingRestartButton) {
      existingRestartButton.remove();
    }
    
    // Add a restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Play Again';
    restartButton.className = 'game-button restart-button';
    restartButton.style.marginTop = '20px';
    restartButton.onclick = () => {
      // Remove the restart button
      restartButton.remove();
      
      // Reset the game
      resetGame();
      initGame();
    };
    
    // Add the restart button to the game container
    gameContainer.appendChild(restartButton);
    
    // Stop the timer if it's running
    stopTimer();
    
    // Hide timer container if it exists
    if (ELEMENTS.timerContainer) {
      ELEMENTS.timerContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Error in endGame:', error);
  }
}

// Reset the game to its initial state
function resetGame() {
  try {
    console.log('Resetting game...');
    
    // Stop any running timers
    stopTimer();
    
    // Reset game state
    score = 0;
    timeLeft = 10; // Reset to default time
    
    // Reset UI elements
    if (ELEMENTS.scoreElement) ELEMENTS.scoreElement.textContent = '0';
    if (ELEMENTS.feedback) {
      ELEMENTS.feedback.textContent = '';
      ELEMENTS.feedback.className = '';
    }
    if (ELEMENTS.guessInput) {
      ELEMENTS.guessInput.value = '';
      ELEMENTS.guessInput.disabled = false;
      ELEMENTS.guessInput.style.display = 'block';
    }
    if (ELEMENTS.submitButton) {
      ELEMENTS.submitButton.disabled = false;
      ELEMENTS.submitButton.style.display = 'inline-block';
    }
    if (ELEMENTS.timerContainer) {
      ELEMENTS.timerContainer.style.display = 'block';
    }
    
    // Remove any existing restart buttons
    const existingRestartButton = document.querySelector('.restart-button');
    if (existingRestartButton) {
      existingRestartButton.remove();
    }
    
    console.log('Game reset complete');
  } catch (error) {
    console.error('Error in resetGame:', error);
  }
}

// === React Integration ===
function setupReactEventListeners() {
  try {
    // Listen for game start from React
    document.addEventListener(GAME_EVENTS.GAME_START, (e) => {
      console.log('Game started from React');
      if (typeof initGame === 'function') {
        initGame();
      }
    });

    // Listen for game pause from React
    document.addEventListener(GAME_EVENTS.GAME_PAUSE, (e) => {
      console.log('Game paused from React');
      if (typeof stopTimer === 'function') {
        stopTimer();
      }
    });

    // Listen for game reset from React
    document.addEventListener(GAME_EVENTS.GAME_RESET, (e) => {
      console.log('Game reset from React');
      resetGame();
    });

    // Listen for score submission from React
    document.addEventListener(GAME_EVENTS.SCORE_SUBMIT, async (e) => {
      const { name, score, category = 'fish' } = e.detail || {};
      if (!name || typeof score === 'undefined') {
        console.error('Invalid score submission data');
        return;
      }
      
      console.log(`Score submitted from React: ${name} - ${score} (${category})`);
      
      try {
        if (typeof saveScoreToLeaderboard === 'function') {
          await saveScoreToLeaderboard(name, score, category);
        }
        if (typeof renderLeaderboard === 'function') {
          await renderLeaderboard();
        }
        resetGame();
      } catch (error) {
        console.error('Error submitting score:', error);
        // Dispatch error event
        document.dispatchEvent(new CustomEvent(GAME_EVENTS.ERROR, {
          detail: {
            type: 'score_submission_failed',
            message: 'Failed to submit score',
            details: error.message
          }
        }));
      }
    });

    // Update React with initial game state
    document.dispatchEvent(new CustomEvent(GAME_EVENTS.STATE_UPDATE, {
      detail: {
        isPlaying: false,
        score: 0,
        highScore: localStorage.getItem('highScore') || 0,
        timeLeft: 0,
        category: (ELEMENTS.category && ELEMENTS.category.value) || 'fish',
        difficulty: 'medium'
      }
    }));

    console.log('React event listeners initialized');
    return true;
  } catch (error) {
    console.error('Error initializing React event listeners:', error);
    return false;
  }
}