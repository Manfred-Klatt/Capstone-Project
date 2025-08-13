// Optimized font installer script for Animal Crossing font
// Fast loading with immediate content display and smooth font swap

(function() {
    // Show content immediately - don't hide the page
    document.documentElement.classList.add('font-fallback');
    
    let fontLoaded = false;
    
    // Preload font as early as possible
    function loadFont() {
        // Check if font is already available in document.fonts
        if (document.fonts && document.fonts.check && document.fonts.check('16px ACfont')) {
            fontLoaded = true;
            document.documentElement.classList.remove('font-fallback');
            document.documentElement.classList.add('font-loaded');
            console.log('Custom font already available');
            return;
        }
        
        // Define and load the font face
        const fontFace = new FontFace('ACfont', 'url(/fonts/ACfont.otf)', {
            display: 'swap' // Use font-display: swap for faster rendering
        });
        
        // Load the font with optimized handling
        fontFace.load().then(function(loadedFont) {
            if (!fontLoaded) {
                document.fonts.add(loadedFont);
                fontLoaded = true;
                
                // Smooth transition to custom font
                document.documentElement.classList.remove('font-fallback');
                document.documentElement.classList.add('font-loaded');
                console.log('Custom font loaded successfully');
            }
        }).catch(function(error) {
            // Keep using fallback fonts - no error needed
            console.log('Using system fonts (custom font not available)');
        });
        
        // Quick fallback - if font doesn't load in 1 second, continue with system fonts
        setTimeout(function() {
            if (!fontLoaded) {
                console.log('Using system fonts for optimal performance');
            }
        }, 1000);
    }
    
    // Start loading immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFont);
    } else {
        loadFont();
    }
})();
