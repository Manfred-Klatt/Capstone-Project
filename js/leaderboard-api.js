/**
 * Leaderboard API Integration
 * Handles communication with the backend leaderboard system
 */

class LeaderboardAPI {
    constructor() {
        // Use direct Railway backend URL to avoid Netlify redirect issues
        this.baseURL = 'https://capstone-project-production-3cce.up.railway.app/api/v1/leaderboard';
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Get authentication headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * Submit a score to the leaderboard
     * @param {Object} scoreData - Score submission data
     * @param {string} scoreData.category - Game category (fish, bugs, sea, villagers)
     * @param {number} scoreData.score - Final score
     * @param {Object} scoreData.gameData - Game statistics
     * @param {number} scoreData.gameData.correctAnswers - Number of correct answers
     * @param {number} scoreData.gameData.totalQuestions - Total questions asked
     * @param {number} scoreData.gameData.timeTaken - Time taken in seconds
     * @param {string} scoreData.gameData.difficulty - Difficulty level
     * @returns {Promise<Object>} Submission result
     */
    async submitScore(scoreData) {
        try {
            const response = await fetch(`${this.baseURL}/submit`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(scoreData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit score');
            }

            const result = await response.json();
            console.log('Score submitted successfully:', result);
            return result;
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    }

    /**
     * Get leaderboard for a specific category
     * @param {string} category - Game category
     * @param {number} limit - Number of entries to retrieve
     * @returns {Promise<Object>} Leaderboard data
     */
    async getLeaderboard(category, limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/${category}?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders(),
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            throw error;
        }
    }

    /**
     * Get all leaderboards
     * @param {number} limit - Number of entries per category
     * @returns {Promise<Object>} All leaderboard data
     */
    async getAllLeaderboards(limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/all?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders(),
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch leaderboards');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching leaderboards:', error);
            // Return fallback data from static file
            return this.getFallbackLeaderboards();
        }
    }

    /**
     * Get user's personal statistics
     * @returns {Promise<Object>} User stats
     */
    async getUserStats() {
        try {
            const response = await fetch(`${this.baseURL}/user/stats`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw error;
        }
    }

    /**
     * Get user's score history for a category
     * @param {string} category - Game category
     * @param {number} limit - Number of entries to retrieve
     * @returns {Promise<Object>} User's score history
     */
    async getUserHistory(category, limit = 20) {
        try {
            const response = await fetch(`${this.baseURL}/user/history/${category}?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user history');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user history:', error);
            throw error;
        }
    }

    /**
     * Fallback leaderboard data from static file
     * @returns {Promise<Object>} Static leaderboard data
     */
    async getFallbackLeaderboards() {
        try {
            const response = await fetch('/leaderboard.json');
            const data = await response.json();
            
            // Transform static data to match API format
            const transformedData = {
                status: 'success',
                message: 'Leaderboards retrieved from fallback data',
                data: {
                    leaderboards: {},
                    lastUpdated: new Date().toISOString()
                }
            };

            // Transform each category
            Object.keys(data).forEach(category => {
                transformedData.data.leaderboards[category] = data[category].map((entry, index) => ({
                    rank: index + 1,
                    username: entry.name,
                    score: entry.score,
                    gameData: {
                        correctAnswers: Math.floor(entry.score / 10),
                        totalQuestions: 20,
                        timeTaken: 120,
                        difficulty: 'medium'
                    },
                    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
                }));
            });

            return transformedData;
        } catch (error) {
            console.error('Error loading fallback leaderboards:', error);
            throw error;
        }
    }

    /**
     * Update authentication token
     * @param {string} token - New authentication token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.token;
    }
}

// Create global instance
window.LeaderboardAPI = new LeaderboardAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardAPI;
}
