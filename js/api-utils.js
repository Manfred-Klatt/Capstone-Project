/**
 * Enhanced API utilities for Animal Crossing Quiz Game
 * Provides improved error handling, offline detection, and session management
 */

// Enhanced error handling for API requests
// Base API URL - using relative path to avoid CORS issues
const BASE_API_URL = '/api';

function apiRequest(endpoint, method, data) {
    // Ensure endpoint starts with a slash
    if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
    }
    
    // Construct the full URL
    const url = BASE_API_URL + endpoint;
    return new Promise((resolve, reject) => {
        const options = {
            method: method || 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        };
        
        // Add authorization header if token exists
        const token = window.secureTokenManager ? window.secureTokenManager.getToken() : localStorage.getItem('acnh_token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add body for non-GET requests
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        // Set timeout for fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        options.signal = controller.signal;
        
        fetch(url, options)
            .then(response => {
                clearTimeout(timeoutId);
                
                // Handle rate limiting
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After') || '60';
                    throw new Error(`Too many requests. Please try again in ${retryAfter} seconds.`);
                }
                
                // Handle server errors
                if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.');
                }
                
                // Handle authentication errors
                if (response.status === 401 || response.status === 403) {
                    // Clear token and redirect to login if unauthorized
                    if (window.secureTokenManager) {
                        window.secureTokenManager.clearToken();
                    } else {
                        localStorage.removeItem('acnh_token');
                    }
                    if (!window.location.pathname.includes('index.html')) {
                        window.location.href = 'index.html?session_expired=true';
                        throw new Error('Your session has expired. Please log in again.');
                    }
                }
                
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                resolve(data);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                
                // Handle network errors and timeouts
                if (error.name === 'AbortError') {
                    error = new Error('Request timed out. Please check your connection and try again.');
                } else if (error.message === 'Failed to fetch') {
                    error = new Error('Network error. Please check your connection and try again.');
                    
                    // Offer standalone mode if appropriate
                    if (!window.standaloneConfirmedThisSession && 
                        !window.location.pathname.includes('index.html')) {
                        offerStandaloneMode();
                    }
                }
                
                reject(error);
            });
    });
}

// Function to update leaderboard with improved error handling
function updateLeaderboard(category) {
    // First check if we're in standalone mode
    if (window.standaloneMode) {
        return updateLocalLeaderboard(category);
    }
    
    // Show loading state
    const leaderboardElement = document.getElementById(`${category}-scores`);
    if (leaderboardElement) {
        leaderboardElement.innerHTML = '<div class="loading">Loading leaderboard...</div>';
    }
    
    // Attempt to fetch from server
    apiRequest(`/api/leaderboard/${category}`)
        .then(leaderboard => {
            displayLeaderboard(category, leaderboard);
        })
        .catch(error => {
            console.error(`Error fetching ${category} leaderboard:`, error);
            
            // If server is unreachable, offer standalone mode
            if (error.message.includes('Network error') || error.message.includes('timed out')) {
                if (!window.standaloneConfirmedThisSession) {
                    offerStandaloneMode();
                } else {
                    // Fall back to local leaderboard
                    updateLocalLeaderboard(category);
                }
            } else {
                // Show error in leaderboard
                if (leaderboardElement) {
                    leaderboardElement.innerHTML = `<div class="error">Error: ${error.message}</div>`;
                }
            }
        });
}

// Function to check if score is a high score with improved error handling
function isHighScore(category, score) {
    return new Promise((resolve, reject) => {
        // In standalone mode, check against local storage
        if (window.standaloneMode) {
            const categoryKey = `acnh_high_score_${category}`;
            const currentHighScore = parseInt(localStorage.getItem(categoryKey) || '0', 10);
            resolve(score > currentHighScore);
            return;
        }
        
        // Check with server
        const token = window.secureTokenManager ? window.secureTokenManager.getToken() : localStorage.getItem('acnh_token');
        if (!token) {
            // Not logged in, check against local storage
            const categoryKey = `acnh_high_score_${category}`;
            const currentHighScore = parseInt(localStorage.getItem(categoryKey) || '0', 10);
            resolve(score > currentHighScore);
            return;
        }
        
        // Fetch user profile to get high scores
        apiRequest('/api/profile')
            .then(data => {
                const currentHighScore = data.highScores[category] || 0;
                resolve(score > currentHighScore);
            })
            .catch(error => {
                console.error('Error checking high score:', error);
                
                // Fall back to local storage if server is unreachable
                if (error.message.includes('Network error') || error.message.includes('timed out')) {
                    const categoryKey = `acnh_high_score_${category}`;
                    const currentHighScore = parseInt(localStorage.getItem(categoryKey) || '0', 10);
                    resolve(score > currentHighScore);
                } else {
                    reject(error);
                }
            });
    });
}

// Function to submit high score with improved error handling
function submitHighScore(category, score) {
    return new Promise((resolve, reject) => {
        // In standalone mode, save to local storage
        if (window.standaloneMode) {
            saveLocalHighScore(category, score);
            resolve({ success: true, message: 'New high score saved locally!', highScore: score });
            return;
        }
        
        // Check if user is logged in
        const token = window.secureTokenManager ? window.secureTokenManager.getToken() : localStorage.getItem('acnh_token');
        if (!token) {
            // Not logged in, save to local storage
            saveLocalHighScore(category, score);
            resolve({ success: true, message: 'New high score saved locally!', highScore: score });
            return;
        }
        
        // Submit to server
        apiRequest('/api/save-score', 'POST', { category, score })
            .then(data => {
                // Also update local storage as backup
                saveLocalHighScore(category, score);
                resolve(data);
                
                // Update leaderboard after successful submission
                updateLeaderboard(category);
            })
            .catch(error => {
                console.error('Error submitting high score:', error);
                
                // If server is unreachable, save locally
                if (error.message.includes('Network error') || error.message.includes('timed out')) {
                    saveLocalHighScore(category, score);
                    resolve({ 
                        success: true, 
                        message: 'New high score saved locally! (Server unavailable)', 
                        highScore: score 
                    });
                    
                    // Offer standalone mode
                    if (!window.standaloneConfirmedThisSession) {
                        offerStandaloneMode();
                    }
                } else {
                    reject(error);
                }
            });
    });
}

// Function to offer standalone mode when server is unavailable
function offerStandaloneMode() {
    // Don't offer again if already confirmed this session
    if (localStorage.getItem('standalone_confirmed_this_session') === 'true') {
        window.standaloneMode = true;
        return;
    }
    
    // Ask user if they want to switch to standalone mode
    if (confirm("Server connection unavailable. Your scores will be saved locally but not shared online. Continue in standalone mode?")) {
        // Set flags for standalone mode
        localStorage.setItem('standalone_confirmed_this_session', 'true');
        localStorage.setItem('force_standalone', 'true');
        window.standaloneMode = true;
        
        // Update the standalone mode indicator if it exists
        if (typeof updateStandaloneModeIndicator === 'function') {
            updateStandaloneModeIndicator();
        }
    } else {
        // User declined standalone mode, redirect to index
        window.location.href = 'index.html';
    }
}

// Function to check if the server is available
function checkServerAvailable() {
    return new Promise((resolve) => {
        // Try to connect to the server with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        
        fetch(BASE_API_URL + '/api/leaderboard/fish', {
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            resolve(response.ok);
        })
        .catch(() => {
            clearTimeout(timeoutId);
            resolve(false);
        });
    });
}

// Helper function to save high score to local storage
function saveLocalHighScore(category, score) {
    const categoryKey = `acnh_high_score_${category}`;
    const currentHighScore = parseInt(localStorage.getItem(categoryKey) || '0', 10);
    
    if (score > currentHighScore) {
        localStorage.setItem(categoryKey, score.toString());
        
        // Update local leaderboard
        const savedLeaderboard = localStorage.getItem('acnh_leaderboard');
        let leaderboardData = {};
        
        try {
            leaderboardData = savedLeaderboard ? JSON.parse(savedLeaderboard) : {};
            if (!leaderboardData[category]) {
                leaderboardData[category] = [];
            }
            
            // Add current user's score
            const username = localStorage.getItem('acnh_username') || 'Guest';
            
            // Check if user already has an entry
            const existingIndex = leaderboardData[category].findIndex(entry => entry.username === username);
            
            if (existingIndex >= 0) {
                // Update existing entry if new score is higher
                if (score > leaderboardData[category][existingIndex].score) {
                    leaderboardData[category][existingIndex] = {
                        username,
                        score,
                        date: new Date().toISOString()
                    };
                }
            } else {
                // Add new entry
                leaderboardData[category].push({
                    username,
                    score,
                    date: new Date().toISOString()
                });
            }
            
            // Sort and limit to top 10
            leaderboardData[category].sort((a, b) => b.score - a.score);
            if (leaderboardData[category].length > 10) {
                leaderboardData[category] = leaderboardData[category].slice(0, 10);
            }
            
            // Save updated leaderboard
            localStorage.setItem('acnh_leaderboard', JSON.stringify(leaderboardData));
        } catch (e) {
            console.error('Error updating local leaderboard:', e);
        }
    }
}

// Function to update local leaderboard
function updateLocalLeaderboard(category) {
    const savedLeaderboard = localStorage.getItem('acnh_leaderboard');
    let leaderboardData = {};
    
    try {
        leaderboardData = savedLeaderboard ? JSON.parse(savedLeaderboard) : {};
        if (!leaderboardData[category]) {
            leaderboardData[category] = [];
        }
        
        displayLeaderboard(category, leaderboardData[category]);
    } catch (e) {
        console.error('Error reading local leaderboard:', e);
        const leaderboardElement = document.getElementById(`${category}-scores`);
        if (leaderboardElement) {
            leaderboardElement.innerHTML = '<div class="error">Error loading leaderboard</div>';
        }
    }
}

// Function to display leaderboard data
function displayLeaderboard(category, leaderboard) {
    const leaderboardElement = document.getElementById(`${category}-scores`);
    if (!leaderboardElement) return;
    
    if (!leaderboard || leaderboard.length === 0) {
        leaderboardElement.innerHTML = '<div class="empty">No scores yet</div>';
        return;
    }
    
    let html = '';
    leaderboard.forEach((entry, index) => {
        const date = entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A';
        html += `
            <div class="leaderboard-entry ${index === 0 ? 'top-score' : ''}">
                <span class="rank">${index + 1}</span>
                <span class="username">${entry.username}</span>
                <span class="score">${entry.score}</span>
                <span class="date">${date}</span>
            </div>
        `;
    });
    
    leaderboardElement.innerHTML = html;
}

// Function to offer standalone mode
function offerStandaloneMode() {
    // Only offer once per session
    if (window.standaloneConfirmedThisSession) {
        return;
    }
    
    const confirmStandalone = confirm(
        'The server appears to be unavailable. Would you like to play in standalone mode? ' +
        'Your scores will be saved locally but not shared with other players.'
    );
    
    if (confirmStandalone) {
        window.standaloneMode = true;
        window.standaloneConfirmedThisSession = true;
        
        // Update UI to indicate standalone mode
        const standaloneIndicator = document.createElement('div');
        standaloneIndicator.id = 'standalone-indicator';
        standaloneIndicator.textContent = 'Standalone Mode';
        standaloneIndicator.style.position = 'fixed';
        standaloneIndicator.style.top = '10px';
        standaloneIndicator.style.left = '10px';
        standaloneIndicator.style.backgroundColor = '#ff9800';
        standaloneIndicator.style.color = 'white';
        standaloneIndicator.style.padding = '5px 10px';
        standaloneIndicator.style.borderRadius = '5px';
        standaloneIndicator.style.zIndex = '1000';
        document.body.appendChild(standaloneIndicator);
        
        // Update all leaderboards
        const categories = ['fish', 'bugs', 'sea', 'villagers'];
        categories.forEach(cat => updateLocalLeaderboard(cat));
    } else {
        // User declined standalone mode, redirect to index
        window.location.href = 'index.html';
    }
}

// Initialize standalone mode flag
window.standaloneMode = false;

// Initialize session flag to track if standalone mode has been confirmed this session
if (typeof window.standaloneConfirmedThisSession === 'undefined') {
    window.standaloneConfirmedThisSession = false;
}

// Export functions for use in game.html
window.apiUtils = {
    apiRequest,
    updateLeaderboard,
    isHighScore,
    submitHighScore,
    offerStandaloneMode
};
