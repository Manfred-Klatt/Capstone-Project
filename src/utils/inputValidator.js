/**
 * Input Validation and Sanitization Utilities
 * Provides comprehensive validation for user inputs to prevent injection attacks
 */

const validator = require('validator');
const AppError = require('./appError');

class InputValidator {
    /**
     * Sanitize string input by removing potentially dangerous characters
     * @param {string} input - Input string to sanitize
     * @param {object} options - Sanitization options
     * @returns {string} - Sanitized string
     */
    static sanitizeString(input, options = {}) {
        if (typeof input !== 'string') {
            return '';
        }

        let sanitized = input.trim();
        
        // Remove null bytes and control characters
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
        
        // Remove HTML tags if specified
        if (options.stripHtml !== false) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        }
        
        // Remove script tags and javascript: protocols
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        
        // Limit length if specified
        if (options.maxLength) {
            sanitized = sanitized.substring(0, options.maxLength);
        }
        
        return sanitized;
    }

    /**
     * Validate username input
     * @param {string} username - Username to validate
     * @returns {object} - Validation result
     */
    static validateUsername(username) {
        const sanitized = this.sanitizeString(username, { maxLength: 20 });
        
        const errors = [];
        
        if (!sanitized) {
            errors.push('Username is required');
        } else {
            if (sanitized.length < 3) {
                errors.push('Username must be at least 3 characters long');
            }
            if (sanitized.length > 20) {
                errors.push('Username must be less than 20 characters long');
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
                errors.push('Username can only contain letters, numbers, underscores, and hyphens');
            }
        }
        
        return {
            isValid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate email input
     * @param {string} email - Email to validate
     * @returns {object} - Validation result
     */
    static validateEmail(email) {
        const sanitized = this.sanitizeString(email, { maxLength: 254 }).toLowerCase();
        
        const errors = [];
        
        if (!sanitized) {
            errors.push('Email is required');
        } else if (!validator.isEmail(sanitized)) {
            errors.push('Please provide a valid email address');
        }
        
        return {
            isValid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate password input
     * @param {string} password - Password to validate
     * @returns {object} - Validation result
     */
    static validatePassword(password) {
        const errors = [];
        
        if (!password) {
            errors.push('Password is required');
        } else {
            if (password.length < 8) {
                errors.push('Password must be at least 8 characters long');
            }
            if (password.length > 128) {
                errors.push('Password must be less than 128 characters long');
            }
            // Check for at least one letter and one number for stronger passwords
            if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
                errors.push('Password must contain at least one letter and one number');
            }
        }
        
        return {
            isValid: errors.length === 0,
            sanitized: password, // Don't sanitize passwords
            errors
        };
    }

    /**
     * Validate game category
     * @param {string} category - Game category to validate
     * @returns {object} - Validation result
     */
    static validateCategory(category) {
        const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
        const sanitized = this.sanitizeString(category).toLowerCase();
        
        const errors = [];
        
        if (!sanitized) {
            errors.push('Category is required');
        } else if (!validCategories.includes(sanitized)) {
            errors.push('Invalid category. Must be one of: ' + validCategories.join(', '));
        }
        
        return {
            isValid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate score input
     * @param {any} score - Score to validate
     * @returns {object} - Validation result
     */
    static validateScore(score) {
        const errors = [];
        let sanitized = 0;
        
        if (score === null || score === undefined) {
            errors.push('Score is required');
        } else {
            const numScore = Number(score);
            if (isNaN(numScore)) {
                errors.push('Score must be a valid number');
            } else if (numScore < 0) {
                errors.push('Score cannot be negative');
            } else if (numScore > 1000000) {
                errors.push('Score is too high');
            } else {
                sanitized = Math.floor(numScore); // Ensure integer
            }
        }
        
        return {
            isValid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate MongoDB ObjectId
     * @param {string} id - ID to validate
     * @returns {object} - Validation result
     */
    static validateObjectId(id) {
        const sanitized = this.sanitizeString(id);
        const errors = [];
        
        if (!sanitized) {
            errors.push('ID is required');
        } else if (!validator.isMongoId(sanitized)) {
            errors.push('Invalid ID format');
        }
        
        return {
            isValid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate and sanitize multiple inputs at once
     * @param {object} inputs - Object containing input values
     * @param {object} rules - Validation rules for each input
     * @returns {object} - Combined validation result
     */
    static validateInputs(inputs, rules) {
        const results = {};
        const allErrors = [];
        let isValid = true;
        
        for (const [field, value] of Object.entries(inputs)) {
            const rule = rules[field];
            if (!rule) continue;
            
            let result;
            switch (rule.type) {
                case 'username':
                    result = this.validateUsername(value);
                    break;
                case 'email':
                    result = this.validateEmail(value);
                    break;
                case 'password':
                    result = this.validatePassword(value);
                    break;
                case 'category':
                    result = this.validateCategory(value);
                    break;
                case 'score':
                    result = this.validateScore(value);
                    break;
                case 'objectId':
                    result = this.validateObjectId(value);
                    break;
                case 'string':
                    result = {
                        isValid: true,
                        sanitized: this.sanitizeString(value, rule.options || {}),
                        errors: []
                    };
                    break;
                default:
                    result = {
                        isValid: false,
                        sanitized: value,
                        errors: [`Unknown validation type: ${rule.type}`]
                    };
            }
            
            results[field] = result;
            if (!result.isValid) {
                isValid = false;
                allErrors.push(...result.errors);
            }
        }
        
        return {
            isValid,
            results,
            errors: allErrors
        };
    }

    /**
     * Create validation middleware for Express routes
     * @param {object} rules - Validation rules
     * @returns {function} - Express middleware function
     */
    static createValidationMiddleware(rules) {
        return (req, res, next) => {
            const validation = this.validateInputs(req.body, rules);
            
            if (!validation.isValid) {
                return next(new AppError(validation.errors.join(', '), 400));
            }
            
            // Replace req.body with sanitized values
            for (const [field, result] of Object.entries(validation.results)) {
                req.body[field] = result.sanitized;
            }
            
            next();
        };
    }
}

module.exports = InputValidator;
