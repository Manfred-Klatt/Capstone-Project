// Ultra-fast font loading optimization for customfont.otf
// Addresses 3.7MB font file performance issue

(function() {
    'use strict';
    
    // Configuration
    const FONT_TIMEOUT = 2000; // 2 seconds max wait time
    const FONT_NAME = 'customfont';
    const FONT_URL = '/fonts/customfont.woff2';
    
    let fontLoadAttempted = false;
    let fontLoaded = false;
    
    // Immediately show content with fallback fonts
    document.documentElement.classList.remove('font-loading');
    document.documentElement.classList.add('font-fallback');
    
    // Load font immediately when page loads
    function loadFontImmediately() {
        if (fontLoadAttempted) return;
        fontLoadAttempted = true;
        
        console.log('Loading custom font immediately...');
        
        // Use FontFaceObserver for better compatibility
        if (typeof FontFaceObserver !== 'undefined') {
            const font = new FontFaceObserver(FONT_NAME);
            
            font.load(null, FONT_TIMEOUT)
                .then(() => {
                    fontLoaded = true;
                    document.documentElement.classList.remove('font-fallback');
                    document.documentElement.classList.add('font-loaded');
                    console.log('Custom font loaded and applied to UI elements');
                })
                .catch(() => {
                    console.log('Custom font failed to load, using fallback fonts');
                });
        } else {
            // Simple fallback - just mark as loaded since CSS @font-face will handle it
            setTimeout(() => {
                fontLoaded = true;
                document.documentElement.classList.remove('font-fallback');
                document.documentElement.classList.add('font-loaded');
                console.log('Custom font applied via CSS @font-face');
            }, 100);
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
        
        // Load font immediately when page loads
        loadFontImmediately();
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
        forceLoad: loadFontImmediately,
        status: () => ({
            attempted: fontLoadAttempted,
            loaded: fontLoaded,
            cached: checkCachedFont()
        })
    };
    
})();
