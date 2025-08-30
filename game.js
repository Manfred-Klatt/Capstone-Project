// === Constants ===
const API_BASE = 'https://api.nookipedia.com';
const TIMEOUT = 5000;
const MAX_SCORE = 10;

// === Cached Elements ===
const ELEMENTS = {};

// Function to cache DOM elements
function cacheDOMElements() {
  // Get elements using their correct IDs from the HTML
  ELEMENTS.category = document.getElementById('category');
  ELEMENTS.guessInput = document.getElementById('guess-input');
  ELEMENTS.submitButton = document.getElementById('submit-guess');
  ELEMENTS.nextButton = document.getElementById('next-btn'); // Fixed: next-btn instead of next-button
  ELEMENTS.startButton = document.getElementById('start-game-btn'); // Fixed: start-game-btn instead of start-game
  ELEMENTS.feedback = document.getElementById('feedback');
  ELEMENTS.imageDisplay = document.getElementById('imageDisplay'); // Fixed: imageDisplay instead of image-display
  ELEMENTS.scoreElement = document.getElementById('score');
  ELEMENTS.highScoreElement = document.getElementById('high-score');
  ELEMENTS.timerElement = document.getElementById('game-timer'); // Fixed: game-timer instead of timer
  ELEMENTS.timerContainer = document.getElementById('game-timer-container'); // Added timer container
  ELEMENTS.timerDisplay = document.getElementById('game-timer'); // Fixed: game-timer instead of timer
  ELEMENTS.leaderboardElement = document.querySelector('.category-leaderboard.active'); // Using querySelector for active leaderboard
  ELEMENTS.gameContainer = document.getElementById('game-container');
  
  // Log which elements were not found
  Object.entries(ELEMENTS).forEach(([key, element]) => {
    if (!element) {
      console.warn(`DOM element not found: ${key}`);
    }
  });
}

// === Cached Data ===
let cachedData = {};
let score = 0;
let currentItem = null;
let timeLeft = 15;
let timerInterval;

// === Timer Functions ===
function startTimer() {
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  timeLeft--;
  
  // Update timer display using cached element
  updateTimerDisplay();
  
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
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
    
    // Cache all DOM elements first
    cacheDOMElements();
    
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
      // Fix the start button to call initGame instead of setupNewRound
      ELEMENTS.startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        initGame();
      });
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
    timeLeft = 15;
    
    // Update UI elements with null checks
    if (ELEMENTS.scoreElement) {
      ELEMENTS.scoreElement.textContent = `Score: ${score}`;
    }
    
    if (ELEMENTS.timerElement) {
      ELEMENTS.timerElement.textContent = `Time: ${timeLeft}s`;
    }
    
    if (ELEMENTS.feedback) {
      ELEMENTS.feedback.textContent = 'Welcome! Click Start Game to begin.';
    }

    // Disable input until game starts
    if (ELEMENTS.guessInput) {
      ELEMENTS.guessInput.disabled = true;
    }
    
    if (ELEMENTS.submitButton) {
      ELEMENTS.submitButton.disabled = true;
    }
    
    if (ELEMENTS.startButton) {
      ELEMENTS.startButton.disabled = false;
    }
    
    // Initialize leaderboard
    renderLeaderboard();

  } catch (error) {
    console.error('Error initializing game:', error);
  }
});

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

// API data fetching function
async function fetchDataFromAPI(category) {
  try {
    const response = await fetch(`${API_BASE}/${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
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
    document.getElementById('greeting').textContent = `Hello, ${email.split('@')[0]}!`;
    document.getElementById('loginForm').reset();
  }
}

// === Game Logic ===
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
        ELEMENTS.feedback.textContent = 'Please enter a guess!';
        ELEMENTS.feedback.className = 'warning';
      }
      return;
    }

    // Process the guess
    handleGuess(userGuess);
    
    // Update score display
    if (ELEMENTS.scoreElement) {
      ELEMENTS.scoreElement.textContent = `Score: ${score}`;
    }
    
    // Reset input field
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
    // Stop the timer first
    stopTimer();
    
    // Check if we have a current item
    if (!currentItem) {
      console.error('No current item set');
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = 'Error: No item to guess. Please start a new game.';
        ELEMENTS.feedback.className = 'error';
      }
      return;
    }

    // Get the correct answer
    const correctName = currentItem.name?.["name-USen"];
    if (!correctName) {
      console.error('Current item has no name property');
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = 'Error: Invalid item data. Please try again.';
        ELEMENTS.feedback.className = 'error';
      }
      return;
    }
    
    // Check if the guess is correct
    if (userGuess.toLowerCase() === correctName.toLowerCase()) {
      // Handle correct answer
      score++;
      
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = "Correct!";
        ELEMENTS.feedback.className = "correct";
      }
      
      // Start new round after brief delay
      setTimeout(() => {
        setupNewRound();
        // Focus on input field if it exists
        if (ELEMENTS.guessInput) {
          ELEMENTS.guessInput.focus();
        }
      }, 1000);
    } else {
      // Handle incorrect answer
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = `Incorrect! The correct answer was: ${correctName}`;
        ELEMENTS.feedback.className = "error";
      }
      endGame();
    }

    // Update score display
    if (ELEMENTS.scoreElement) {
      ELEMENTS.scoreElement.textContent = `Score: ${score}`;
    }
    
    // Reset input field
    if (ELEMENTS.guessInput) {
      ELEMENTS.guessInput.value = '';
      ELEMENTS.guessInput.focus();
    }
  } catch (error) {
    console.error('Error in handleGuess:', error);
    if (ELEMENTS.feedback) {
      ELEMENTS.feedback.textContent = 'An error occurred. Please try again.';
      ELEMENTS.feedback.className = 'error';
    }
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
    
    // Reset timer state
    timeLeft = 15;
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
  // Use cached elements instead of querying the DOM again
  const category = ELEMENTS.category ? ELEMENTS.category.value : 'fish';
  
  if (ELEMENTS.feedback) {
    ELEMENTS.feedback.textContent = "Loading...";
  }
  
  // Define API base and proxy URL
  const apiBase = 'https://api.nookipedia.com/';
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  
  if (!cachedData[category]) {
    try {
      // Try to fetch data directly first
      try {
        const apiData = await fetchDataFromAPI(category);
        cachedData[category] = apiData;
      } catch (directError) {
        console.log('Direct API fetch failed, trying proxy:', directError);
        // Fall back to proxy if direct fetch fails
        const apiData = await fetchWithTimeout(`${proxyUrl}${encodeURIComponent(apiBase + category + "/")}`);
        cachedData[category] = apiData;
      }
    } catch (error) {
      if (ELEMENTS.feedback) {
        ELEMENTS.feedback.textContent = `Failed to load ${category}. Please try again later.`;
      }
      console.error('Failed to load data:', error);
      return;
    }
  }
  
  // Only proceed if we have data
  if (cachedData[category] && cachedData[category].length > 0) {
    currentItem = getRandomItem(cachedData[category]);
    displayImageFromData(currentItem);
    
    // Enable input fields using cached elements
    if (ELEMENTS.guessInput) ELEMENTS.guessInput.disabled = false;
    if (ELEMENTS.submitButton) ELEMENTS.submitButton.disabled = false;
    if (ELEMENTS.scoreElement) ELEMENTS.scoreElement.textContent = `Score: ${score}`;
    
    // Start a new round
    setupNewRound();
  } else {
    console.error('No data available for category:', category);
    if (ELEMENTS.feedback) {
      ELEMENTS.feedback.textContent = `No data available for ${category}. Please try another category.`;
    }
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
    ELEMENTS.highScoreElement.textContent = `High Score: ${score}`;
  }
}

function displayImageFromData(data) {
  if (!data || !data.image_uri) {
    console.error('No image data available');
    return;
  }
  
  if (!ELEMENTS.imageDisplay) {
    console.error('Image display element not found');
    return;
  }
  
  const img = document.createElement("img");
  img.src = data.image_uri;
  img.alt = data.name?.["name-USen"] || "Animal Crossing item";
  
  // Define proxyUrl for error handling
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  
  img.onerror = () => {
    console.log('Image load error, trying proxy');
    img.src = `${proxyUrl}${encodeURIComponent(data.image_uri)}`;
  };
  
  ELEMENTS.imageDisplay.innerHTML = "";
  ELEMENTS.imageDisplay.appendChild(img);
  ELEMENTS.imageDisplay.style.display = "block";
}

function updateTimerDisplay() {
  if (ELEMENTS.timerElement) {
    ELEMENTS.timerElement.style.display = 'block';
    ELEMENTS.timerElement.style.visibility = 'visible';
    ELEMENTS.timerElement.textContent = `Time left: ${timeLeft}s`;
    console.log('Timer updated:', timeLeft); // Debug log
  } else {
    console.error('Timer element not found');
  }
}

// === Leaderboard ===
function saveScoreToLeaderboard(name, score) {
  const key = "acnh_leaderboard";
  let leaderboard = JSON.parse(localStorage.getItem(key)) || [];
  leaderboard.push({
    name,
    score
  });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(leaderboard));
}

function getLeaderboard() {
  return JSON.parse(localStorage.getItem("acnh_leaderboard")) || [];
}

function renderLeaderboard() {
  const leaderboard = getLeaderboard();
  
  if (!ELEMENTS.leaderboardElement) {
    console.error('Leaderboard element not found');
    return;
  }
  
  ELEMENTS.leaderboardElement.innerHTML = "";
  
  if (leaderboard.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'No scores yet. Be the first!';
    emptyMessage.className = 'empty-leaderboard';
    ELEMENTS.leaderboardElement.appendChild(emptyMessage);
    return;
  }
  
  leaderboard.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.name}: ${entry.score}`;
    ELEMENTS.leaderboardElement.appendChild(li);
  });
}

function endGame() {
  try {
    console.log('Game ended');
    
    // Reset the score
    score = 0;
    
    // Update score display if element exists
    if (ELEMENTS.scoreElement) {
      ELEMENTS.scoreElement.textContent = `Score: ${score}`;
    }
    
    // Show feedback if element exists
    if (ELEMENTS.feedback && currentItem && currentItem.name && currentItem.name["name-USen"]) {
      ELEMENTS.feedback.textContent = `❌ Incorrect! The correct answer was: ${currentItem.name["name-USen"]}`;
      ELEMENTS.feedback.className = 'incorrect';
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
      initGame(); // Call initGame instead of setupNewRound to properly reset everything
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

// === Helpers ===
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.textContent = message;
  field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearErrors() {
  document.querySelectorAll('.error').forEach(err => err.remove());
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}