// Ultra-fast font loading optimization for ACfont.otf
// Addresses 3.7MB font file performance issue

(function() {
    'use strict';
    
    // Configuration
    const FONT_TIMEOUT = 2000; // 2 seconds max wait time
    const FONT_NAME = 'ACfont';
    const FONT_URL = '/fonts/ACfont.woff2';
    
    let fontLoadAttempted = false;
    let fontLoaded = false;
    
    // Immediately show content with fallback fonts
    document.documentElement.classList.remove('font-loading');
    document.documentElement.classList.add('font-fallback');
    
    // Performance optimization: Only load font on user interaction
    function loadFontOnInteraction() {
        if (fontLoadAttempted) return;
        fontLoadAttempted = true;
        
        console.log('Loading custom font on user interaction...');
        
        // Use modern font loading API if available
        if ('fonts' in document) {
            // Try WOFF2 first (fastest), then fallback to OTF
            const fontFace = new FontFace(FONT_NAME, `url(${FONT_URL}), url(/fonts/ACfont.otf)`, {
                display: 'swap',
                weight: 'normal',
                style: 'normal'
            });
            
            // Set a timeout to prevent blocking
            const timeoutId = setTimeout(() => {
                console.log('Font loading timeout - continuing with system fonts');
            }, FONT_TIMEOUT);
            
            fontFace.load()
                .then(loadedFont => {
                    clearTimeout(timeoutId);
                    if (!fontLoaded) {
                        document.fonts.add(loadedFont);
                        fontLoaded = true;
                        
                        // Apply font only to headers for performance
                        document.documentElement.classList.remove('font-fallback');
                        document.documentElement.classList.add('font-loaded');
                        console.log('Custom font loaded and applied to headers only');
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.log('Custom font failed to load, using system fonts:', error.message);
                });
        } else {
            // Fallback for older browsers
            console.log('FontFace API not supported, using system fonts');
        }
    }
    
    // Performance optimization: Check if font is already cached
    function checkCachedFont() {
        if (document.fonts && document.fonts.check) {
            try {
                if (document.fonts.check(`16px ${FONT_NAME}`)) {
                    fontLoaded = true;
                    document.documentElement.classList.remove('font-fallback');
                    document.documentElement.classList.add('font-loaded');
                    console.log('Custom font found in cache');
                    return true;
                }
            } catch (e) {
                console.log('Font check failed, continuing with fallback');
            }
        }
        return false;
    }
    
    // Initialize font loading strategy
    function initFontLoading() {
        // First check if font is already available
        if (checkCachedFont()) {
            return;
        }
        
        // Load font on first user interaction (click, touch, scroll)
        const interactionEvents = ['click', 'touchstart', 'scroll', 'keydown'];
        
        function handleInteraction() {
            loadFontOnInteraction();
            // Remove event listeners after first interaction
            interactionEvents.forEach(event => {
                document.removeEventListener(event, handleInteraction, { passive: true });
            });
        }
        
        // Add event listeners for user interaction
        interactionEvents.forEach(event => {
            document.addEventListener(event, handleInteraction, { passive: true });
        });
        
        // Fallback: Load font after 3 seconds if no interaction
        setTimeout(() => {
            if (!fontLoadAttempted) {
                console.log('Loading font after timeout (no user interaction)');
                loadFontOnInteraction();
            }
        }, 3000);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFontLoading);
    } else {
        initFontLoading();
    }
    
    // Expose font loading status for debugging
    window.FontOptimizer = {
        isLoaded: () => fontLoaded,
        forceLoad: loadFontOnInteraction,
        status: () => ({
            attempted: fontLoadAttempted,
            loaded: fontLoaded,
            cached: checkCachedFont()
        })
    };
    
})();
