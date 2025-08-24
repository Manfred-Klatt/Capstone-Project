// Optimized background image loader for improved performance
// Implements progressive loading with fallback gradient

(function() {
    'use strict';
    
    // Configuration
    const BACKGROUND_TIMEOUT = 3000; // 3 seconds max wait time
    const BACKGROUND_SVG = 'images/background.svg';
    
    // No format detection needed since we're only using SVG
    
    let backgroundLoaded = false;
    
    // Function to initialize loading state when DOM is ready
    function initLoadingState() {
        if (document.body) {
            document.body.classList.add('bg-loading');
        }
    }
    
    // No WebP detection needed since we're only using SVG
    
    // Function to load background image progressively
    function loadBackgroundImage() {
        const backgroundUrl = BACKGROUND_SVG;
        
        // Create a new image to preload
        const img = new Image();
        
        // Set up timeout to prevent blocking
        const timeoutId = setTimeout(() => {
            // Silently keep gradient background if image takes too long
        }, BACKGROUND_TIMEOUT);
        
        img.onload = function() {
            clearTimeout(timeoutId);
            if (!backgroundLoaded && document.body) {
                backgroundLoaded = true;
                
                // Update CSS custom property with the loaded image
                document.documentElement.style.setProperty('--background-image', `url('${backgroundUrl}')`);
                
                // Smooth transition to background image
                document.body.classList.remove('bg-loading');
                document.body.classList.add('bg-loaded');
                console.log(`Background image loaded successfully: ${backgroundUrl}`);
            }
        };
        
        img.onerror = function() {
            clearTimeout(timeoutId);
            console.log('SVG background failed to load, keeping gradient');
            // Keep the gradient background as fallback
        };
        
        // Start loading the image
        img.src = backgroundUrl;
    }
    
    // Function to check if background is already cached
    function checkCachedBackground() {
        const backgroundUrl = BACKGROUND_SVG;
        const img = new Image();
        
        img.onload = function() {
            if (img.complete && img.naturalWidth > 0 && document.body) {
                backgroundLoaded = true;
                document.documentElement.style.setProperty('--background-image', `url('${backgroundUrl}')`);
                document.body.classList.remove('bg-loading');
                document.body.classList.add('bg-loaded');
                // Background image found in cache
                return true;
            }
            return false;
        };
        
        img.src = backgroundUrl;
        
        // If image loads immediately (cached), the onload will fire
        return img.complete && img.naturalWidth > 0;
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
                loadBackgroundImage();
            }
        }, 1000);
    }
    
    // No need to detect image format support since we're only using SVG
    
    // Initialize when DOM is ready
    function init() {
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
