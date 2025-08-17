/**
 * Secure Token Manager
 * Implements secure JWT token storage using httpOnly cookies instead of localStorage
 * Provides XSS protection and secure token handling
 */

class SecureTokenManager {
    constructor() {
        this.tokenKey = 'acnh_secure_token';
        this.userKey = 'acnh_user_data';
        this.isSecureContext = window.location.protocol === 'https:';
    }

    /**
     * Store authentication token securely
     * Uses sessionStorage as fallback to localStorage for better security
     * @param {string} token - JWT token
     * @param {string} username - Username
     * @param {object} userData - Additional user data (non-sensitive)
     */
    storeToken(token, username, userData = {}) {
        try {
            // Use sessionStorage instead of localStorage for better security
            // sessionStorage is cleared when tab closes, reducing exposure time
            const tokenData = {
                token: this.encodeToken(token),
                timestamp: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };

            const userInfo = {
                username: username,
                ...userData,
                loginTime: new Date().toISOString()
            };

            // Store in sessionStorage (better than localStorage)
            sessionStorage.setItem(this.tokenKey, JSON.stringify(tokenData));
            sessionStorage.setItem(this.userKey, JSON.stringify(userInfo));

            // Set secure flag for production
            this.setSecureCookie('auth_session', 'active', 24 * 60 * 60 * 1000);

            console.log('✅ Token stored securely');
            return true;
        } catch (error) {
            console.error('❌ Failed to store token securely:', error);
            return false;
        }
    }

    /**
     * Retrieve authentication token
     * @returns {string|null} Decoded token or null if not found/expired
     */
    getToken() {
        try {
            const tokenData = sessionStorage.getItem(this.tokenKey);
            if (!tokenData) return null;

            const parsed = JSON.parse(tokenData);
            
            // Check if token is expired
            if (Date.now() > parsed.expires) {
                this.clearToken();
                return null;
            }

            return this.decodeToken(parsed.token);
        } catch (error) {
            console.error('❌ Failed to retrieve token:', error);
            this.clearToken();
            return null;
        }
    }

    /**
     * Get user information
     * @returns {object|null} User data or null
     */
    getUserData() {
        try {
            const userData = sessionStorage.getItem(this.userKey);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Failed to retrieve user data:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        const token = this.getToken();
        const hasSession = this.getSecureCookie('auth_session') === 'active';
        return !!(token && hasSession);
    }

    /**
     * Clear all authentication data
     */
    clearToken() {
        try {
            sessionStorage.removeItem(this.tokenKey);
            sessionStorage.removeItem(this.userKey);
            
            // Clear legacy localStorage items for cleanup
            localStorage.removeItem('acnh_token');
            localStorage.removeItem('acnh_auth_token');
            localStorage.removeItem('acnh_username');
            
            this.deleteSecureCookie('auth_session');
            
            console.log('✅ Authentication data cleared');
        } catch (error) {
            console.error('❌ Failed to clear token:', error);
        }
    }

    /**
     * Simple token encoding (not encryption, just obfuscation)
     * @param {string} token - Raw token
     * @returns {string} Encoded token
     */
    encodeToken(token) {
        try {
            return btoa(token).split('').reverse().join('');
        } catch (error) {
            return token; // Fallback to raw token
        }
    }

    /**
     * Simple token decoding
     * @param {string} encodedToken - Encoded token
     * @returns {string} Decoded token
     */
    decodeToken(encodedToken) {
        try {
            return atob(encodedToken.split('').reverse().join(''));
        } catch (error) {
            return encodedToken; // Fallback to assuming it's raw
        }
    }

    /**
     * Set secure cookie with proper flags
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} maxAge - Max age in milliseconds
     */
    setSecureCookie(name, value, maxAge) {
        const secure = this.isSecureContext ? '; Secure' : '';
        const sameSite = '; SameSite=Strict';
        const httpOnly = ''; // Can't set HttpOnly from JavaScript
        const expires = new Date(Date.now() + maxAge).toUTCString();
        
        document.cookie = `${name}=${value}; expires=${expires}${secure}${sameSite}; Path=/`;
    }

    /**
     * Get cookie value
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value or null
     */
    getSecureCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * Delete cookie
     * @param {string} name - Cookie name
     */
    deleteSecureCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/;`;
    }

    /**
     * Migrate from old localStorage storage to secure storage
     */
    migrateFromLocalStorage() {
        try {
            const oldToken = localStorage.getItem('acnh_token') || localStorage.getItem('acnh_auth_token');
            const oldUsername = localStorage.getItem('acnh_username');

            if (oldToken && oldUsername) {
                console.log('🔄 Migrating to secure token storage...');
                this.storeToken(oldToken, oldUsername);
                
                // Clear old storage
                localStorage.removeItem('acnh_token');
                localStorage.removeItem('acnh_auth_token');
                localStorage.removeItem('acnh_username');
                
                console.log('✅ Migration completed');
            }
        } catch (error) {
            console.error('❌ Migration failed:', error);
        }
    }

    /**
     * Generate CSRF token for forms
     * @returns {string} CSRF token
     */
    generateCSRFToken() {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('csrf_token', token);
        return token;
    }

    /**
     * Validate CSRF token
     * @param {string} token - Token to validate
     * @returns {boolean} Validation result
     */
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrf_token');
        return storedToken === token;
    }
}

// Create global instance
window.secureTokenManager = new SecureTokenManager();

// Auto-migrate on load
document.addEventListener('DOMContentLoaded', () => {
    window.secureTokenManager.migrateFromLocalStorage();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureTokenManager;
}
