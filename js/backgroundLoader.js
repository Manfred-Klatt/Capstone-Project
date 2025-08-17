// Optimized background image loader for improved performance
// Implements progressive loading with fallback gradient

(function() {
    'use strict';
    
    // Configuration
    const BACKGROUND_TIMEOUT = 3000; // 3 seconds max wait time
    const BACKGROUND_URL = 'images/background.jpg';
    
    let backgroundLoaded = false;
    
    // Function to initialize loading state when DOM is ready
    function initLoadingState() {
        if (document.body) {
            document.body.classList.add('bg-loading');
        }
    }
    
    // Function to load background image progressively
    function loadBackgroundImage() {
        // Create a new image to preload
        const img = new Image();
        
        // Set up timeout to prevent blocking
        const timeoutId = setTimeout(() => {
            console.log('Background image loading timeout - keeping gradient');
            // Keep the gradient background if image takes too long
        }, BACKGROUND_TIMEOUT);
        
        img.onload = function() {
            clearTimeout(timeoutId);
            if (!backgroundLoaded && document.body) {
                backgroundLoaded = true;
                
                // Smooth transition to background image
                document.body.classList.remove('bg-loading');
                document.body.classList.add('bg-loaded');
                console.log('Background image loaded successfully');
            }
        };
        
        img.onerror = function() {
            clearTimeout(timeoutId);
            console.log('Background image failed to load, keeping gradient');
            // Keep the gradient background as fallback
        };
        
        // Start loading the image
        img.src = BACKGROUND_URL;
    }
    
    // Function to check if image is already cached
    function checkCachedBackground() {
        const img = new Image();
        img.onload = function() {
            if (img.complete && img.naturalWidth > 0 && document.body) {
                backgroundLoaded = true;
                document.body.classList.remove('bg-loading');
                document.body.classList.add('bg-loaded');
                console.log('Background image found in cache');
                return true;
            }
            return false;
        };
        img.src = BACKGROUND_URL;
    }
    
    // Initialize background loading strategy
    function initBackgroundLoading() {
        // Check if image is already cached
        if (checkCachedBackground()) {
            return;
        }
        
        // Load background on user interaction for better performance
        const interactionEvents = ['click', 'touchstart', 'scroll', 'mousemove'];
        
        function handleInteraction() {
            loadBackgroundImage();
            // Remove event listeners after first interaction
            interactionEvents.forEach(event => {
                document.removeEventListener(event, handleInteraction, { passive: true });
            });
        }
        
        // Add event listeners for user interaction
        interactionEvents.forEach(event => {
            document.addEventListener(event, handleInteraction, { passive: true });
        });
        
        // Fallback: Load background after 1 second if no interaction
        setTimeout(() => {
            if (!backgroundLoaded) {
                console.log('Loading background image after timeout');
                loadBackgroundImage();
            }
        }, 1000);
    }
    
    // Support for modern image formats (WebP, AVIF)
    function detectImageSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        // Check WebP support
        const webpSupport = canvas.toDataURL('image/webp').indexOf('webp') > -1;
        
        if (webpSupport) {
            console.log('WebP support detected - could use background.webp for better compression');
        }
        
        return {
            webp: webpSupport,
            avif: false // AVIF detection is more complex, would need feature detection
        };
    }
    
    // Initialize when DOM is ready
    function init() {
        detectImageSupport();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initLoadingState();
                initBackgroundLoading();
            });
        } else {
            initLoadingState();
            initBackgroundLoading();
        }
    }
    
    // Start initialization
    init();
    
    // Expose background loading status for debugging
    window.BackgroundLoader = {
        isLoaded: () => backgroundLoaded,
        forceLoad: loadBackgroundImage,
        status: () => ({
            loaded: backgroundLoaded,
            cached: checkCachedBackground()
        })
    };
    
})();
