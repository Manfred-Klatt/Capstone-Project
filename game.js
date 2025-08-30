// === Constants ===
const API_BASE = 'https://api.nookipedia.com';
const TIMEOUT = 5000;
const MAX_SCORE = 10;

// === Cached Elements ===
const ELEMENTS = {
  imageDisplay: null,
  feedback: null,
  category: null,
  guessInput: null,
  submitButton: null,
  nextButton: null,
  scoreElement: null,
  highScoreElement: null
};

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
  document.getElementById('timer').textContent = `Time: ${timeLeft}`;
  
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
    // Cache DOM elements once
    ELEMENTS.imageDisplay = document.getElementById('imageDisplay');
    ELEMENTS.feedback = document.getElementById('feedback');
    ELEMENTS.category = document.getElementById('category');
    ELEMENTS.guessInput = document.getElementById('guess-input');
    ELEMENTS.submitButton = document.getElementById('submit-guess');
    ELEMENTS.nextButton = document.getElementById('next-btn');
    ELEMENTS.scoreElement = document.getElementById('score');
    ELEMENTS.highScoreElement = document.getElementById('high-score');
    ELEMENTS.startButton = document.getElementById('start-round');
    ELEMENTS.timerDisplay = document.getElementById('timer');

    if (!ELEMENTS.imageDisplay || !ELEMENTS.guessInput || !ELEMENTS.submitButton) {
      console.error('Missing required DOM elements');
      return;
    }

    // Set up event listeners
    ELEMENTS.submitButton.addEventListener('click', submitGuess);
    ELEMENTS.nextButton.addEventListener('click', setupNewRound);
    ELEMENTS.startButton.addEventListener('click', setupNewRound);

    // Allow Enter key to submit guess
    ELEMENTS.guessInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
      }
    });

    // Initialize game
    initAuthHandlers();
    initGame();

    // Initialize game state
    score = 0;
    timeLeft = 15;
    ELEMENTS.scoreElement.textContent = `Score: ${score}`;
    ELEMENTS.timerDisplay.textContent = `Time: ${timeLeft}`;
    ELEMENTS.feedback.textContent = '';

    // Disable input until a round starts
    ELEMENTS.guessInput.disabled = true;
    ELEMENTS.submitButton.disabled = true;
    ELEMENTS.startButton.disabled = false;

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
  const userGuess = ELEMENTS.guessInput.value.trim();
  if (!userGuess) return;

  handleGuess(userGuess);
  ELEMENTS.scoreElement.textContent = `Score: ${score}`;
  ELEMENTS.guessInput.value = '';
  ELEMENTS.guessInput.focus();
}

function handleGuess(userGuess) {
  stopTimer(); // Stop the timer
  
  if (!currentItem) {
    console.error('No current item set');
    return;
  }

  const correctName = currentItem.name["name-USen"];
  
  if (userGuess.toLowerCase() === correctName.toLowerCase()) {
    score++;
    ELEMENTS.feedback.textContent = "Correct!";
    ELEMENTS.feedback.className = "correct";
    
    // Start new round after brief delay
    setTimeout(() => {
      setupNewRound();
      ELEMENTS.guessInput.focus(); // Maintain focus after new round
    }, 1000);
  } else {
    ELEMENTS.feedback.textContent = `Incorrect! The correct answer was: ${correctName}`;
    ELEMENTS.feedback.className = "error";
    endGame();
  }

  ELEMENTS.scoreElement.textContent = `Score: ${score}`;
  ELEMENTS.guessInput.value = '';
  ELEMENTS.guessInput.focus();
}

function setupNewRound() {
  try {
    console.log('Setting up new round');
    
    // Reset feedback
    ELEMENTS.feedback.className = '';
    ELEMENTS.feedback.textContent = `Current Score: ${score}`;
    
    // Get a new item
    const category = ELEMENTS.category.value;
    if (!category) {
      console.error('No category selected');
      return;
    }
    
    currentItem = getRandomItem(cachedData[category]);
    if (!currentItem) {
      console.error('No item found for category:', category);
      return;
    }
    
    // Display the item
    displayImageFromData(currentItem);
    
    // Enable input fields
    ELEMENTS.guessInput.disabled = false;
    ELEMENTS.submitButton.disabled = false;
    ELEMENTS.startButton.disabled = true;
    
    // Reset timer state
    timeLeft = 15;
    ELEMENTS.timerDisplay.textContent = `Time: ${timeLeft}`;
    stopTimer(); // Clear any existing timer
    
    // Start the timer
    startTimer();
    
  } catch (error) {
    console.error('Error setting up new round:', error);
  }
}





// === API & Data ===
async function initGame() {
  const category = categorySelector.value;
  feedbackElement.textContent = "Loading...";
  if (!cachedData[category]) {
    try {
      const apiData = await fetchWithTimeout(`${proxyUrl}${encodeURIComponent(apiBase + category + "/")}`);
      cachedData[category] = apiData;
    } catch (error) {
      feedbackElement.textContent = `Failed to load ${category}`;
      return;
    }
  }
  currentItem = getRandomItem(cachedData[category]);
  displayImageFromData(currentItem);
  document.getElementById("guess-input").disabled = false;
  document.getElementById("submit-guess").disabled = false;
  document.getElementById('score').textContent = `Score: ${score}`;
  setupNewRound(); // Start a new round which will start the timer
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
  if (!data || !data.image_uri) return;
  const img = document.createElement("img");
  img.src = data.image_uri;
  img.alt = data.name?. ["name-USen"] || "Animal Crossing item";
  img.onerror = () => {
    img.src = `${proxyUrl}${encodeURIComponent(data.image_uri)}`;
  };
  imageDisplay.innerHTML = "";
  imageDisplay.appendChild(img);
  imageDisplay.style.display = "block";
}

function updateTimerDisplay() {
  if (timerElement) {
    timerElement.style.display = 'block';
    timerElement.style.visibility = 'visible';
    timerElement.textContent = `Time left: ${timeLeft}s`;
    console.log('Timer updated:', timeLeft); // Debug log
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
  const leaderboardElement = document.getElementById('leaderboard');
  leaderboardElement.innerHTML = "";
  leaderboard.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.name}: ${entry.score}`;
    leaderboardElement.appendChild(li);
  });
}

function endGame() {
  // Reset the score
  score = 0;
  scoreElement.textContent = `Score: ${score}`;
  
  // Show feedback
  feedbackElement.textContent = `❌ Incorrect! The correct answer was: ${currentItem.name["name-USen"]}`;
  feedbackElement.className = 'incorrect';
  
  // Show the correct answer
  imageDisplay.src = currentItem.image;
  
  // Disable all buttons and input
  guessInput.disabled = true;
  submitButton.disabled = true;
  nextButton.style.display = 'none';
  
  // Add a restart button
  const restartButton = document.createElement('button');
  restartButton.textContent = 'Play Again';
  restartButton.className = 'game-button';
  restartButton.style.marginTop = '20px';
  restartButton.onclick = () => {
    // Remove the restart button
    restartButton.remove();
    
    // Reset the game
    setupNewRound();
  };
  
  // Add the restart button to the game container
  document.getElementById('game-container').appendChild(restartButton);
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