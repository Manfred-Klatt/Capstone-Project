/**
 * Security Configuration for Animal Crossing Quiz Game
 * Implements security headers, CSRF protection, and secure defaults
 */

class SecurityConfig {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.isSecureContext = window.location.protocol === 'https:';
        this.init();
    }

    init() {
        this.setupCSP();
        this.setupSecurityHeaders();
        this.preventXSS();
        this.setupCSRFProtection();
        this.monitorSecurity();
    }

    /**
     * Setup Content Security Policy
     */
    setupCSP() {
        if (this.isProduction) {
            // Add CSP meta tag if not already present
            if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
                const cspMeta = document.createElement('meta');
                cspMeta.httpEquiv = 'Content-Security-Policy';
                cspMeta.content = [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "font-src 'self' https://fonts.gstatic.com",
                    "img-src 'self' data: https:",
                    "connect-src 'self' https://capstone-project-production-3cce.up.railway.app",
                    "frame-ancestors 'none'",
                    "base-uri 'self'"
                ].join('; ');
                document.head.appendChild(cspMeta);
            }
        }
    }

    /**
     * Setup security headers via meta tags
     */
    setupSecurityHeaders() {
        const headers = [
            { name: 'X-Content-Type-Options', content: 'nosniff' },
            { name: 'X-Frame-Options', content: 'DENY' },
            { name: 'X-XSS-Protection', content: '1; mode=block' },
            { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
        ];

        headers.forEach(header => {
            if (!document.querySelector(`meta[http-equiv="${header.name}"]`)) {
                const meta = document.createElement('meta');
                meta.httpEquiv = header.name;
                meta.content = header.content;
                document.head.appendChild(meta);
            }
        });
    }

    /**
     * Prevent XSS attacks
     */
    preventXSS() {
        // Sanitize user input
        this.sanitizeInputs();
        
        // Override dangerous functions
        this.overrideDangerousFunctions();
    }

    /**
     * Sanitize all text inputs
     */
    sanitizeInputs() {
        document.addEventListener('input', (event) => {
            if (event.target.type === 'text' || event.target.type === 'email' || event.target.tagName === 'TEXTAREA') {
                event.target.value = this.sanitizeString(event.target.value);
            }
        });
    }

    /**
     * Sanitize string to prevent XSS
     * @param {string} str - Input string
     * @returns {string} Sanitized string
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        
        return str
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/script/gi, '') // Remove script tags
            .trim()
            .substring(0, 1000); // Limit length
    }

    /**
     * Override potentially dangerous functions
     */
    overrideDangerousFunctions() {
        // Override eval (should never be used)
        window.eval = function() {
            console.warn('🚨 eval() is disabled for security reasons');
            return null;
        };

        // Override document.write (dangerous for XSS)
        const originalWrite = document.write;
        document.write = function(content) {
            console.warn('🚨 document.write() intercepted for security');
            if (typeof content === 'string' && this.isContentSafe(content)) {
                return originalWrite.call(document, content);
            }
            return null;
        }.bind(this);
    }

    /**
     * Check if content is safe to write
     * @param {string} content - Content to check
     * @returns {boolean} Safety status
     */
    isContentSafe(content) {
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(content));
    }

    /**
     * Setup CSRF protection
     */
    setupCSRFProtection() {
        // Add CSRF token to all forms
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                this.addCSRFTokenToForm(form);
            }
        });

        // Add CSRF token to AJAX requests
        this.interceptAjaxRequests();
    }

    /**
     * Add CSRF token to form
     * @param {HTMLFormElement} form - Form element
     */
    addCSRFTokenToForm(form) {
        if (!form.querySelector('input[name="csrf_token"]')) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = window.secureTokenManager ? window.secureTokenManager.generateCSRFToken() : '';
            form.appendChild(csrfInput);
        }
    }

    /**
     * Intercept AJAX requests to add CSRF protection
     */
    interceptAjaxRequests() {
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // Add CSRF token to non-GET requests
            if (options.method && options.method !== 'GET') {
                options.headers = options.headers || {};
                options.headers['X-CSRF-Token'] = window.secureTokenManager ? 
                    window.secureTokenManager.generateCSRFToken() : '';
            }
            return originalFetch.call(this, url, options);
        };
    }

    /**
     * Monitor security events
     */
    monitorSecurity() {
        // Monitor for suspicious activity
        this.monitorConsoleAccess();
        this.monitorDevTools();
        this.monitorLocalStorageAccess();
    }

    /**
     * Monitor console access in production
     */
    monitorConsoleAccess() {
        if (this.isProduction) {
            const originalLog = console.log;
            console.log = function(...args) {
                // Filter sensitive data from logs
                const filteredArgs = args.map(arg => {
                    if (typeof arg === 'string') {
                        return arg.replace(/Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, 'Bearer [REDACTED]');
                    }
                    return arg;
                });
                return originalLog.apply(console, filteredArgs);
            };
        }
    }

    /**
     * Monitor DevTools opening in production
     */
    monitorDevTools() {
        if (this.isProduction) {
            let devtools = { open: false, orientation: null };
            const threshold = 160;

            setInterval(() => {
                if (window.outerHeight - window.innerHeight > threshold || 
                    window.outerWidth - window.innerWidth > threshold) {
                    if (!devtools.open) {
                        devtools.open = true;
                        console.warn('🔒 Developer tools detected. Please note that this application contains sensitive user data.');
                    }
                } else {
                    devtools.open = false;
                }
            }, 500);
        }
    }

    /**
     * Monitor localStorage access for sensitive data
     */
    monitorLocalStorageAccess() {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            // Warn about storing sensitive data in localStorage
            if (key.includes('token') || key.includes('password') || key.includes('secret')) {
                console.warn(`🚨 Storing potentially sensitive data in localStorage: ${key}`);
                console.warn('Consider using sessionStorage or secure token manager instead');
            }
            return originalSetItem.call(localStorage, key, value);
        };
    }

    /**
     * Validate environment security
     * @returns {object} Security status
     */
    validateSecurity() {
        const issues = [];
        const warnings = [];

        // Check HTTPS in production
        if (this.isProduction && !this.isSecureContext) {
            issues.push('Application is not served over HTTPS in production');
        }

        // Check for mixed content
        if (this.isSecureContext) {
            const insecureResources = Array.from(document.querySelectorAll('script[src], link[href], img[src]'))
                .filter(el => {
                    const url = el.src || el.href;
                    return url && url.startsWith('http://');
                });
            
            if (insecureResources.length > 0) {
                warnings.push(`${insecureResources.length} insecure resources found (HTTP instead of HTTPS)`);
            }
        }

        // Check for inline scripts
        const inlineScripts = document.querySelectorAll('script:not([src])');
        if (inlineScripts.length > 0) {
            warnings.push(`${inlineScripts.length} inline scripts found (potential CSP issues)`);
        }

        return {
            secure: issues.length === 0,
            issues,
            warnings,
            environment: {
                production: this.isProduction,
                secure: this.isSecureContext,
                domain: window.location.hostname
            }
        };
    }
}

// Initialize security configuration
document.addEventListener('DOMContentLoaded', () => {
    window.securityConfig = new SecurityConfig();
    
    // Log security status in development
    if (!window.securityConfig.isProduction) {
        const status = window.securityConfig.validateSecurity();
        console.log('🔒 Security Status:', status);
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityConfig;
}
