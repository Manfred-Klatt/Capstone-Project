/**
 * HTML Sanitization Utilities
 * Provides safe alternatives to innerHTML for preventing XSS attacks
 */

class HTMLSanitizer {
    /**
     * Safely set text content (prevents XSS)
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text content to set
     */
    static setTextContent(element, text) {
        if (!element) return;
        element.textContent = text || '';
    }

    /**
     * Safely create HTML with limited allowed tags
     * @param {string} html - HTML string to sanitize
     * @returns {string} - Sanitized HTML
     */
    static sanitizeHTML(html) {
        if (!html) return '';
        
        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.textContent = html; // This escapes all HTML
        
        // Allow only specific formatting
        let sanitized = temp.innerHTML;
        
        // Allow basic formatting tags (but escape their content)
        const allowedTags = {
            '&lt;b&gt;': '<b>',
            '&lt;/b&gt;': '</b>',
            '&lt;i&gt;': '<i>',
            '&lt;/i&gt;': '</i>',
            '&lt;strong&gt;': '<strong>',
            '&lt;/strong&gt;': '</strong>',
            '&lt;em&gt;': '<em>',
            '&lt;/em&gt;': '</em>'
        };
        
        for (const [escaped, tag] of Object.entries(allowedTags)) {
            sanitized = sanitized.replace(new RegExp(escaped, 'g'), tag);
        }
        
        return sanitized;
    }

    /**
     * Safely create a score display element
     * @param {number} index - Position index
     * @param {string} name - Player name
     * @param {number} score - Player score
     * @returns {HTMLElement} - Safe DOM element
     */
    static createScoreElement(index, name, score) {
        const li = document.createElement('li');
        
        const nameSpan = document.createElement('span');
        nameSpan.style.color = 'var(--text-color)';
        nameSpan.textContent = `${index + 1}. ${name}`;
        
        const scoreSpan = document.createElement('span');
        scoreSpan.style.color = '#4CAF50';
        scoreSpan.textContent = score.toString();
        
        li.appendChild(nameSpan);
        li.appendChild(scoreSpan);
        
        return li;
    }

    /**
     * Safely create a notification element
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     * @returns {HTMLElement} - Safe notification element
     */
    static createNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'notification-message';
        messageSpan.textContent = message;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.textContent = '×';
        closeButton.onclick = function() {
            this.parentElement.parentElement.remove();
        };
        
        content.appendChild(messageSpan);
        content.appendChild(closeButton);
        notification.appendChild(content);
        
        return notification;
    }

    /**
     * Safely create placement message element
     * @param {number} placement - Player placement (1, 2, 3, etc.)
     * @returns {HTMLElement} - Safe placement message element
     */
    static createPlacementMessage(placement) {
        const messageElement = document.createElement('p');
        messageElement.style.fontWeight = 'bold';
        
        let message, color, emoji;
        
        switch (placement) {
            case 1:
                message = 'You achieved 1st place!';
                color = '#ffd700';
                emoji = '🏆';
                break;
            case 2:
                message = 'You achieved 2nd place!';
                color = '#c0c0c0';
                emoji = '🥈';
                break;
            case 3:
                message = 'You achieved 3rd place!';
                color = '#cd7f32';
                emoji = '🥉';
                break;
            default:
                message = `You achieved ${placement}th place!`;
                color = '#ffa500';
                emoji = '🎉';
        }
        
        messageElement.style.color = color;
        messageElement.textContent = `${message} ${emoji}`;
        
        return messageElement;
    }

    /**
     * Safely update leaderboard display
     * @param {HTMLElement} container - Container element
     * @param {Array} scores - Array of score objects
     */
    static updateLeaderboardDisplay(container, scores) {
        if (!container) return;
        
        // Clear container safely
        container.textContent = '';
        
        if (!scores || scores.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.textContent = 'No scores yet';
            container.appendChild(emptyDiv);
            return;
        }
        
        const ul = document.createElement('ul');
        scores.forEach((score, index) => {
            const li = this.createScoreElement(index, score.name || score.username, score.score);
            ul.appendChild(li);
        });
        
        container.appendChild(ul);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTMLSanitizer;
} else {
    window.HTMLSanitizer = HTMLSanitizer;
}
