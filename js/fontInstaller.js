// Font installer script for Animal Crossing font
// This script ensures the custom font is loaded before showing content

document.addEventListener('DOMContentLoaded', function() {
    // Set initial loading state
    document.documentElement.classList.add('font-loading');
    
    // Define the font face
    const fontFace = new FontFace('ACfont', 'url(/fonts/ACfont.otf)');
    
    // Load the font
    fontFace.load().then(function(loadedFont) {
        // Add the font to the document
        document.fonts.add(loadedFont);
        
        // Font is available
        document.documentElement.classList.remove('font-loading', 'font-fallback');
        document.documentElement.classList.add('font-loaded');
        console.log('Custom font loaded successfully');
    }).catch(function(error) {
        // Font is not available, fallback to system fonts
        console.warn('Custom font could not be loaded, falling back to system fonts:', error);
        document.documentElement.classList.remove('font-loading');
        document.documentElement.classList.add('font-fallback');
    });
    
    // Fallback timeout in case font loading takes too long
    setTimeout(function() {
        if (document.documentElement.classList.contains('font-loading')) {
            console.warn('Font loading timeout, falling back to system fonts');
            document.documentElement.classList.remove('font-loading');
            document.documentElement.classList.add('font-fallback');
        }
    }, 5000);
});
