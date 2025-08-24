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
            console.log('User not authenticated, skipping score submission');
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
