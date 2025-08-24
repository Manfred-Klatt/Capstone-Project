/**
 * Leaderboard Manager
 * Handles leaderboard display and score submission integration
 */

class LeaderboardManager {
    constructor() {
        this.api = window.LeaderboardAPI;
        this.currentCategory = 'fish';
        this.isLoading = false;
    }

    /**
     * Initialize leaderboard functionality
     */
    async init() {
        try {
            await this.loadAllLeaderboards();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize leaderboard manager:', error);
        }
    }

    /**
     * Submit score after game completion
     * @param {Object} gameResult - Game completion data
     * @param {string} gameResult.category - Game category
     * @param {number} gameResult.score - Final score
     * @param {number} gameResult.correctAnswers - Correct answers
     * @param {number} gameResult.totalQuestions - Total questions
     * @param {number} gameResult.timeTaken - Time in seconds
     * @param {string} gameResult.difficulty - Difficulty level
     */
    async submitGameScore(gameResult) {
        // Check if user is authenticated
        if (!this.api.isAuthenticated()) {
            // Check if this is a high score that deserves leaderboard entry
            const isHighScore = await this.checkIfHighScore(gameResult.category, gameResult.score);
            
            if (isHighScore) {
                // Prompt guest user for name
                const guestName = await this.promptGuestName(gameResult.score);
                if (guestName) {
                    // Try to submit to global leaderboard
                    const submitted = await this.submitGuestScore(
                        guestName, 
                        gameResult.category, 
                        gameResult.score, 
                        {
                            correctAnswers: gameResult.correctAnswers,
                            totalQuestions: gameResult.totalQuestions,
                            accuracy: gameResult.accuracy,
                            timeTaken: gameResult.timeTaken
                        }
                    );
                    
                    // Always save locally as backup
                    this.saveGuestScoreLocally({
                        ...gameResult,
                        playerName: guestName,
                        timestamp: new Date().toISOString()
                    });
                    
                    return submitted;
                }
            }
            
            console.log('Guest user - score not submitted to global leaderboard');
            return null;
        }

        try {
            const scoreData = {
                category: gameResult.category,
                score: gameResult.score,
                gameData: {
                    correctAnswers: gameResult.correctAnswers,
                    totalQuestions: gameResult.totalQuestions,
                    timeTaken: gameResult.timeTaken,
                    difficulty: gameResult.difficulty || 'medium'
                }
            };

            const result = await this.api.submitScore(scoreData);
            
            // Show success notification
            this.showScoreSubmissionResult(result.data.entry);
            
            // Refresh leaderboards to show updated rankings
            await this.loadAllLeaderboards();
            
            return result;
        } catch (error) {
            console.error('Failed to submit score:', error);
            this.showScoreSubmissionError(error.message);
            return null;
        }
    }

    /**
     * Load and display all leaderboards
     */
    async loadAllLeaderboards() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            const response = await this.api.getAllLeaderboards(10);
            const leaderboards = response.data.leaderboards;
            
            // Update each category's leaderboard display
            Object.keys(leaderboards).forEach(category => {
                this.updateLeaderboardDisplay(category, leaderboards[category]);
            });
            
            // Update last updated timestamp
            this.updateLastUpdatedTime(response.data.lastUpdated);
            
        } catch (error) {
            console.error('Failed to load leaderboards:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Update leaderboard display for a specific category
     * @param {string} category - Category name
     * @param {Array} entries - Leaderboard entries
     */
    updateLeaderboardDisplay(category, entries) {
        const container = document.getElementById(`${category}-leaderboard`);
        if (!container) return;

        const html = entries.map(entry => `
            <div class="leaderboard-entry ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}">
                <div class="rank">#${entry.rank}</div>
                <div class="player-info">
                    <div class="username">${this.escapeHtml(entry.username)}</div>
                    <div class="game-stats">
                        ${entry.gameData.correctAnswers}/${entry.gameData.totalQuestions} correct
                        • ${this.formatTime(entry.gameData.timeTaken)}
                    </div>
                </div>
                <div class="score">${entry.score}</div>
                <div class="timestamp">${this.formatRelativeTime(entry.timestamp)}</div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Show score submission success notification
     * @param {Object} entry - Submission result
     */
    showScoreSubmissionResult(entry) {
        const message = entry.isPersonalBest 
            ? `🎉 New Personal Best! Score: ${entry.score} (Rank #${entry.rank})`
            : `Score submitted: ${entry.score} (Rank #${entry.rank})`;
        
        this.showNotification(message, 'success');
    }

    /**
     * Show score submission error notification
     * @param {string} errorMessage - Error message
     */
    showScoreSubmissionError(errorMessage) {
        this.showNotification(`Failed to submit score: ${errorMessage}`, 'error');
    }

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-leaderboards');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAllLeaderboards();
            });
        }

        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                if (category) {
                    this.switchCategory(category);
                }
            });
        });
    }

    /**
     * Switch active leaderboard category
     * @param {string} category - Category to switch to
     */
    switchCategory(category) {
        this.currentCategory = category;
        
        // Update tab states
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        // Show/hide leaderboard sections
        document.querySelectorAll('.leaderboard-section').forEach(section => {
            section.classList.toggle('active', section.dataset.category === category);
        });
    }

    /**
     * Update last updated timestamp
     * @param {string} timestamp - ISO timestamp
     */
    updateLastUpdatedTime(timestamp) {
        const element = document.getElementById('last-updated');
        if (element) {
            element.textContent = `Last updated: ${this.formatRelativeTime(timestamp)}`;
        }
    }

    /**
     * Format time in seconds to readable format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Format timestamp to relative time
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Relative time
     */
    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return time.toLocaleDateString();
    }

    /**
     * Check if score qualifies as a high score for guest submission
     * @param {string} category - Game category
     * @param {number} score - Player's score
     * @returns {Promise<boolean>} Whether this is a high score
     */
    async checkIfHighScore(category, score) {
        try {
            const response = await this.api.getLeaderboard(category, 10);
            const leaderboard = response.data.entries;
            
            // If leaderboard has less than 10 entries, it's a high score
            if (leaderboard.length < 10) return true;
            
            // Check if score beats the lowest score in top 10
            const lowestScore = leaderboard[leaderboard.length - 1].score;
            return score > lowestScore;
        } catch (error) {
            // If we can't check, assume it's worth submitting
            console.log('Could not check high score status, allowing submission');
            return score >= 100; // Minimum threshold for guest submission
        }
    }

    /**
     * Prompt guest user to enter their name for leaderboard
     * @param {number} score - The achieved score
     * @returns {Promise<string|null>} Guest name or null if cancelled
     */
    async promptGuestName(score) {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'guest-name-overlay';
            overlay.innerHTML = `
                <div class="guest-name-modal">
                    <div class="modal-header">
                        <h2>🎉 High Score Achieved!</h2>
                        <p>Your score of <strong>${score}</strong> qualifies for the global leaderboard!</p>
                    </div>
                    <div class="modal-body">
                        <label for="guest-name-input">Enter your name to save your score:</label>
                        <input type="text" id="guest-name-input" maxlength="10" placeholder="Your name" autocomplete="off">
                        <div class="name-requirements">
                            <small>• Maximum 10 characters</small>
                            <small>• Letters, numbers, and basic symbols only</small>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="submit-guest-name">Save to Leaderboard</button>
                        <button class="btn btn-secondary" id="skip-guest-name">Skip</button>
                    </div>
                </div>
            `;

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .guest-name-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                
                .guest-name-modal {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease;
                }
                
                .modal-header {
                    text-align: center;
                    margin-bottom: 25px;
                }
                
                .modal-header h2 {
                    color: #4CAF50;
                    margin: 0 0 10px 0;
                    font-size: 1.5rem;
                }
                
                .modal-header p {
                    color: #666;
                    margin: 0;
                }
                
                .modal-body {
                    margin-bottom: 25px;
                }
                
                .modal-body label {
                    display: block;
                    margin-bottom: 10px;
                    font-weight: bold;
                    color: #333;
                }
                
                #guest-name-input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    font-size: 16px;
                    box-sizing: border-box;
                    margin-bottom: 10px;
                }
                
                #guest-name-input:focus {
                    outline: none;
                    border-color: #4CAF50;
                }
                
                .name-requirements {
                    color: #666;
                    font-size: 0.8rem;
                }
                
                .name-requirements small {
                    display: block;
                    margin: 2px 0;
                }
                
                .modal-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: background-color 0.3s;
                }
                
                .btn-primary {
                    background: #4CAF50;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #45a049;
                }
                
                .btn-secondary {
                    background: #ccc;
                    color: #333;
                }
                
                .btn-secondary:hover {
                    background: #bbb;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(overlay);

            const nameInput = document.getElementById('guest-name-input');
            const submitBtn = document.getElementById('submit-guest-name');
            const skipBtn = document.getElementById('skip-guest-name');

            // Focus input
            nameInput.focus();

            // Validate name input
            const validateName = (name) => {
                if (!name || name.trim().length === 0) return false;
                if (name.length > 10) return false;
                if (!/^[a-zA-Z0-9_\-\s]+$/.test(name)) return false;
                return true;
            };

            // Handle submit
            const handleSubmit = () => {
                const name = nameInput.value.trim();
                if (validateName(name)) {
                    cleanup();
                    resolve(name);
                } else {
                    nameInput.style.borderColor = '#f44336';
                    nameInput.focus();
                }
            };

            // Handle skip
            const handleSkip = () => {
                cleanup();
                resolve(null);
            };

            // Cleanup function
            const cleanup = () => {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
            };

            // Event listeners
            submitBtn.addEventListener('click', handleSubmit);
            skipBtn.addEventListener('click', handleSkip);
            
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
            });

            nameInput.addEventListener('input', () => {
                nameInput.style.borderColor = '#ddd';
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    handleSkip();
                }
            });
        });
    }

    /**
     * Submit score for guest user
     * @param {Object} gameResult - Game result data
     * @param {string} guestName - Guest's chosen name
     * @returns {Promise<Object|null>} Submission result
     */
    async submitGuestScore(gameResult, guestName) {
        try {
            // For now, we'll store guest scores locally and show a message
            // In a real implementation, you might want a separate guest endpoint
            
            this.showNotification(
                `🎉 Score saved locally! Sign up to compete on global leaderboards and track your progress.`,
                'info'
            );

            // Store locally for now
            this.saveGuestScoreLocally(gameResult, guestName);
            
            return {
                success: true,
                isGuest: true,
                name: guestName,
                score: gameResult.score
            };
        } catch (error) {
            console.error('Failed to submit guest score:', error);
            this.showScoreSubmissionError('Failed to save guest score');
            return null;
        }
    }

    /**
     * Save guest score to local storage
     * @param {Object} gameResult - Game result data
     * @param {string} guestName - Guest's name
     */
    saveGuestScoreLocally(gameResult, guestName) {
        try {
            const guestScores = JSON.parse(localStorage.getItem('guestScores') || '{}');
            
            if (!guestScores[gameResult.category]) {
                guestScores[gameResult.category] = [];
            }
            
            guestScores[gameResult.category].push({
                name: guestName,
                score: gameResult.score,
                gameData: {
                    correctAnswers: gameResult.correctAnswers,
                    totalQuestions: gameResult.totalQuestions,
                    timeTaken: gameResult.timeTaken,
                    difficulty: gameResult.difficulty || 'medium'
                },
                timestamp: new Date().toISOString(),
                isGuest: true
            });
            
            // Keep only top 20 guest scores per category
            guestScores[gameResult.category].sort((a, b) => b.score - a.score);
            guestScores[gameResult.category] = guestScores[gameResult.category].slice(0, 20);
            
            localStorage.setItem('guestScores', JSON.stringify(guestScores));
        } catch (error) {
            console.error('Failed to save guest score locally:', error);
        }
    }

    /**
     * Get connection status for UI display
     * @returns {Object} Connection status info
     */
    getConnectionStatus() {
        // Check if we can reach the API
        const isOnline = navigator.onLine;
        const hasBackend = this.api.isAuthenticated() || this.lastBackendCheck;
        
        return {
            isOnline,
            hasBackend,
            mode: hasBackend ? 'global' : 'local',
            statusText: hasBackend ? 'Global Leaderboards' : 'Local Scores Only'
        };
    }

    /**
     * Submit guest score to backend (creates temporary account)
     * @param {string} guestName - Guest's chosen name
     * @param {string} category - Game category
     * @param {number} score - Final score
     * @param {Object} gameData - Additional game statistics
     * @returns {Promise<boolean>} Success status
     */
    async submitGuestScore(guestName, category, score, gameData = {}) {
        try {
            // Create a temporary guest account
            const guestData = {
                username: guestName,
                email: `guest_${Date.now()}@temp.local`,
                password: `temp_${Math.random().toString(36).substring(7)}`,
                isGuest: true
            };

            // Try to register the guest account
            const registerResponse = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(guestData)
            });

            if (!registerResponse.ok) {
                throw new Error('Failed to create guest account');
            }

            const { token } = await registerResponse.json();

            // Submit the score with the guest token
            const scoreResponse = await fetch('/api/v1/leaderboard/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    category,
                    score,
                    gameData: {
                        ...gameData,
                        isGuestSubmission: true,
                        submittedAt: new Date().toISOString()
                    }
                })
            });

            if (scoreResponse.ok) {
                this.showNotification(`Score submitted to global leaderboard as ${guestName}!`);
                return true;
            } else {
                throw new Error('Failed to submit guest score');
            }
        } catch (error) {
            console.error('Guest score submission failed:', error);
            this.showNotification('Failed to submit to global leaderboard. Score saved locally.');
            return false;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new LeaderboardManager();
    window.leaderboardManager.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardManager;
}
