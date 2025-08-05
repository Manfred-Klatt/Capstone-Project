// Font installer script for Animal Crossing font
// This script ensures the custom font is loaded before showing content

document.addEventListener('DOMContentLoaded', function() {
    // Set initial loading state
    document.documentElement.classList.add('font-loading');
    
    // Check if the font is already loaded
    const checkFont = new FontFaceObserver('ACfont');
    
    // Try to load the font with a timeout
    checkFont.load(null, 5000).then(function() {
        // Font is available
        document.documentElement.classList.remove('font-loading', 'font-fallback');
        document.documentElement.classList.add('font-loaded');
    }).catch(function() {
        // Font is not available, fallback to system fonts
        console.warn('Custom font could not be loaded, falling back to system fonts');
        document.documentElement.classList.remove('font-loading');
        document.documentElement.classList.add('font-fallback');
    });
});
