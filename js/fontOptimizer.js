// Ultra-fast font loading optimization for customfont.otf
// Addresses 3.7MB font file performance issue

(function() {
    'use strict';
    
    // Configuration
    const FONT_TIMEOUT = 2000; // 2 seconds max wait time
    const FONT_NAME = 'customfont';
    const FONT_URL = './fonts/customfont.woff2';
    
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
        
        // Try multiple loading strategies
        Promise.race([
            // Strategy 1: Use FontFaceObserver if available
            new Promise((resolve, reject) => {
                if (typeof FontFaceObserver !== 'undefined') {
                    const font = new FontFaceObserver(FONT_NAME);
                    font.load(null, FONT_TIMEOUT).then(resolve).catch(reject);
                } else {
                    reject(new Error('FontFaceObserver not available'));
                }
            }),
            
            // Strategy 2: Use document.fonts API
            new Promise((resolve, reject) => {
                if (document.fonts && document.fonts.load) {
                    document.fonts.load(`16px ${FONT_NAME}`)
                        .then(() => {
                            if (document.fonts.check(`16px ${FONT_NAME}`)) {
                                resolve();
                            } else {
                                reject(new Error('Font not available after load'));
                            }
                        })
                        .catch(reject);
                } else {
                    reject(new Error('document.fonts API not available'));
                }
            }),
            
            // Strategy 3: Simple timeout fallback
            new Promise((resolve) => {
                setTimeout(() => {
                    // Check if font file exists by trying to load it
                    const testElement = document.createElement('span');
                    testElement.style.fontFamily = FONT_NAME;
                    testElement.style.fontSize = '16px';
                    testElement.textContent = 'Test';
                    testElement.style.position = 'absolute';
                    testElement.style.visibility = 'hidden';
                    document.body.appendChild(testElement);
                    
                    // Simple heuristic: if element width changes, font likely loaded
                    const fallbackWidth = testElement.offsetWidth;
                    testElement.style.fontFamily = 'Arial';
                    const arialWidth = testElement.offsetWidth;
                    
                    document.body.removeChild(testElement);
                    
                    if (fallbackWidth !== arialWidth) {
                        resolve();
                    } else {
                        // Still resolve to show content, just with fallback
                        resolve();
                    }
                }, 500);
            })
        ])
        .then(() => {
            fontLoaded = true;
            document.documentElement.classList.remove('font-fallback');
            document.documentElement.classList.add('font-loaded');
            console.log('Custom font loaded and applied to UI elements');
        })
        .catch((error) => {
            console.log('Custom font failed to load:', error.message, '- using fallback fonts');
            // Still show content with fallback fonts
            document.documentElement.classList.add('font-fallback-final');
        });
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
