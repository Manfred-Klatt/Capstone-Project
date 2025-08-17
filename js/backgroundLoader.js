// Optimized background image loader for improved performance
// Implements progressive loading with fallback gradient

(function() {
    'use strict';
    
    // Configuration
    const BACKGROUND_TIMEOUT = 3000; // 3 seconds max wait time
    const BACKGROUND_WEBP = 'images/background.webp';
    const BACKGROUND_JPG = 'images/background.jpg';
    
    let webpSupported = false;
    
    let backgroundLoaded = false;
    
    // Function to initialize loading state when DOM is ready
    function initLoadingState() {
        if (document.body) {
            document.body.classList.add('bg-loading');
        }
    }
    
    // Function to detect WebP support
    function detectWebPSupport() {
        return new Promise((resolve) => {
            const webp = new Image();
            webp.onload = webp.onerror = function () {
                webpSupported = (webp.height === 2);
                resolve(webpSupported);
            };
            webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }
    
    // Function to load background image progressively with WebP/JPG fallback
    function loadBackgroundImage() {
        const backgroundUrl = webpSupported ? BACKGROUND_WEBP : BACKGROUND_JPG;
        
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
            // If WebP fails, try JPG fallback
            if (webpSupported && backgroundUrl === BACKGROUND_WEBP) {
                console.log('WebP failed, trying JPG fallback');
                webpSupported = false;
                loadBackgroundImage(); // Retry with JPG
            } else {
                console.log('Background image failed to load, keeping gradient');
                // Keep the gradient background as fallback
            }
        };
        
        // Start loading the image
        img.src = backgroundUrl;
    }
    
    // Function to check if background is already cached
    function checkCachedBackground() {
        const backgroundUrl = webpSupported ? BACKGROUND_WEBP : BACKGROUND_JPG;
        const img = new Image();
        
        img.onload = function() {
            if (img.complete && img.naturalWidth > 0 && document.body) {
                backgroundLoaded = true;
                document.documentElement.style.setProperty('--background-image', `url('${backgroundUrl}')`);
                document.body.classList.remove('bg-loading');
                document.body.classList.add('bg-loaded');
                console.log('Background image found in cache');
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
